"use client";

import dynamic from "next/dynamic";

const ArticleAnalysis = dynamic(() => import("@/app/article_analysis/page"), { ssr: false });

export default function MarketArticle() {
  return <ArticleAnalysis />;
}
