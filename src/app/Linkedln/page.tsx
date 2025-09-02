"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Copy } from "lucide-react";
import { useCallback, useEffect } from "react";
import Recommendations from "@/components/ui/recommendations";
import { AILoader } from "@/components/ui/ai-loader";


function ElegantShape({
    className,
    delay = 0,
    width = 400,
    height = 100,
    rotate = 0,
    gradient = "from-white/[0.08]",
}: {
    className?: string;
    delay?: number;
    width?: number;
    height?: number;
    rotate?: number;
    gradient?: string;
}) {
    return (
        <motion.div
            initial={{
                opacity: 0,
                y: -150,
                rotate: rotate - 15,
            }}
            animate={{
                opacity: 1,
                y: 0,
                rotate: rotate,
            }}
            transition={{
                duration: 2.4,
                delay,
                ease: [0.23, 0.86, 0.39, 0.96],
                opacity: { duration: 1.2 },
            }}
            className={`absolute ${className}`}
        >
            <motion.div
                animate={{
                    y: [0, 15, 0],
                }}
                transition={{
                    duration: 12,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                }}
                style={{
                    width,
                    height,
                }}
                className="relative"
            >
                <div
                    className={`absolute inset-0 rounded-full bg-gradient-to-r to-transparent ${gradient} backdrop-blur-[2px] border-2 border-white/[0.15] shadow-[0_8px_32px_0_rgba(255,255,255,0.1)] after:absolute after:inset-0 after:rounded-full after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]`}
                />
            </motion.div>
        </motion.div>
    );
}

export default function LinkedInPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [showSlowLoading, setShowSlowLoading] = useState<boolean>(false);

  useEffect(() => {
    if (loading) {
      const t = setTimeout(() => setShowSlowLoading(true), 600);
      return () => { clearTimeout(t); setShowSlowLoading(false); };
    } else {
      setShowSlowLoading(false);
    }
  }, [loading]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error("Copy failed", e);
    }
  }, []);

  const HeaderWithCopy = ({ label, getValues }: { label: string; getValues: () => string }) => (
    <div className="flex items-center gap-2">
      <span>{label}</span>
      <button
        onClick={() => copyToClipboard(getValues())}
        className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white"
        aria-label={`Copy ${label} column`}
        title={`Copy ${label} column`}
      >
        <Copy size={14} />
      </button>
    </div>
  );

  const handleSearch = async () => {
    if (!query) return;
    setHasSubmitted(true);
    setLoading(true);
    setResults([]);
    setPageToken(null);
    setHasMore(false);

    try {
      const res = await fetch("/api/Linkedln", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      if (!res.ok) {
        const message = (data && (data.error || data.message)) || "Request failed";
        setResults([{ title: "Error", snippet: message }]);
        return;
      }
      // Prefer the new people array if present; otherwise fallback
      if (Array.isArray((data as any).people)) {
        setResults((data as any).people);
        setHasMore(Boolean((data as any).hasMoreResults));
        setPageToken((data as any).nextPageToken || null);
      } else {
        setResults(Array.isArray((data as any).results) ? (data as any).results : []);
      }
    } catch (err) {
      console.error(err);
      setResults([{ title: "Error", snippet: "Could not fetch results" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!query || !hasMore || !pageToken) return;
    setLoading(true);
    try {
      const res = await fetch("/api/Linkedln", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, pageToken }),
      });
      const data = await res.json();
      if (!res.ok) return;
      if (Array.isArray((data as any).people)) {
        setResults((prev) => [...prev, ...((data as any).people || [])]);
        setHasMore(Boolean((data as any).hasMoreResults));
        setPageToken((data as any).nextPageToken || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#030303]">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />
      
      {/* Floating geometric shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <ElegantShape
          delay={0.3}
          width={600}
          height={140}
          rotate={12}
          gradient="from-indigo-500/[0.15]"
          className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
        />
        <ElegantShape
          delay={0.5}
          width={500}
          height={120}
          rotate={-15}
          gradient="from-rose-500/[0.15]"
          className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
        />
        <ElegantShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient="from-violet-500/[0.15]"
          className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
        />
        <ElegantShape
          delay={0.6}
          width={200}
          height={60}
          rotate={20}
          gradient="from-amber-500/[0.15]"
          className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
        />
        <ElegantShape
          delay={0.7}
          width={150}
          height={40}
          rotate={-25}
          gradient="from-cyan-500/[0.15]"
          className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
        />
      </div>

      <div className="relative z-10 w-full max-w-none px-3 md:px-5">
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-5xl font-extrabold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-purple-100 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
        >
          🔍 LinkedIn Search
        </motion.h1>

        <motion.div 
          className="flex gap-2 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Input
            placeholder="Enter a name, job title, or company..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setHasSubmitted(false); }}
            className="flex-1 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/40 focus:border-white/30 focus:ring-white/20 rounded-xl backdrop-blur-sm"
          />
          <Button
            className="bg-gradient-to-r from-blue-500 to-green-600 hover:from-blue-600 hover:to-green-700 text-white border-0 rounded-xl transition-all duration-300 hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] font-semibold px-6"
            onClick={handleSearch}
            disabled={loading}
          >
            {showSlowLoading ? "⚡ Searching..." : "🚀 Search"}
          </Button>
        </motion.div>

        {/* Loading State Below Search Bar */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center py-8"
          >
            <div className="bg-white/[0.05] border border-white/[0.05] rounded-2xl p-6 backdrop-blur-lg">
              <AILoader text="Searching LinkedIn" size="md" />
            </div>
          </motion.div>
        )}

        {!loading && !hasSubmitted && query.length >= 2 && (
          <Recommendations
            seedQuery={query}
            context={{ source: 'linkedin', items: results }}
            onPick={(q) => { setQuery(q); handleSearch(); }}
            useCase="people"
            enableWebFilters={true}
            enableCompanySearch={true}
          />
        )}

        {results.length > 0 && Array.isArray(results) && results[0]?.name && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-white/[0.1] bg-white/[0.03] backdrop-blur-lg"
          >
            <table className="w-full text-left text-white/90 table-fixed">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-semibold w-[18%]"><HeaderWithCopy label="Name" getValues={() => results.map(r => r.name || "").join("\n")} /></th>
                  <th className="px-4 py-3 font-semibold w-[28%]"><HeaderWithCopy label="Summary (AI)" getValues={() => results.map(r => r.summary || r.aboutSummary || "").join("\n")} /></th>
                  <th className="px-4 py-3 font-semibold w-[24%]"><HeaderWithCopy label="Title Summary" getValues={() => results.map(r => r.titleSummary || r.headline || "").join("\n")} /></th>
                  <th className="px-4 py-3 font-semibold w-[8%]"><HeaderWithCopy label="Profile" getValues={() => results.map(r => r.url || "").join("\n")} /></th>
                  <th className="px-4 py-3 font-semibold w-[10%]"><HeaderWithCopy label="Current Job" getValues={() => results.map(r => r.currentJob || "").join("\n")} /></th>
                  <th className="px-4 py-3 font-semibold w-[12%]"><HeaderWithCopy label="Education" getValues={() => results.map(r => r.education || "").join("\n")} /></th>
                </tr>
              </thead>
              <tbody>
                {results.map((p: any, idx: number) => (
                  <tr key={idx} className="border-t border-white/10">
                    <td className="px-4 py-3 align-top">{p.name || "—"}</td>
                    <td className="px-4 py-3 align-top whitespace-pre-wrap">{p.summary || p.aboutSummary || "—"}</td>
                    <td className="px-4 py-3 align-top whitespace-pre-wrap">{p.titleSummary || p.headline || "—"}</td>
                    <td className="px-4 py-3 align-top">
                      {p.url ? (
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:underline">Open</a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">{p.currentJob || "—"}</td>
                    <td className="px-4 py-3 align-top">{p.education || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {hasMore && (
          <div className="flex justify-center mt-4">
            <Button onClick={handleLoadMore} disabled={loading} className="bg-white/10 hover:bg-white/20 border border-white/20">
              {loading ? "Loading..." : "Load more"}
            </Button>
          </div>
        )}

        {/* Fallback: legacy card list for non-people results */}
        {results.length > 0 && !results[0]?.name && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {results.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
              >
                <Card className="border border-white/[0.1] bg-white/[0.03] backdrop-blur-lg shadow-[0_8px_32px_rgba(255,255,255,0.1)] rounded-2xl">
                  <CardContent className="p-6">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-blue-300 mb-2 hover:underline block">
                      {item.title || item.displayed_link || item.url}
                    </a>
                    {item.snippet && (
                      <p className="text-white/80 mb-2">{item.snippet}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      {item.type && <span className="px-2 py-1 rounded bg-white/10">{item.type}</span>}
                      {item.displayed_link && <span className="truncate">{item.displayed_link}</span>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
        {(!loading && results.length === 0) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center text-white/60 mt-6"
          >
            No results yet. Try a search like "John Doe Google".
          </motion.p>
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/80 pointer-events-none" />
    </div>
  );
}
