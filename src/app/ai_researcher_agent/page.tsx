"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Bot, Lightbulb, Target, TrendingUp, Users, Building2, Zap } from "lucide-react";
import { ExpandableDocsSidebar } from "@/components/ui/expandable-docs-sidebar";
import { ResearchQuestionsModal } from "@/components/ui/research-questions-modal";

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

export default function AIResearcherAgent() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [researchResults, setResearchResults] = useState<string>("");
  const [showResults, setShowResults] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(true);
  const [researchPreferences, setResearchPreferences] = useState<any>(null);

  const handleResearch = async () => {
  if (!query.trim()) return;
    
  setLoading(true);
  setShowResults(false);
    
  try {
    // Simulate AI research process
    await new Promise(resolve => setTimeout(resolve, 2000));
      
    // Enhanced results based on preferences
    let enhancedQuery = query;
    if (researchPreferences) {
      enhancedQuery += `\n\nResearch Preferences:\n`;
      Object.entries(researchPreferences).forEach(([id, preference]) => {
        enhancedQuery += `- ${preference}\n`;
      });
    }
      
    const mockResults = `# AI Research Results: ${query} ...`;

    setResearchResults(mockResults);
    setShowResults(true);
  } catch (error) {
    console.error("Research failed:", error);
  } finally {
    setLoading(false);
  }
};


  const handlePreferencesComplete = (preferences: any) => {
    setResearchPreferences(preferences);
    setShowQuestionsModal(false);
  };

  const handleCloseQuestionsModal = () => {
    setShowQuestionsModal(false);
  };

  const quickPrompts = [
    "Market opportunity analysis for SaaS startups",
    "Competitive research in fintech industry",
    "Customer acquisition strategy for B2B companies",
    "Product-market fit validation approach",
    "Funding trends in AI sector",
    "User research methodology for mobile apps"
  ];

  return (
    <>
      {/* Research Questions Modal */}
      <ResearchQuestionsModal
        isOpen={showQuestionsModal}
        onClose={handleCloseQuestionsModal}
        onComplete={handlePreferencesComplete}
      />

      <div className="relative min-h-screen w-full overflow-hidden bg-[#030303]">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />

        <div className="relative z-10 flex min-h-screen">
        {/* Left Sidebar - Expandable Docs Sidebar */}
        <div className="w-80 flex-shrink-0">
          <ExpandableDocsSidebar 
            currentPage="ai_researcher"
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-8 pb-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-purple-100 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center gap-3">
              <Bot className="w-10 h-10 text-white" />
              <span>AI Researcher Agent</span>
            </h1>
            
            {/* Preferences Summary */}
            {researchPreferences && (
              <div className="mt-6 flex justify-center">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-xl backdrop-blur-sm">
                  <span className="text-white/80 text-sm">Research preferences configured</span>
                  <button
                    onClick={() => setShowQuestionsModal(true)}
                    className="px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-lg text-indigo-300 hover:text-indigo-200 text-xs transition-colors"
                  >
                    Edit Preferences
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Page Content */}
          <div className="flex-1 px-8 pb-8">
            <div className="bg-white/5 rounded-2xl p-6 text-gray-200 relative">
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

              <div className="relative z-10 w-full">
                <motion.div 
                  className="flex gap-2 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <Input
                    placeholder="Describe your research topic or question..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    className="flex-1 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/40 focus:border-white/30 focus:ring-white/20 rounded-xl backdrop-blur-sm"
                  />
                  <Button
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 rounded-xl transition-all duration-300 hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] font-semibold px-6"
                    onClick={() => handleResearch()}
                    disabled={loading}
                  >
                    {loading ? "🔍 Researching..." : "🚀 Start Research"}
                  </Button>
                </motion.div>

                {/* Quick Prompts */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="mb-8"
                >
                  <h3 className="text-lg font-semibold text-white/80 mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                    Quick Research Prompts
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {quickPrompts.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => setQuery(prompt)}
                        className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white/70 hover:text-white hover:bg-white/[0.08] transition-all duration-300 text-left text-sm hover:border-white/[0.15]"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </motion.div>

                {/* Loading State */}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <div className="inline-flex items-center gap-3 px-6 py-4 bg-white/[0.05] border border-white/[0.1] rounded-2xl backdrop-blur-sm">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400"></div>
                      <span className="text-white/80">AI Agent is researching...</span>
                    </div>
                    <div className="mt-4 text-white/50 text-sm">
                      Analyzing market data, trends, and insights...
                    </div>
                  </motion.div>
                )}

                {/* Research Results */}
                {showResults && researchResults && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Bot className="w-5 h-5 text-indigo-400" />
                        Research Results
                      </h3>
                      <Button
                        onClick={() => {
                          const blob = new Blob([researchResults], { type: "text/plain;charset=utf-8" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `ai-research-${query.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()}.txt`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                        className="bg-white/[0.1] hover:bg-white/[0.2] text-white border border-white/[0.2] rounded-lg px-4 py-2 text-sm"
                      >
                        Download Results
                      </Button>
                    </div>
                    <div className="prose prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap text-white/80 font-mono text-sm leading-relaxed bg-white/[0.02] p-4 rounded-lg border border-white/[0.05]">
                        {researchResults}
                      </pre>
                    </div>
                  </motion.div>
                )}

                {/* Features Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  <div className="p-6 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white hover:bg-white/[0.08] transition-all duration-300 backdrop-blur-sm hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:-translate-y-1">
                    <Target className="w-8 h-8 text-indigo-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-3">Strategic Analysis</h3>
                    <p className="text-sm text-white/60">AI-powered market research and competitive analysis for informed decision-making.</p>
                  </div>
                  
                  <div className="p-6 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white hover:bg-white/[0.08] transition-all duration-300 backdrop-blur-sm hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:-translate-y-1">
                    <TrendingUp className="w-8 h-8 text-green-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-3">Trend Insights</h3>
                    <p className="text-sm text-white/60">Discover emerging trends and opportunities in your industry with AI analysis.</p>
                  </div>
                  
                  <div className="p-6 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white hover:bg-white/[0.08] transition-all duration-300 backdrop-blur-sm hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:-translate-y-1">
                    <Users className="w-8 h-8 text-purple-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-3">User Research</h3>
                    <p className="text-sm text-white/60">Understand your target audience with AI-driven user research and persona analysis.</p>
                  </div>
                  
                  <div className="p-6 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white hover:bg-white/[0.08] transition-all duration-300 backdrop-blur-sm hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:-translate-y-1">
                    <Building2 className="w-8 h-8 text-blue-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-3">Business Intelligence</h3>
                    <p className="text-sm text-white/60">Comprehensive business insights and strategic recommendations for growth.</p>
                  </div>
                  
                  <div className="p-6 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white hover:bg-white/[0.08] transition-all duration-300 backdrop-blur-sm hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:-translate-y-1">
                    <Zap className="w-8 h-8 text-yellow-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-3">Rapid Insights</h3>
                    <p className="text-sm text-white/60">Get actionable insights in minutes, not days, with AI-powered research acceleration.</p>
                  </div>
                  
                  <div className="p-6 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white hover:bg-white/[0.08] transition-all duration-300 backdrop-blur-sm hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:-translate-y-1">
                    <Search className="w-8 h-8 text-rose-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-3">Deep Research</h3>
                    <p className="text-sm text-white/60">Comprehensive research covering market analysis, competitive landscape, and strategic insights.</p>
                  </div>
                                 </motion.div>
               </div>
             </div>
           </div>
         </div>
       </div>
     </div>
   </>
 );
 }