import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import Fuse from "fuse.js";
import OpenAI from "openai";
  
// ✅ Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// In-memory rate limiter and cache (best-effort)
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60; // per IP per minute (raised)
const CACHE_TTL_MS = 120_000; // 2 minutes

// @ts-ignore
const rateStore: Map<string, { count: number; startedAt: number }> = (globalThis as any).__recRateStore || new Map();
// @ts-ignore
(globalThis as any).__recRateStore = rateStore;

// @ts-ignore
const respCache: Map<string, { at: number; value: any }> = (globalThis as any).__recRespCache || new Map();
// @ts-ignore
(globalThis as any).__recRespCache = respCache;
  
// Example dataset (could be startup ideas, founders’ tools, etc.)
const items = [
  { id: 1, title: "Startup Idea Validation", description: "Validate your business idea with AI insights" },
  { id: 2, title: "Pitch Deck Generator", description: "Create investor-ready pitch decks instantly" },
  { id: 3, title: "Market Research Assistant", description: "Get competitor and market analysis" },
  { id: 4, title: "Co-founder Matchmaking", description: "Find the right co-founder based on skills and vision" },
  { id: 5, title: "Fundraising Strategy", description: "AI-powered roadmap for raising capital" },
];

// ✅ FUSE.js setup
const fuse = new Fuse(items, {
  keys: ["title", "description"],
  threshold: 0.4,
});

// ✅ Cosine similarity
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dot / (normA * normB);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("q") || "").trim();
  const kind = (searchParams.get("kind") || "").toLowerCase();

  if (!query) return NextResponse.json([]);

  // If the request is for company database matches, use the fast local index
  if (kind === "companies") {
    await loadCompanyIndex();
    const matches = fastCompanySearch(query, 10);
    return NextResponse.json({ companies: matches, query, total: matches.length });
  }

  // Otherwise, default demo GET behavior: fuzzy + embedding ranking over demo items
  const fuzzyResults = fuse.search(query).map(res => res.item);
  const [queryEmbedding, ...candidateEmbeddings] = await Promise.all([
    client.embeddings.create({ model: "text-embedding-3-small", input: query }),
    ...fuzzyResults.map(item => client.embeddings.create({ model: "text-embedding-3-small", input: `${item.title} ${item.description}` }))
  ]);
  const queryVec = (queryEmbedding as any).data[0].embedding as number[];
  const ranked = fuzzyResults
    .map((item, idx) => {
      const candidateVec = (candidateEmbeddings[idx] as any).data[0].embedding as number[];
      const score = cosineSimilarity(queryVec, candidateVec);
      return { ...item, score };
    })
    .sort((a, b) => b.score - a.score);

  return NextResponse.json(ranked);
}

function extractCompaniesFromText(text: string): string[] {
  const out = new Set<string>();
  if (!text) return [];
  const cleaned = text.replace(/\s+/g, " ");
  // Pattern A: "at Company"
  const atMatch = cleaned.match(/\bat\s+([A-Z][A-Za-z0-9&'\- ]{2,})(?:,|\b)/);
  if (atMatch && atMatch[1]) out.add(atMatch[1].trim());
  // Pattern B: trailing org after dash or comma
  const dashParts = cleaned.split(/[-–—]\s*/);
  if (dashParts.length > 1) {
    const tail = dashParts[dashParts.length - 1];
    const candidate = tail.match(/([A-Z][A-Za-z0-9&'\- ]{2,})$/);
    if (candidate && candidate[1]) out.add(candidate[1].trim());
  }
  // Pattern C: University/Inc/LLC/Labs/Systems/etc.
  const orgRegex = /(University|College|Institute|Inc\.?|LLC|Ltd\.?|Labs|Systems|Technologies|Software|Group|Holdings|Solutions)$/i;
  const words = cleaned.split(/,|\u00B7|\||·/).map(s => s.trim());
  for (const w of words) {
    if (/^[A-Z][A-Za-z0-9&'\- ]{2,}$/.test(w) && orgRegex.test(w)) out.add(w);
  }
  return Array.from(out);
}

function getClientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  return "unknown";
}

// ==== Fast local company index (moved from /api/companies) ====
type CompanyIndex = {
  all: string[]; // original case
  // store tuples [original, lower] to avoid repeated lowercasing during queries
  prefix1: Record<string, [string,string][]>;
  prefix2: Record<string, [string,string][]>;
  prefix3: Record<string, [string,string][]>;
  ready: boolean;
};

// @ts-ignore
const g: any = globalThis as any;
if (!g.__REC_COMPANY_INDEX__) {
  g.__REC_COMPANY_INDEX__ = { all: [], prefix1: {}, prefix2: {}, prefix3: {}, ready: false } as CompanyIndex;
}
const companyIndex: CompanyIndex = g.__REC_COMPANY_INDEX__ as CompanyIndex;

// Simple LRU cache for company queries (server-side)
type CacheEntry = { q: string; res: string[] };
const COMPANY_CACHE_CAP = 500;
// @ts-ignore
const companyCache: Map<string, CacheEntry> = g.__REC_COMPANY_CACHE__ || new Map();
// @ts-ignore
g.__REC_COMPANY_CACHE__ = companyCache;

function addToIndex(name: string) {
  const lower = name.toLowerCase();
  const k1 = lower.slice(0, 1);
  const k2 = lower.slice(0, 2);
  const k3 = lower.slice(0, 3);
  if (k1) (companyIndex.prefix1[k1] ||= []).push([name, lower]);
  if (k2) (companyIndex.prefix2[k2] ||= []).push([name, lower]);
  if (k3) (companyIndex.prefix3[k3] ||= []).push([name, lower]);
}

async function loadCompanyIndex() {
  if (companyIndex.ready && companyIndex.all.length) return;
  const baseDir = path.join(process.cwd(), 'src', 'data');
  const prebuiltPath = path.join(baseDir, 'company_index_prefix3.json');
  const csvPath = path.join(baseDir, 'companies.csv');

  // Try prebuilt prefix index first for O(1) loads
  try {
    if (fs.existsSync(prebuiltPath)) {
      const raw = await fs.promises.readFile(prebuiltPath, 'utf-8');
      const obj = JSON.parse(raw) as Record<string, string[]>;
      companyIndex.prefix1 = {} as any;
      companyIndex.prefix2 = {} as any;
      companyIndex.prefix3 = {} as any;
      companyIndex.all = [];
      for (const [p3, arr] of Object.entries(obj)) {
        companyIndex.prefix3[p3] = arr.map((orig) => [orig, orig.toLowerCase()]);
        companyIndex.all.push(...arr);
      }
      companyIndex.ready = true;
      console.log(`[recommendations] Loaded prebuilt prefix3 index with ${companyIndex.all.length} companies`);
      return;
    }
  } catch (e) {
    console.warn('[recommendations] failed to load prebuilt index, falling back to CSV', e);
  }
  const seen = new Set<string>();
  const all: string[] = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row: any) => {
        const raw = row?.name ? String(row.name).trim() : '';
        if (!raw || seen.has(raw)) return;
        seen.add(raw);
        all.push(raw);
        addToIndex(raw);
      })
      .on('end', () => {
        companyIndex.all = all;
        companyIndex.ready = true;
        console.log(`[recommendations] Loaded ${all.length} companies`);
        resolve(true);
      })
      .on('error', (err: any) => { console.error('company CSV error', err); reject(err); });
  });
}

function fastCompanySearch(query: string, limit = 10): string[] {
  const q = query.toLowerCase();
  if (!q) return [];

  // LRU cache check
  const hit = companyCache.get(q);
  if (hit) {
    // refresh LRU order
    companyCache.delete(q);
    companyCache.set(q, hit);
    return hit.res.slice(0, limit);
  }

  let bucket: [string,string][] | undefined;
  if (q.length >= 3) bucket = companyIndex.prefix3[q.slice(0,3)];
  if (!bucket && q.length >= 2) bucket = companyIndex.prefix2[q.slice(0,2)];
  if (!bucket) bucket = companyIndex.prefix1[q.slice(0,1)] || [];
  if (!bucket?.length) return [];

  // Prefix-only for speed
  const res: string[] = [];
  for (let i=0;i<bucket.length && res.length<limit;i++) {
    const [orig, lower] = bucket[i];
    if (lower.startsWith(q)) res.push(orig);
  }

  // Cache result
  companyCache.set(q, { q, res });
  if (companyCache.size > COMPANY_CACHE_CAP) {
    // delete oldest
    const oldestKey = companyCache.keys().next().value as string | undefined;
    if (oldestKey) companyCache.delete(oldestKey);
  }

  return res.slice(0, limit);
}

function checkRateLimit(ip: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const rec = rateStore.get(ip);
  if (!rec || now - rec.startedAt >= RATE_LIMIT_WINDOW_MS) {
    rateStore.set(ip, { count: 1, startedAt: now });
    return { ok: true, retryAfter: 0 };
  }
  if (rec.count < RATE_LIMIT_MAX) {
    rec.count += 1;
    return { ok: true, retryAfter: 0 };
  }
  const retryAfter = Math.ceil((rec.startedAt + RATE_LIMIT_WINDOW_MS - now) / 1000);
  return { ok: false, retryAfter };
}

// ✅ LLM-powered: autocorrect + companies + predictions + suggestions
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(ip);
    if (!rl.ok) {
      return NextResponse.json({ error: "rate_limited", backoffSeconds: rl.retryAfter, autocorrect: null, companies: [], predictions: [], suggestions: [] }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const query: string = (body?.query || "").toString();
    const ctxItems: any[] = Array.isArray(body?.context?.items) ? body.context.items : [];

    // Short queries: do fast local-only to keep UX snappy and avoid hitting LLM
    if (!query || query.trim().length < 3) {
      const roles = ["CEO","CTO","Founder","VP","Director","Manager","Engineer","Developer","Designer","Marketing","Sales","Product"]; 
      const companies = Array.from(new Set(
        ctxItems
          .map((it: any) => String(it?.currentJob || it?.titleSummary || ""))
          .map((t: string) => t.match(/\bat\s+([^,|]+)/i)?.[1]?.trim())
          .filter(Boolean)
      )).slice(0, 8);
      const suggestions = Array.from(new Set([
        ...companies.map((c: string) => `${query} ${c}`),
        ...roles.map((r) => `${query} ${r}`)
      ])).slice(0, 10);
      return NextResponse.json({ autocorrect: null, companies, predictions: [], suggestions });
    }

    // Serve from cache if available
    const cacheKey = `v1:${query.toLowerCase()}`;
    const cached = respCache.get(cacheKey);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return NextResponse.json(cached.value);
    }

    // Derive company/name hints from context using multiple patterns
    const derivedCompanySet = new Set<string>();
    for (const it of ctxItems.slice(0, 20)) {
      const sources = [it?.currentJob, it?.titleSummary, it?.aboutSummary, it?.headline]
        .filter(Boolean)
        .map((s: string) => String(s));
      for (const s of sources) {
        extractCompaniesFromText(s).forEach((c) => derivedCompanySet.add(c));
      }
    }
    const derivedCompanies = Array.from(derivedCompanySet).slice(0, 10);

    const names = Array.from(new Set(
      ctxItems.map((it: any) => (it?.name ? String(it.name) : null)).filter(Boolean)
    )).slice(0, 12);

    const contextText = [
      derivedCompanies.length ? `Companies: ${derivedCompanies.join(", ")}` : "",
      names.length ? `Names: ${names.join(", ")}` : "",
    ].filter(Boolean).join("\n");

    const system = "You are a search suggest engine. Given a possibly misspelled LinkedIn-style query and optional context, produce JSON with: autocorrect (string|null), companies (string[] up to 8, likely employers or orgs), predictions (string[] up to 8, next-token style completions), suggestions (string[] up to 10, diverse query rewrites). Return STRICT JSON. No markdown.";
    const user = `Query: ${query}\n\nContext:\n${contextText || "(none)"}`;

    const resp = await client.chat.completions.create({
      model: process.env.RECOMMENDATIONS_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 350, // increased
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const raw = resp.choices?.[0]?.message?.content?.trim() || "";
    let json: any = {};
    try { json = JSON.parse(raw); } catch { json = {}; }

    const autocorrect = typeof json.autocorrect === "string" ? json.autocorrect : null;
    const companies = Array.isArray(json.companies) ? json.companies.filter((s: any) => typeof s === "string") : [];
    const predictions = Array.isArray(json.predictions) ? json.predictions.filter((s: any) => typeof s === "string") : [];
    const suggestions = Array.isArray(json.suggestions) ? json.suggestions.filter((s: any) => typeof s === "string") : [];

    // Merge with locally derived companies and fallback to them if LLM empty
    const mergedCompanies = Array.from(new Set([...
      derivedCompanies,
      ...companies,
    ])).slice(0, 8);

    // Merge in top local company matches as an additional signal
    await loadCompanyIndex();
    const topLocalCompanies = fastCompanySearch(query, 8);

    const value = {
      autocorrect,
      companies: Array.from(new Set([ ...mergedCompanies, ...topLocalCompanies ])).slice(0, 8),
      predictions: predictions.slice(0, 8),
      suggestions: suggestions.slice(0, 10),
    };

    respCache.set(cacheKey, { at: Date.now(), value });
    return NextResponse.json(value);
  } catch (e) {
    console.error("/api/recommendations POST error", e);
    return NextResponse.json({ autocorrect: null, companies: [], predictions: [], suggestions: [] }, { status: 200 });
  }
}
