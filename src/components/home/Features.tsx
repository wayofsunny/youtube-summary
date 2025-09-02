"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Features() {
  const features = [
    {
      href: "/youtube_summarizer",
      title: "YouTube Summarizer",
      description: "Extract insights from founder-related videos instantly.",
      delay: 0.1
    },
    {
      href: "/article_analysis",
      title: "Article Analyzer",
      description: "Paste any article or URL for startup strategy breakdowns.",
      delay: 0.2
    },
    {
      href: "/ai_researcher_agent",
      title: "AI Researcher Agent",
      description: "AI-powered market research and strategic analysis for startups.",
      delay: 0.3
    },

    {
      href: "/ai_pitch_deck_builder",
      title: "AI Pitch Deck Builder",
      description: "Generate investor-ready decks in minutes.",
      delay: 0.4
    },
    {
      href: "/funding_trends",
      title: "Funding Trends Dashboard",
      description: "Track real-time startup funding and market shifts.",
      delay: 0.5
    },
    {
      href: "/Linkedln",
      title: "LinkedIn Search",
      description: "Find and connect with startup founders and investors.",
      delay: 0.6
    }
  ];

  return (
    <section className="py-20 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] via-transparent to-rose-500/[0.03] blur-3xl" />
      
      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
            Powerful AI Tools
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Everything you need to build, analyze, and grow your startup
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.href}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: feature.delay }}
              viewport={{ once: true }}
            >
              <Link href={feature.href} className="block group">
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-white hover:bg-white/[0.08] transition-all duration-300 backdrop-blur-sm hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:-translate-y-1">
                  <h3 className="text-lg font-semibold mb-3 group-hover:text-white/90 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-white/60 group-hover:text-white/70 transition-colors">
                    {feature.description}
                  </p>
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white/40 text-sm">Learn more →</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}