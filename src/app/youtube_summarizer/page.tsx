// app/page.tsx
"use client";

import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import Recommendations from "@/components/ui/recommendations";
import { AILoader } from "@/components/ui/ai-loader";

interface VideoResult {
  id: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: number;
  duration: number;
  thumbnail?: string;
  videoUrl: string;
  channelUrl: string;
}

interface SummaryData {
  summary: string;
  videoId: string;
  title: string;
  channelTitle: string;
  viewCount: number;
}

interface TranscriptData {
  transcript: string;
  videoId: string;
  title: string;
  channelTitle: string;
  viewCount: number;
  segments: Array<{
    text: string;
    start: number;
    duration: number;
  }>;
}

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

export default function YouTubeSummarizer() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [showTranscriptDialog, setShowTranscriptDialog] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [currentPageToken, setCurrentPageToken] = useState<string | null>(null);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const prevScrollYRef = useRef<number>(0);
  const MIN_DURATION_SECONDS = 600; // only include videos >= 10 minutes

  const handleSearch = async (pageToken?: string) => {
    if (!query && !pageToken) return;
    
    setLoading(true);
    
    // If it's a new search (not pagination), reset everything
    if (!pageToken) {
      setVideos([]);
      setSummaryData(null);
      setShowSummaryDialog(false);
      setCurrentPageToken(null);
      setHasMoreResults(false);
    }

    try {
      console.log("🔍 Searching for:", query || "pagination", pageToken ? `(Page: ${pageToken})` : "");
      
      const requestBody = pageToken ? { query, pageToken, action: 'search' } : { query, action: 'search' };
      
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      console.log("📡 API Response:", data);
      
      if (data.videos) {
        const longVideos = (data.videos as VideoResult[])
          .filter(v => (v?.duration || 0) >= MIN_DURATION_SECONDS)
          .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
        if (pageToken) {
          // Ensure we have at least 5 new long videos on pagination
          let collected: VideoResult[] = [...longVideos];
          let nextToken: string | null = data.nextPageToken || null;
          let more: boolean = !!data.hasMoreResults;
          let safety = 0;
          const existingIds = new Set(videos.map(v => v.id));

          while (collected.length < 5 && more && nextToken && safety < 3) {
            safety++;
            try {
              const r = await fetch("/api/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query, pageToken: nextToken, action: 'search' }),
              });
              const pj = await r.json();
              const lv: VideoResult[] = (pj?.videos || [])
                .filter((v: VideoResult) => (v?.duration || 0) >= MIN_DURATION_SECONDS);
              for (const v of lv) {
                if (!existingIds.has(v.id) && !collected.find(c => c.id === v.id)) {
                  collected.push(v);
                }
              }
              nextToken = pj?.nextPageToken || null;
              more = !!pj?.hasMoreResults;
            } catch {}
          }

          // Only append new unique videos AFTER existing ones, keeping existing order intact
          const uniqueNew = collected.filter(v => !existingIds.has(v.id));
          setVideos(prev => [...prev, ...uniqueNew]);
          setCurrentPageToken(nextToken);
          setHasMoreResults(more);
        } else {
          // Replace videos for new search
          setVideos(longVideos);
        }
        
        if (!pageToken) {
          setCurrentPageToken(data.nextPageToken || null);
          setHasMoreResults(data.hasMoreResults || false);
        }
      } else {
        console.error("❌ No videos in response:", data);
      }
      
    } catch (err) {
      console.error("❌ Search error:", err);
    } finally {
      setLoading(false);
      // restore scroll after pagination to prevent jumping to top
      if (pageToken) {
        try { window.scrollTo({ top: prevScrollYRef.current, behavior: 'auto' }); } catch {}
      }
    }
  };

  const handleGenerateSummary = async (video: VideoResult) => {
    setSummaryLoading(true);
    setShowSummaryDialog(true);
    
    try {
      console.log("🎯 Generating summary for video:", video.id);
      
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: 'summarize',
          videoId: video.id
        }),
      });

      const data = await res.json();
      console.log("📝 Summary Response:", data);
      
      if (data.summary) {
        setSummaryData({
          summary: data.summary,
          videoId: data.videoId,
          title: data.title,
          channelTitle: data.channelTitle,
          viewCount: data.viewCount
        });
      } else {
        setSummaryData({
          summary: "Unable to generate summary for this video.",
          videoId: video.id,
          title: video.title,
          channelTitle: video.channelTitle,
          viewCount: video.viewCount
        });
      }
      
    } catch (err) {
      console.error("❌ Summary generation error:", err);
      setSummaryData({
        summary: "Error generating summary. Please try again.",
        videoId: video.id,
        title: video.title,
        channelTitle: video.channelTitle,
        viewCount: video.viewCount
      });
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleGenerateTranscript = async (video: VideoResult) => {
    setTranscriptLoading(true);
    setShowTranscriptDialog(true);
    
    try {
      console.log("📝 Generating transcript for video:", video.id);
      
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: 'transcript',
          videoId: video.id
        }),
      });

      const data = await res.json();
      console.log("📄 Transcript Response:", data);
      
      if (data.transcript) {
        setTranscriptData({
          transcript: data.transcript,
          videoId: data.videoId,
          title: data.title,
          channelTitle: data.channelTitle,
          viewCount: data.viewCount,
          segments: data.segments || []
        });
      } else {
        setTranscriptData({
          transcript: "Unable to generate transcript for this video.",
          videoId: video.id,
          title: video.title,
          channelTitle: video.channelTitle,
          viewCount: video.viewCount,
          segments: []
        });
      }
      
    } catch (err) {
      console.error("❌ Transcript generation error:", err);
      setTranscriptData({
        transcript: "Error generating transcript. Please try again.",
        videoId: video.id,
        title: video.title,
        channelTitle: video.channelTitle,
        viewCount: video.viewCount,
        segments: []
      });
    } finally {
      setTranscriptLoading(false);
    }
  };

  const handleBrowseMore = () => {
    if (currentPageToken) {
      try { prevScrollYRef.current = typeof window !== 'undefined' ? window.scrollY : 0; } catch {}
      handleSearch(currentPageToken);
    }
  };

  const handleCopySummary = async () => {
    try {
      if (!summaryData) return;
      await navigator.clipboard.writeText(summaryData.summary);
    } catch {}
  };

  const handleShareSummary = async () => {
    if (!summaryData) return;
    const shareUrl = `https://www.youtube.com/watch?v=${summaryData.videoId}`;
    const text = `${summaryData.title}\n\n${summaryData.summary}\n\nWatch: ${shareUrl}`;
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({
          title: summaryData.title,
          text,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(text);
      }
    } catch {}
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatViewCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
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

      <div className="relative z-10 w-full max-w-6xl p-6">
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-5xl font-extrabold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-purple-100 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
        >
          🎬 YouTube Summarizer
        </motion.h1>

        <motion.div 
          className="flex gap-2 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Input
            placeholder="Enter a topic to search for videos..."
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
            {loading ? "⚡ Searching..." : "🚀 Search Videos"}
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
              <AILoader text="Searching Videos" size="md" />
            </div>
          </motion.div>
        )}

        {inputFocused && query.length >= 2 && (
          <div onMouseDown={(e) => e.preventDefault()}>
            <Recommendations
              seedQuery={query}
              context={{ source: 'youtube', items: videos }}
              onPick={(q) => { setQuery(q); handleSearch(); }}
              useCase="company"
              enableWebFilters={true}
              enableCompanySearch={true}
            />
          </div>
        )}

        {/* Video Results */}
        {videos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {videos.map((video, index) => (
                          <motion.div
                            key={video.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                  <Card className="border border-white/[0.1] bg-white/[0.03] backdrop-blur-lg hover:bg-white/[0.08] transition-all duration-300 h-full">
                    <CardContent className="p-4 h-full flex flex-col">
                      {/* Thumbnail */}
                                {video.thumbnail && (
                        <div className="relative mb-3">
                                  <img 
                                    src={video.thumbnail} 
                                    alt={video.title}
                            className="w-full h-32 object-cover rounded-lg"
                                  />
                          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                            {formatDuration(video.duration)}
                          </div>
                        </div>
                                )}
                      
                      {/* Video Info */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-white/90 text-sm mb-2 line-clamp-2 leading-tight">
                                  {video.title}
                        </h3>
                        
                        <div className="space-y-2 mb-4">
                          <a 
                            href={video.channelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/60 text-xs hover:text-white/80 transition-colors block"
                          >
                            📺 {video.channelTitle}
                          </a>
                          
                                <div className="flex items-center justify-between text-xs text-white/50">
                            <span>👁️ {formatViewCount(video.viewCount)} views</span>
                            <span>📅 {formatDate(video.publishedAt)}</span>
                          </div>
                        </div>
                                </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 mt-auto">
                        <a 
                          href={video.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-white/[0.1] hover:bg-white/[0.2] text-white text-sm py-2 px-3 rounded-lg transition-colors text-center block"
                        >
                          🎥 Watch Video
                        </a>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => handleGenerateSummary(video)}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 rounded-lg transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] font-semibold text-xs py-2"
                          >
                            📝 Summary
                          </Button>
                          
                          <Button
                            onClick={() => handleGenerateTranscript(video)}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 rounded-lg transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] font-semibold text-xs py-2"
                          >
                            📄 Transcript
                          </Button>
                                    </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>

            {/* Browse More Button */}
            {hasMoreResults && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                className="text-center mt-8"
                  >
                    <Button
                      onClick={handleBrowseMore}
                      disabled={loading}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 rounded-xl transition-all duration-300 hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] font-semibold px-8 py-3 text-lg"
                    >
                  {loading ? "⏳ Loading..." : "🔍 Load More Videos"}
                    </Button>
                  </motion.div>
                )}
              </motion.div>
        )}

        {/* No Results Message */}
        {videos.length === 0 && !loading && query && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <p className="text-white/60 text-lg">
              No videos found for "{query}". Try a different search term.
            </p>
          </motion.div>
        )}

        {/* Summary Dialog */}
        <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#030303] border-white/[0.1] text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white/90">
                📝 Video Summary
              </DialogTitle>
            </DialogHeader>
            
            {summaryLoading ? (
              <div className="text-center py-12">
                <AILoader text="Generating Summary" size="lg" />
              </div>
            ) : summaryData ? (
              <div className="space-y-4">
                {/* Video Info Header */}
                <div className="p-4 bg-white/[0.05] rounded-lg border border-white/[0.1]">
                  <h3 className="text-lg font-semibold text-white/90 mb-2">
                    {summaryData.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <span>📺 {summaryData.channelTitle}</span>
                    <span>👁️ {formatViewCount(summaryData.viewCount)} views</span>
                  </div>
                </div>

                {/* Summary Content */}
                <div className="prose prose-invert max-w-none">
                  <div 
                    className="text-white/80 leading-relaxed whitespace-pre-line"
                    dangerouslySetInnerHTML={{ 
                      __html: summaryData.summary.replace(/\n/g, '<br/>') 
                    }}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-white/[0.1] flex-wrap">
                  <a 
                    href={`https://www.youtube.com/watch?v=${summaryData.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-white/[0.1] hover:bg-white/[0.2] text-white text-center py-2 px-4 rounded-lg transition-colors"
                  >
                    🎥 Watch on YouTube
                  </a>
                  <Button
                    onClick={handleCopySummary}
                    className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-0 rounded-lg transition-all duration-300"
                  >
                    📋 Copy Summary
                  </Button>
                  <Button
                    onClick={handleShareSummary}
                    className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white border-0 rounded-lg transition-all duration-300"
                  >
                    🔗 Share
                  </Button>
                  <Button
                    onClick={() => setShowSummaryDialog(false)}
                    className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white border-0 rounded-lg transition-all duration-300"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Transcript Dialog */}
        <Dialog open={showTranscriptDialog} onOpenChange={setShowTranscriptDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#030303] border-white/[0.1] text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white/90">
                📄 Video Transcript
              </DialogTitle>
            </DialogHeader>
            
            {transcriptLoading ? (
              <div className="text-center py-12">
                <AILoader text="Generating Transcript" size="lg" />
              </div>
            ) : transcriptData ? (
              <div className="space-y-4">
                {/* Video Info Header */}
                <div className="p-4 bg-white/[0.05] rounded-lg border border-white/[0.1]">
                  <h3 className="text-lg font-semibold text-white/90 mb-2">
                    {transcriptData.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <span>📺 {transcriptData.channelTitle}</span>
                    <span>👁️ {formatViewCount(transcriptData.viewCount)} views</span>
                </div>
              </div>
              
                {/* Transcript Content */}
                <div className="space-y-4">
                  {/* Full Transcript Text */}
                  <div className="p-4 bg-white/[0.05] rounded-lg border border-white/[0.1]">
                    <h4 className="text-md font-semibold text-white/80 mb-3">📝 Full Transcript</h4>
                    <div className="text-white/70 text-sm leading-relaxed max-h-40 overflow-y-auto">
                      {transcriptData.transcript}
                    </div>
                  </div>

                  {/* Timestamped Segments */}
                  {transcriptData.segments && transcriptData.segments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-md font-semibold text-white/80">⏱️ Timestamped Segments</h4>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {transcriptData.segments.map((segment, index) => (
                          <div key={index} className="flex gap-3 p-2 hover:bg-white/[0.05] rounded transition-colors">
                            <span className="text-xs text-white/40 font-mono flex-shrink-0 mt-1 min-w-[3rem]">
                          {formatTime(segment.start)}
                        </span>
                            <p className="text-white/70 text-sm leading-relaxed">
                          {segment.text}
                        </p>
                      </div>
                    ))}
                  </div>
                      </div>
                    )}
                  </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-white/[0.1]">
                  <a 
                    href={`https://www.youtube.com/watch?v=${transcriptData.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-white/[0.1] hover:bg-white/[0.2] text-white text-center py-2 px-4 rounded-lg transition-colors"
                  >
                    🎥 Watch on YouTube
                  </a>
                  <Button
                    onClick={() => setShowTranscriptDialog(false)}
                    className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white border-0 rounded-lg transition-all duration-300"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/80 pointer-events-none" />
    </div>
  );
}
