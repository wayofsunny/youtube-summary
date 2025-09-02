"use client";

import dynamic from "next/dynamic";

// Load the existing YouTube Summarizer page inside this route without SSR
const YouTubeSummarizer = dynamic(() => import("@/app/youtube_summarizer/page"), { ssr: false });

export default function MarketYouTube() {
  return <YouTubeSummarizer />;
}
