"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Search, Building2, Users, Briefcase, TrendingUp } from "lucide-react";
import SearchBox from "@/components/SearchBox";

interface RecommendationsProps {
  seedQuery: string;
  context: {
    source: string;
    items: any[];
  };
  onPick: (query: string) => void;
  minChars?: number;
  debounceMs?: number;
  maxItems?: number;
  staticRoles?: string[];
  useCase?: "people" | "recruiting" | "sales" | "investor" | "company";
  enableWebFilters?: boolean; // adds quick site: filters
  enableCompanySearch?: boolean; // enables company search autocomplete
}

// Additional hand-written prompts to enrich suggestions
const HANDWRITTEN_PROMPTS: string[] = [
  "business case study",
  "funding",
  "business model",
];

// Small, fast edit-distance (Damerau–Levenshtein, simplified and capped)
function editDistance(a: string, b: string, cap = 2): number {
  const al = a.length, bl = b.length;
  if (Math.abs(al - bl) > cap) return cap + 1;
  const dp = Array.from({ length: al + 1 }, () => new Array<number>(bl + 1).fill(0));
  for (let i = 0; i <= al; i++) dp[i][0] = i;
  for (let j = 0; j <= bl; j++) dp[0][j] = j;
  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return Math.min(dp[al][bl], cap + 1);
}

function normalize(str: string): string {
  return str.toLowerCase().replace(/\s+/g, " ").trim();
}

function acronym(s: string): string {
  return s
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map(w => w[0]?.toLowerCase() || "")
    .join("");
}

function extractLocalCompanies(items: any[]): string[] {
  const out = new Set<string>();
  for (const it of items.slice(0, 30)) {
    const text = String(it?.currentJob || it?.titleSummary || "");
    const at = text.match(/\bat\s+([^,|]+)/i);
    if (at && at[1]) out.add(at[1].trim());
    const dash = text.split(/[-–—]\s*/);
    if (dash.length > 1) {
      const tail = dash[dash.length - 1];
      const m = tail.match(/([A-Z][A-Za-z0-9&'\- ]{2,})$/);
      if (m && m[1]) out.add(m[1].trim());
    }
  }
  return Array.from(out);
}

function extractLocalNames(items: any[]): string[] {
  return Array.from(new Set(items.map((it: any) => it?.name).filter(Boolean))).slice(0, 30) as string[];
}

function buildUseCaseTemplates(useCase: string, seed: string, companies: string[], roles: string[], enableWebFilters: boolean): string[] {
  const out: string[] = [];
  const firstCompany = companies[0];
  const web = enableWebFilters ? [
    `site:linkedin.com/in ${seed}`,
    `site:linkedin.com/company ${seed}`,
    `site:linkedin.com/company ${seed} posts`,
    `site:news.ycombinator.com ${seed}`,
  ] : [];

  switch (useCase) {
    case "recruiting":
      out.push(
        `${seed} ${roles[0] || "Engineer"} resume`,
        `${seed} ${roles[0] || "Engineer"} currently hiring`,
        `${seed} ${roles[0] || "Engineer"} open to work`,
        `${seed} ${roles[0] || "Engineer"} remote`,
        `${seed} careers`,
        `${seed} jobs`,
      );
      if (firstCompany) out.push(`${seed} ${roles[0] || "Engineer"} at ${firstCompany}`);
      break;
    case "sales":
      out.push(
        `${seed} Head of Procurement`,
        `${seed} VP Sales`,
        `${seed} Director of Operations`,
        `${seed} Decision maker`,
        `${seed} purchasing`,
        `${seed} vendor onboarding`,
      );
      if (firstCompany) out.push(`${seed} buyer at ${firstCompany}`);
      break;
    case "investor":
      out.push(
        `${seed} Partner`,
        `${seed} Principal`,
        `${seed} Associate`,
        `${seed} Angel`,
        `${seed} Family Office`,
        `${seed} investor relations`,
        `${seed} annual report`,
        `${seed} 10-K`,
        `${seed} funding`,
      );
      if (firstCompany) out.push(`${seed} investor at ${firstCompany}`);
      break;
    case "company":
      out.push(
        `${seed} employees`,
        `${seed} leadership`,
        `${seed} leadership team`,
        `${seed} board of directors`,
        `${seed} org chart`,
        `${seed} hiring`,
        `${seed} careers`,
        `${seed} jobs`,
        `${seed} benefits`,
        `${seed} culture`,
        `${seed} news`,
        `${seed} press`,
        `${seed} press release`,
        `${seed} newsroom`,
        `${seed} blog`,
        `${seed} investor relations`,
        `${seed} annual report`,
        `${seed} ESG`,
        `${seed} CSR`,
        `${seed} sustainability`,
        `${seed} product launch`,
        `${seed} partnership`,
        `${seed} acquisition`,
        `${seed} pricing`,
        `${seed} competitors`,
      );
      break;
    case "people":
    default:
      out.push(
        `${seed} CEO`, `${seed} CTO`, `${seed} Founder`, `${seed} VP`, `${seed} Director`, `${seed} Manager`,
        `${seed} leadership`, `${seed} hiring`, `${seed} press`, `${seed} partnership`
      );
  }

  return Array.from(new Set([...web, ...out]));
}

function buildFuzzyCandidates(query: string, items: any[], roles: string[], useCase: string, enableWebFilters: boolean): string[] {
  const companies = extractLocalCompanies(items);
  const names = extractLocalNames(items);
  const base = new Set<string>();

  buildUseCaseTemplates(useCase, query, companies, roles, enableWebFilters).forEach(s => base.add(s));
  for (const r of roles) base.add(`${query} ${r}`);
  for (const c of companies) base.add(`${query} ${c}`);
  for (const n of names) base.add(`${n}`);
  for (const p of HANDWRITTEN_PROMPTS) base.add(`${query} ${p}`);

  return Array.from(base);
}

function rankFuzzy(query: string, candidates: string[], limit: number): string[] {
  const qn = normalize(query);
  const qa = acronym(qn);
  const qTokens = qn.split(" ").filter(Boolean);
  const scored = candidates.map((c) => {
    const cn = normalize(c);
    const ca = acronym(cn);
    let score = 0;
    if (cn.startsWith(qn)) score += 6;            // strong prefix boost
    if (cn.includes(qn)) score += 3;              // substring boost
    // token overlap boost
    for (const t of qTokens) if (t && cn.includes(t)) score += 1.2;
    // acronym match (e.g., "amz" -> "Amazon")
    if (qa && ca.startsWith(qa)) score += 2.5;
    // light edit distance penalty
    score -= Math.min(editDistance(cn, qn, 2), 3) * 1.0;
    // length regularization
    score -= Math.max(0, cn.length - qn.length) * 0.01;
    return { c, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return Array.from(new Set(scored.map(s => s.c))).slice(0, limit);
}

export default function Recommendations({ 
  seedQuery, 
  context, 
  onPick, 
  minChars = 2, 
  debounceMs = 120, 
  maxItems = 12, 
  staticRoles = ["CEO","CTO","Founder","VP","Director","Manager","Engineer","Developer","Designer","Marketing","Sales","Product"], 
  useCase = "people", 
  enableWebFilters = false,
  enableCompanySearch = true 
}: RecommendationsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [companyApiMatches, setCompanyApiMatches] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [showCompanySearch, setShowCompanySearch] = useState<boolean>(false);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const isUserScrollingRef = useRef<boolean>(false);
  const userAnchoredRef = useRef<boolean>(false); // after manual scroll, keep position anchored
  const scrollStopTimerRef = useRef<any>(null);

  // Incremental cache for speed while typing
  const lastQueryRef = useRef<string>("");
  const lastCandidatesRef = useRef<string[]>([]);
  const lastResultsRef = useRef<string[]>([]);
  const baseSigRef = useRef<string>("");

  // API cache to avoid repeated calls
  const apiCacheRef = useRef<Map<string, string[]>>(new Map());

  const itemsMemo = useMemo(() => context.items || [], [context.items]);

  // Handle company selection from SearchBox
  const handleCompanySelect = (companyName: string) => {
    if (companyName) {
      setSelectedCompany(companyName);
      const combinedQuery = seedQuery ? `${seedQuery} ${companyName}` : companyName;
      onPick(combinedQuery);
      setShowCompanySearch(false);
    }
  };

  // Debounced fetch for company API matches (top section)
  useEffect(() => {
    if (!enableCompanySearch) { setCompanyApiMatches([]); return; }
    if (!seedQuery || seedQuery.length < minChars) { setCompanyApiMatches([]); return; }

    const q = seedQuery.trim();
    const cached = apiCacheRef.current.get(q);
    let abort = new AbortController();

    if (cached) {
      setCompanyApiMatches(cached);
      return;
    }

    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/recommendations?kind=companies&q=${encodeURIComponent(q)}`, { signal: abort.signal });
        if (!res.ok) return;
        const json = await res.json();
        const arr: string[] = Array.isArray(json?.companies) ? json.companies : Array.isArray(json) ? json : [];
        apiCacheRef.current.set(q, arr);
        setCompanyApiMatches(arr);
      } catch {}
    }, Math.max(100, debounceMs));

    return () => { clearTimeout(t); abort.abort(); };
  }, [seedQuery, minChars, debounceMs, enableCompanySearch]);

  useEffect(() => {
    if (!seedQuery || seedQuery.length < minChars) {
      setSuggestions([]);
      setCompanies([]);
      setActiveIndex(-1);
      lastQueryRef.current = "";
      lastCandidatesRef.current = [];
      lastResultsRef.current = [];
      return;
    }

    const run = () => {
      const baseSig = JSON.stringify({
        names: itemsMemo.slice(0, 20).map((it: any) => it?.name || ""),
        jobs: itemsMemo.slice(0, 20).map((it: any) => it?.currentJob || it?.titleSummary || ""),
        roles: staticRoles,
        useCase,
        web: enableWebFilters,
      });

      if (baseSigRef.current !== baseSig) {
        baseSigRef.current = baseSig;
      }
      lastCandidatesRef.current = buildFuzzyCandidates(seedQuery, itemsMemo, staticRoles, useCase, enableWebFilters);

      const localCompanies = extractLocalCompanies(itemsMemo).slice(0, 8);
      const pool = lastCandidatesRef.current;
      const fuzzy = rankFuzzy(seedQuery, pool, maxItems);

      lastQueryRef.current = seedQuery;
      lastResultsRef.current = fuzzy;

      setCompanies(localCompanies);
      setSuggestions(fuzzy);
      // Only set to 0 if nothing is active; avoid jumping while user scrolls
      const total = (fuzzy.length + localCompanies.length);
      setActiveIndex((prev) => prev === -1 ? (total > 0 ? 0 : -1) : prev);
    };

    const timeoutId = setTimeout(run, debounceMs);
    return () => { clearTimeout(timeoutId); };
  }, [seedQuery, itemsMemo, minChars, debounceMs, maxItems, staticRoles, useCase, enableWebFilters]);

  // Smooth scroll selected item into view unless the user is actively scrolling
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    if (isUserScrollingRef.current) return;
    if (userAnchoredRef.current) return; // do not auto-scroll while user anchored
    const active = listRef.current.querySelector<HTMLElement>(`[data-index='${activeIndex}']`);
    active?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeIndex]);

  // Detect user scroll on the list and temporarily suppress auto scroll
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      isUserScrollingRef.current = true;
      userAnchoredRef.current = true; // once user scrolls, anchor until query changes
      if (scrollStopTimerRef.current) clearTimeout(scrollStopTimerRef.current);
      scrollStopTimerRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 200);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => { el.removeEventListener('scroll', onScroll as any); };
  }, []);

  // When the query changes (new session of suggestions), release the anchor
  useEffect(() => {
    userAnchoredRef.current = false;
  }, [seedQuery]);

  const sections: { key: string; title?: string; items: string[]; icon?: 'search'|'building'; onClick?: (v: string)=>void }[] = [];

  // Company API matches first
  if (enableCompanySearch && companyApiMatches.length) {
    sections.push({ key: 'companyApi', title: 'Company matches', items: companyApiMatches, icon: 'building', onClick: (v) => onPick(`${seedQuery} ${v}`) });
  }

  // Quick entry to open the full company search box
  if (enableCompanySearch && seedQuery.length >= 2) {
    sections.push({ 
      key: 'company-search', 
      title: 'Search Companies', 
      items: [], 
      icon: 'building', 
      onClick: () => setShowCompanySearch(true) 
    });
  }

  if (companies.length) sections.push({ key: 'companies', title: 'Companies (from results)', items: companies, icon: 'building', onClick: (v) => onPick(`${seedQuery} ${v}`) });
  if (suggestions.length) sections.push({ key: 'suggestions', title: 'Top suggestions', items: suggestions, icon: 'search', onClick: (v) => onPick(v) });

  const flat: { text: string; section: string; icon: 'search'|'building'; onClick: (v: string)=>void; isHeader?: boolean; isCompanySearch?: boolean }[] = [];
  sections.forEach((s) => {
    if (s.title) flat.push({ text: s.title, section: s.key, icon: 'search', onClick: () => {}, isHeader: true });
    if (s.key === 'company-search') {
      flat.push({ 
        text: '🔍 Search company database...', 
        section: s.key, 
        icon: 'building', 
        onClick: s.onClick || (() => {}),
        isCompanySearch: true 
      });
    } else {
      s.items.forEach((it) => flat.push({ text: it, section: s.key, icon: (s.icon || 'search') as any, onClick: s.onClick || onPick }));
    }
  });

  if (flat.length === 0 || !seedQuery) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const count = flat.length; // headers included; we'll skip them for focus
    if (!count) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => {
        let next = i;
        do { next = (next + 1 + count) % count; } while (flat[next]?.isHeader && count > 1);
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => {
        let prev = i;
        do { prev = (prev - 1 + count) % count; } while (flat[prev]?.isHeader && count > 1);
        return prev;
      });
    } else if (e.key === "Enter" && activeIndex >= 0 && !flat[activeIndex]?.isHeader) {
      e.preventDefault();
      flat[activeIndex].onClick(flat[activeIndex].text);
    } else if (e.key === "Escape") {
      setActiveIndex(-1);
      setShowCompanySearch(false);
    }
  };

  const highlight = (text: string, query: string) => {
    try {
      const idx = text.toLowerCase().indexOf(query.toLowerCase());
      if (idx === -1) return <span>{text}</span>;
      const before = text.slice(0, idx);
      const mid = text.slice(idx, idx + query.length);
      const after = text.slice(idx + query.length);
      return (
        <span>
          {before}
          <span className="font-semibold text-white">{mid}</span>
          {after}
        </span>
      );
    } catch {
      return <span>{text}</span>;
    }
  };

  const renderIcon = (icon?: 'search'|'building') => {
    if (icon === 'building') return <Building2 size={16} className="opacity-80" />;
    return <Search size={16} className="opacity-80" />;
  };

  // Render company search interface
  if (showCompanySearch) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative mt-2"
      >
        <div className="w-full max-w-full rounded-xl border border-white/15 bg-[rgba(17,17,27,0.98)] backdrop-blur-md shadow-2xl overflow-hidden p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2">
              <Building2 size={16} className="opacity-80" />
              Company Search
            </h3>
            <button
              onClick={() => setShowCompanySearch(false)}
              className="text-white/60 hover:text-white/90 transition-colors"
            >
              ✕
            </button>
          </div>
          
          <SearchBox
            placeholder="Search for a company..."
            onCompanySelect={handleCompanySelect}
            className="mb-3"
            initialValue={seedQuery}
          />
          
          <div className="text-xs text-white/50 text-center">
            Search through our company database to find specific companies
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="relative mt-2"
      onKeyDown={handleKeyDown}
    >
      <div
        ref={listRef}
        role="listbox"
        aria-label="Recommendations"
        className="w-full max-w-full rounded-xl border border-white/15 bg-[rgba(17,17,27,0.98)] backdrop-blur-md shadow-2xl overflow-hidden"
      >
        <ul className="max-h-96 overflow-auto divide-y divide-white/10">
          {flat.map((row, idx) => (
            <li key={idx} data-index={idx}>
              {row.isHeader ? (
                <div className="px-4 py-2 text-[11px] uppercase tracking-wide text-white/50 bg-white/[0.03] sticky top-0 z-10">
                  {row.text}
                </div>
              ) : (
                <button
                  type="button"
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                    idx === activeIndex
                      ? "bg-white/15 text-white"
                      : "bg-transparent text-white/90 hover:bg-white/10 hover:text-white"
                  }`}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => row.onClick(row.text)}
                  role="option"
                  aria-selected={idx === activeIndex}
                >
                  {renderIcon(row.icon)}
                  <span className="truncate">
                    {row.isCompanySearch ? (
                      <span className="text-blue-300">{row.text}</span>
                    ) : row.section.includes('company') ? (
                      <>{highlight(seedQuery, seedQuery)} <span className="opacity-60">{" "}</span>{row.text}</>
                    ) : (
                      highlight(row.text, seedQuery)
                    )}
                  </span>
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
