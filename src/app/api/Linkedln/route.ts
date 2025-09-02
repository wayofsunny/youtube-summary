import { NextResponse } from "next/server";
import OpenAI from "openai";
export const runtime = 'nodejs';

const DEBUG = process.env.DEBUG_LINKEDIN === '1';

export async function POST(req: Request) {
  try {
    const { query, pageToken } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey) {
      if (DEBUG) console.error("Missing SERPAPI_API_KEY in environment.");
      return NextResponse.json({ error: "Missing SERPAPI_API_KEY in environment." }, { status: 500 });
    }

    // Use Google engine and restrict results to LinkedIn people profiles
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google");
    url.searchParams.set("q", `site:linkedin.com/in ${query}`);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("hl", "en");
    url.searchParams.set("gl", "us");
    const num = 10;
    url.searchParams.set("num", String(num));
    if (pageToken) {
      url.searchParams.set("start", String(pageToken));
    }

    if (DEBUG) console.log("LinkedIn search request:", { query });
    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) {
      const text = await response.text();
      if (DEBUG) console.warn(`SerpAPI error ${response.status}: ${text}`);
      return NextResponse.json({ error: `SerpAPI error ${response.status}` }, { status: 502 });
    }

    const data = await response.json();
    if (DEBUG) console.log("SerpAPI response keys:", Object.keys(data || {}));
    const organic = Array.isArray(data?.organic_results) ? data.organic_results : [];

    const isPeopleProfile = (link: string | null | undefined) => {
      if (!link) return false;
      const lower = link.toLowerCase();
      if (!lower.includes("linkedin.com/in/")) return false;
      // Exclude known non-people sections just in case
      const blocked = ["/company/", "/school/", "/learning/", "/jobs/", "/pulse/"];
      return !blocked.some((b) => lower.includes(b));
    };

   

    const extractName = (title: string | null | undefined): string | null => {
      if (!title) return null;
      const cleaned = title.replace(/\s*\|\s*LinkedIn/i, "");
      const parts = cleaned.split(" - ");
      return parts[0] ? parts[0].trim() : cleaned.trim();
    };

    const extractHeadline = (title: string | null | undefined, snippet: string | null | undefined): string | null => {
      if (title) {
        const cleaned = title.replace(/\s*\|\s*LinkedIn/i, "");
        const parts = cleaned.split(" - ");
        if (parts.length > 1) return parts.slice(1).join(" - ").trim();
      }
      if (snippet) {
        const sentence = snippet.split(/(?<=\.)\s|\u00B7|\||·/)[0];
        return sentence.trim();
      }
      return null;
    };

    const extractCurrentJob = (headline: string | null | undefined): string | null => {
      if (!headline) return null;
      // Use first segment as current role/company guess
      const byPipe = headline.split(/\s*[|\u00B7]\s*/);
      const candidate = (byPipe[0] || headline).trim();
      // Prefer "Role at Company" pattern
      const atMatch = candidate.match(/^(.{2,}?)\s+at\s+(.{2,}?)$/i);
      if (atMatch) return `${atMatch[1].trim()} at ${atMatch[2].trim()}`;
      const byDash = candidate.split(" - ");
      const byComma = candidate.split(",");
      return (byDash[0] || byComma[0] || candidate).trim();
    };

    const extractCurrentDesignation = (headline: string | null | undefined): string | null => {
      if (!headline) return null;
      // Prefer text before " at " as designation, else first comma/dash segment
      const byPipe = headline.split(/\s*[|\u00B7]\s*/);
      const main = (byPipe[0] || headline).trim();
      const atSplit = main.split(/\s+at\s+/i);
      if (atSplit[0]) return atSplit[0].trim();
      const commaSplit = main.split(",");
      if (commaSplit[0]) return commaSplit[0].trim();
      const dashSplit = main.split(" - ");
      return (dashSplit[0] || main).trim();
    };

    const extractAboutSummary = (snippet: string | null | undefined): string | null => {
      if (!snippet) return null;
      const sentences = snippet
        .replace(/\s+/g, " ")
        .split(/(?<=\.)\s+/)
        .filter(Boolean);
      const summary = sentences.slice(0, 2).join(" ");
      return summary || null;
    };

    const extractEducation = (snippet: string | null | undefined, title: string | null | undefined): string | null => {
      const candidates: string[] = [];
      const source = [snippet || "", title || ""].join(" · ");
      // Pattern 1: Education: XYZ University
      const eduMatch = source.match(/Education\s*:\s*([^. |\u00B7|]+)/i);
      if (eduMatch && eduMatch[1]) candidates.push(eduMatch[1].trim());
      // Pattern 2: mentions of University/College/Institute/School
      const instMatch = source.match(/([A-Z][A-Za-z&,'\- ]{2,} (University|College|Institute|School)(?: of [A-Z][A-Za-z&,'\- ]+)*)/);
      if (instMatch && instMatch[0]) candidates.push(instMatch[0].trim());
      return candidates.find(Boolean) || null;
    };

    const extractCurrentJobFromSnippet = (snippet: string | null | undefined): string | null => {
      if (!snippet) return null;
      // Look for explicit Experience mention
      const exp = snippet.match(/Experience\s*:?\s*([^·|\u00B7\-|]+?)(?:\s*[·|\u00B7\-|]|$)/i);
      if (exp && exp[1]) return exp[1].trim();
      // Look for "Role at Company" followed by "Present"
      const present = snippet.match(/([A-Za-z0-9&,'\- ]+?)\s+at\s+([A-Za-z0-9&,'\- ]+?)[^\.]*?(?:Present|Current)/i);
      if (present) return `${present[1].trim()} at ${present[2].trim()}`;
      // Fallback: first clause before separator
      const first = snippet.split(/\s*[·|\u00B7\-|]\s*|\s{2,}|\s*\|\s*/)[0];
      return first ? first.trim() : null;
    };

    const people = organic
      .filter((item: any) => isPeopleProfile(item.link))
      .map((item: any) => {
        const name = extractName(item.title);
        const headline = extractHeadline(item.title, item.snippet);
        const currentJob = extractCurrentJob(headline) || extractCurrentJobFromSnippet(item.snippet);
        const aboutSummary = extractAboutSummary(item.snippet);
        const education = extractEducation(item.snippet, item.title);
        return {
          name,
          currentJob,
          titleSummary: headline,
          aboutSummary,
          education,
          url: item.link ?? null,
        };
      });

    // Enrich via SerpAPI LinkedIn Profile engine for structured data
    const fetchProfileStructured = async (profileUrl: string) => {
      const profileApi = new URL("https://serpapi.com/search.json");
      profileApi.searchParams.set("engine", "linkedin_profile");
      profileApi.searchParams.set("profile_url", profileUrl);
      profileApi.searchParams.set("api_key", apiKey);
      const res = await fetch(profileApi.toString(), { cache: 'no-store' });
      if (!res.ok) return null;
      try { return await res.json(); } catch { return null; }
    };

    const chooseCurrentExperience = (profile: any): string | null => {
      const experiences = profile?.experiences || profile?.positions || profile?.experience || [];
      if (!Array.isArray(experiences)) return null;
      // Prefer entries marked current or with Present
      const current = experiences.find((e: any) => (
        e?.current === true || /present|current/i.test(String(e?.date_to || e?.dateRange || ''))
      )) || experiences[0];
      if (!current) return null;
      const title = current?.title || current?.position || '';
      const company = current?.company || current?.companyName || '';
      const role = [title, company].filter(Boolean).join(' at ');
      return role || null;
    };

    const chooseLatestEducation = (profile: any): string | null => {
      const edus = profile?.education || profile?.educations || [];
      if (!Array.isArray(edus)) return null;
      let chosen = edus[0] || null;
      // Prefer the one with latest end year
      for (const e of edus) {
        const endYear = parseInt(String(e?.end_year || e?.endYear || '').match(/\d{4}/)?.[0] || '0', 10);
        const chosenYear = parseInt(String(chosen?.end_year || chosen?.endYear || '').match(/\d{4}/)?.[0] || '0', 10);
        if (endYear > chosenYear) chosen = e;
      }
      if (!chosen) return null;
      const school = chosen?.school || chosen?.school_name || chosen?.name || '';
      const degree = chosen?.degree || chosen?.degree_name || '';
      const field = chosen?.field || chosen?.field_of_study || '';
      const parts = [school, [degree, field].filter(Boolean).join(', ')].filter(Boolean);
      return parts.join(' - ') || null;
    };

    // Limit enrichment to avoid long latency
    const enrichCount = Math.min(people.length, 10);
    for (let i = 0; i < enrichCount; i++) {
      const person = people[i];
      if (!person?.url) continue;
      try {
        const profile = await fetchProfileStructured(person.url as string);
        if (profile) {
          const role = chooseCurrentExperience(profile);
          const edu = chooseLatestEducation(profile);
          if (role) (person as any).currentJob = role;
          if (edu) (person as any).education = edu;
        }
      } catch {
        // ignore individual enrichment errors
      }
    }

    // Determine pagination
    const pagination = (data as any)?.serpapi_pagination || {};
    let hasMoreResults = false;
    let nextPageToken: string | null = null;
    if (pagination.next) {
      hasMoreResults = true;
      try {
        const nextUrl = new URL(pagination.next as string);
        const nextStart = nextUrl.searchParams.get("start");
        if (nextStart) nextPageToken = nextStart;
      } catch {
        const currentStart = Number(pageToken || 0);
        nextPageToken = String(currentStart + num);
      }
    }

    // Optionally summarize with OpenAI if key present
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey && people.length > 0) {
      const client = new OpenAI({ apiKey: openaiKey, baseURL: process.env.OPENAI_API_BASE || "https://api.openai.com/v1" });
      const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
        return await Promise.race<T>([
          promise,
          new Promise<T>((_resolve, reject) => setTimeout(() => reject(new Error(`OpenAI timeout after ${ms}ms`)), ms)) as Promise<T>
        ]);
      };
      const limited = people.slice(0, 10);
      const aiResults = await Promise.all(limited.map(async (p: any) => {
        const base = [p.titleSummary, p.aboutSummary].filter(Boolean).join(". ");
        if (!base || base.length < 20) return { summary: null as string | null, current_role: null as string | null };
        try {
          const completion = await withTimeout(client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You extract structured info. Return STRICT JSON with keys: summary (2-3 concise factual lines) and current_role (format: 'Role at Company'). No prose, no code fences." },
              { role: "user", content: `Context: ${base}\n\nRespond as JSON: {\n  \"summary\": \"...\",\n  \"current_role\": \"Role at Company\"\n}` }
            ],
            temperature: 0.2,
            max_tokens: 220
          }), 9000);
          const text = completion.choices?.[0]?.message?.content?.trim() || "";
          try {
            const parsed = JSON.parse(text);
            return { summary: typeof parsed.summary === 'string' ? parsed.summary : null, current_role: typeof parsed.current_role === 'string' ? parsed.current_role : null };
          } catch {
            // Fallback: treat as plain summary text
            return { summary: text || null, current_role: null };
          }
        } catch (_e) {
          return { summary: null, current_role: null };
        }
      }));
      for (let i = 0; i < limited.length; i++) {
        const ai = aiResults[i];
        if (ai.summary) (limited[i] as any).summary = ai.summary;
        if (!limited[i].currentJob && ai.current_role) (limited[i] as any).currentJob = ai.current_role;
      }
      for (const p of limited) {
        if (!(p as any).summary) (p as any).summary = p.aboutSummary || p.titleSummary || null;
      }
      return NextResponse.json({ people: limited, hasMoreResults, nextPageToken });
    }

    // Fallback: no OpenAI summary
    const fallbackPeople = people.map((p: any) => ({ ...p, summary: p.aboutSummary || p.titleSummary || null }));
    return NextResponse.json({ people: fallbackPeople, hasMoreResults, nextPageToken });
  } catch (error: any) {
    if (DEBUG) console.error("Error fetching LinkedIn data:", error);
    return NextResponse.json({ error: error?.message ?? "Unexpected error" }, { status: 500 });
  }
}
