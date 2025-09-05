"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
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

export default function ArticleAnalysis() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<{ [key: number]: string }>({});
  const [summaryLoading, setSummaryLoading] = useState<{ [key: number]: boolean }>({});
  const [globalSummary, setGlobalSummary] = useState<string>("");
  const [globalSummaryLoading, setGlobalSummaryLoading] = useState(false);
  const [currentPageToken, setCurrentPageToken] = useState<string | null>(null);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const handleSearch = async (pageToken?: string) => {
    if (!query && !pageToken) return;
    setLoading(true);
    if (!pageToken) {
      setArticles([]);
      setSummaries({});
      setGlobalSummary("");
      setCurrentPageToken(null);
      setHasMoreResults(false);
    }

    try {
      const body = pageToken ? { query, pageToken } : { query };
      const res = await fetch("/api/article_analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) {
        console.error("Search error:", data.error);
        if (!pageToken) setArticles([]);
      } else {
        if (pageToken) {
          setArticles(prev => [...prev, ...(data.articles || [])]);
        } else {
          setArticles(data.articles || []);
        }
        setCurrentPageToken(data.nextPageToken || null);
        setHasMoreResults(!!data.hasMoreResults);
        
        // Auto-generate summaries for all 9 articles immediately
        if (!pageToken && data.articles && data.articles.length > 0) {
          const articlesToSummarize = data.articles.slice(0, 9);
          articlesToSummarize.forEach((article: any, index: number) => {
            if (article.snippet) {
              setTimeout(() => {
                handleSummarize(article, index);
              }, index * 500); // Stagger the requests by 0.5 seconds each for faster processing
            }
          });
        }
      }
    } catch (err) {
      console.error("Search fetch error:", err);
      if (!pageToken) setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (currentPageToken) {
      handleSearch(currentPageToken);
    }
  };

  const handleSummarize = async (article: any, index: number) => {
    if (!article.snippet) {
      setSummaries({ ...summaries, [index]: "No content available to summarize." });
      return;
    }

    setSummaryLoading({ ...summaryLoading, [index]: true });

    try {
      const res = await fetch("/api/article_analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: article.snippet }),
      });

      const data = await res.json();
      if (data.error) {
        console.error("Summary error:", data.error);
        if (data.error.includes("insufficient_quota")) {
          setSummaries({
            ...summaries,
            [index]: "Error: OpenAI quota exceeded. Please check your plan and billing details.",
          });
        } else {
          setSummaries({ ...summaries, [index]: `Error: ${data.error}` });
        }
      } else if (data.summary) {
        setSummaries({ ...summaries, [index]: data.summary });
      } else {
        setSummaries({ ...summaries, [index]: "Failed to generate summary." });
      }
    } catch (err) {
      console.error("Summary fetch error:", err);
      setSummaries({ ...summaries, [index]: "Error generating summary." });
    } finally {
      setSummaryLoading({ ...summaryLoading, [index]: false });
    }
  };

  const handleGlobalSummarize = async () => {
    if (articles.length === 0 || !articles.some(article => article.snippet)) {
      setGlobalSummary("No articles or content available to summarize.");
      return;
    }

    setGlobalSummaryLoading(true);
    setGlobalSummary("");

    try {
      const contents = articles
        .filter(article => article.snippet)
        .map(article => article.snippet);
      const res = await fetch("/api/article_analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      });

      const data = await res.json();
      if (data.error) {
        console.error("Global summary error:", data.error);
        setGlobalSummary(`Error: ${data.error}`);
      } else if (data.summary) {
        setGlobalSummary(data.summary);
      } else {
        setGlobalSummary("Failed to generate global summary.");
      }
    } catch (err) {
      console.error("Global summary fetch error:", err);
      setGlobalSummary("Error generating global summary.");
    } finally {
      setGlobalSummaryLoading(false);
    }
  };

  const handleCopyArticleSummary = async (index: number) => {
    const text = summaries[index];
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  const handleShareArticleSummary = async (index: number, article: any) => {
    const text = summaries[index];
    if (!text) return;
    const url = article?.link || "";
    const payload = `${article?.title || "Article"}\n\n${text}${url ? `\n\nRead: ${url}` : ""}`;
    try {
      if ((navigator as any)?.share) {
        await (navigator as any).share({
          title: article?.title || "Article Summary",
          text: payload,
          url: url || undefined,
        });
      } else {
        await navigator.clipboard.writeText(payload);
      }
    } catch {}
  };

  const handleCopyGlobalSummary = async () => {
    if (!globalSummary) return;
    try { await navigator.clipboard.writeText(globalSummary); } catch {}
  };

  const handleShareGlobalSummary = async () => {
    if (!globalSummary) return;
    const payload = `Global Summary for: ${query}\n\n${globalSummary}`;
    try {
      if ((navigator as any)?.share) {
        await (navigator as any).share({ title: `Global Summary: ${query}`, text: payload });
      } else {
        await navigator.clipboard.writeText(payload);
      }
    } catch {}
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

      <div className="relative z-10 w-full max-w-4xl p-6">
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-5xl font-extrabold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-purple-100 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
        >
          📰 Article Analysis
        </motion.h1>

        {/* Search Box */}
        <motion.div 
          className="flex gap-2 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Input
            placeholder="Enter a topic..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            className="flex-1 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/40 focus:border-white/30 focus:ring-white/20 rounded-xl backdrop-blur-sm"
          />
          <Button
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 rounded-xl transition-all duration-300 hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] font-semibold px-6"
            onClick={() => handleSearch()}
            disabled={loading}
          >
            {loading ? "⚡ Fetching..." : "🚀 Search"}
          </Button>
        </motion.div>

        {/* Loading State Below Search Bar */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center py-8"
          >
            <div className="bg-white/[0.05] border border-white/[0.1] rounded-2xl p-6 backdrop-blur-lg">
              <AILoader text="Searching Articles" size="md" />
            </div>
          </motion.div>
        )}

        {inputFocused && query.length >= 2 && (
          <div onMouseDown={(e) => e.preventDefault()}>
            <Recommendations
              seedQuery={query}
              context={{ source: 'articles', items: articles }}
              onPick={(q) => { setQuery(q); handleSearch(); }}
              useCase="company"
              enableWebFilters={true}
              enableCompanySearch={true}
            />
          </div>
        )}

        {/* Global Summary Button and Display */}
        {articles.length > 0 && (
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Button
              className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white border-0 rounded-xl transition-all duration-300 hover:shadow-[0_0_25px_rgba(34,197,94,0.4)] font-semibold py-3"
              onClick={handleGlobalSummarize}
              disabled={globalSummaryLoading || articles.length === 0}
            >
              {globalSummaryLoading ? "📝 Generating Global Summary..." : "🌐 Generate Global Summary"}
            </Button>
            {globalSummary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 p-6 bg-white/[0.03] border border-white/[0.1] rounded-2xl backdrop-blur-lg shadow-[0_8px_32px_rgba(255,255,255,0.1)]"
              >
                <h3 className="text-lg font-bold text-teal-400 mb-2">Global Summary</h3>
                <p className="text-white/80 text-sm whitespace-pre-line">{globalSummary}</p>
                <div className="flex gap-3 mt-4">
                  <Button onClick={handleCopyGlobalSummary} className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-0 rounded-lg transition-all duration-300">
                    📋 Copy Summary
                  </Button>
                  <Button onClick={handleShareGlobalSummary} className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white border-0 rounded-lg transition-all duration-300">
                    🔗 Share
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Articles Grid - 3x3 Layout */}
        {articles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-6"
          >
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-white/80 mb-2">📊 Market Analysis Grid (3×3)</h3>
              <p className="text-white/60 text-sm">Showing top 9 articles with AI-generated summaries</p>
            </div>
          </motion.div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {articles.length > 0 ? (
            <>
              {articles.slice(0, 9).map((article, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="group"
                >
                  <Card className="border border-white/[0.1] bg-white/[0.03] backdrop-blur-lg shadow-[0_8px_32px_rgba(255,255,255,0.1)] rounded-2xl h-[500px] flex flex-col hover:shadow-[0_12px_40px_rgba(255,255,255,0.15)] transition-all duration-300">
                    <CardContent className="p-6 flex flex-col h-full">
                      {/* AI Summary Section - Top of Card */}
                      <div className="mb-6">
                        {summaries[idx] ? (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                              <span className="text-green-400 text-xs font-medium">AI Summary</span>
                            </div>
                            <p className="text-white/90 text-sm leading-relaxed line-clamp-6">
                              {summaries[idx]}
                            </p>
                          </div>
                        ) : summaryLoading[idx] ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
                            <p className="text-blue-400 text-sm">Generating Summary...</p>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                              <span className="text-white text-xl">📰</span>
                            </div>
                            <p className="text-white/60 text-sm mb-3">Click to generate AI summary</p>
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 rounded-lg transition-all duration-300"
                              onClick={() => handleSummarize(article, idx)}
                              disabled={!article.snippet}
                            >
                              Generate Summary
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Article Details Section - Below Summary */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                          <h2 className="text-lg font-bold text-white line-clamp-3 leading-tight">
                            <a 
                              href={article.link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="hover:text-indigo-300 transition-colors"
                            >
                              {article.title}
                            </a>
                          </h2>
                          
                          <div className="flex items-center gap-2 text-white/60 text-sm">
                            <span className="bg-white/[0.1] px-3 py-1 rounded-full text-xs">
                              {article.source}
                            </span>
                            <span>•</span>
                            <span>{article.date}</span>
                          </div>

                          <p className="text-white/70 text-sm leading-relaxed line-clamp-4">
                            {article.snippet}
                          </p>
                        </div>

                        {/* Action Buttons - Bottom of Card */}
                        <div className="flex gap-2 pt-4 border-t border-white/[0.1]">
                          {summaries[idx] && (
                            <>
                              <Button 
                                size="sm"
                                onClick={() => handleCopyArticleSummary(idx)} 
                                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-0 rounded-lg transition-all duration-300 text-xs"
                              >
                                📋 Copy
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => handleShareArticleSummary(idx, article)} 
                                className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white border-0 rounded-lg transition-all duration-300 text-xs"
                              >
                                🔗 Share
                              </Button>
                            </>
                          )}
                          <Button 
                            size="sm"
                            onClick={() => window.open(article.link, '_blank')}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 rounded-lg transition-all duration-300 text-xs"
                          >
                            🔗 Read
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {hasMoreResults && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mt-6"
                >
                  <Button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 rounded-xl transition-all duration-300 hover:shadow-[0_0_25px_rgba(34,197,94,0.4)] font-semibold px-8 py-3 text-lg"
                  >
                    {loading ? "⏳ Loading..." : "🔍 Load More Articles"}
                  </Button>
                </motion.div>
              )}
            </>
          ) : (
            !loading && <p className="text-white/60 text-center">No articles found.</p>
          )}
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/80 pointer-events-none" />
    </div>
  );
}