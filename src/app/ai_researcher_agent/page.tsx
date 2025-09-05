"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Bot, Lightbulb, Target, TrendingUp, Users, Building2, Zap, Copy, Table } from "lucide-react";
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
            className='{absolute ${className}'
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
                    className='{absolute inset-0 rounded-full bg-gradient-to-r to-transparent ${gradient} backdrop-blur-[2px] border-2 border-white/[0.15] shadow-[0_8px_32px_0_rgba(255,255,255,0.1)] after:absolute after:inset-0 after:rounded-full after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]}'
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
  const [researchData, setResearchData] = useState<any>(null);
  const [researchPreferences, setResearchPreferences] = useState({
    industry: '',
    focus: '',
    depth: 'comprehensive',
    preserveTables: true // New option to preserve tabular data
  });
  const [generatingMore, setGeneratingMore] = useState(false);
  const [additionalResearchData, setAdditionalResearchData] = useState<any>(null);
  const [lastAutoLoadTime, setLastAutoLoadTime] = useState<number>(0);
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const [autoLoadCount, setAutoLoadCount] = useState(0);
  const [showAutoLoadIndicator, setShowAutoLoadIndicator] = useState(false);
  const [autoLoadError, setAutoLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [copiedParagraphs, setCopiedParagraphs] = useState<Set<number>>(new Set());
  const [structuredParagraphs, setStructuredParagraphs] = useState<Set<number>>(new Set());
  const [showResearchModal, setShowResearchModal] = useState(false);
  
  // Debug modal state changes
  useEffect(() => {
    console.log('Research modal state changed:', showResearchModal);
  }, [showResearchModal]);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Auto-open research modal when component mounts
  useEffect(() => {
    console.log('Component mounted, setting up auto-open timer');
    const timer = setTimeout(() => {
      console.log('Auto-opening research modal');
      setShowResearchModal(true);
    }, 1000); // Increased delay to ensure component is fully mounted
    
    return () => clearTimeout(timer);
  }, []);

  // Generate more content when button is clicked
  const handleAutoLoad = async () => {
    if (isAutoLoading || !researchData) return;
    
    const now = Date.now();
    const timeSinceLastLoad = now - lastAutoLoadTime;
    const oneMinute = 60 * 1000; // 1 minute in milliseconds
    
    if (timeSinceLastLoad < oneMinute) {
      console.log(`Auto-load blocked: ${Math.ceil((oneMinute - timeSinceLastLoad) / 1000)} seconds remaining`);
      return;
    }
    
    setIsAutoLoading(true);
    setLastAutoLoadTime(now);
    setAutoLoadCount(prev => prev + 1);
    
    try {
      // Enhanced query for additional research with more detailed focus
      let enhancedQuery = `DEEP DIVE ADDITIONAL RESEARCH for: ${query}\n\n`;
      if (researchPreferences.industry || researchPreferences.focus || researchPreferences.depth) {
        enhancedQuery += 'Research Preferences:\n';
        if (researchPreferences.industry) enhancedQuery += `- Industry: ${researchPreferences.industry}\n`;
        if (researchPreferences.focus) enhancedQuery += `- Focus: ${researchPreferences.focus}\n`;
        if (researchPreferences.depth) enhancedQuery += `- Depth: ${researchPreferences.depth}\n`;
      }
      enhancedQuery += `\nPlease provide EXTREMELY DETAILED additional research including:

1. COMPREHENSIVE MARKET ANALYSIS:
   - Recent market shifts and emerging opportunities (last 6 months)
   - Detailed competitive landscape with 15+ companies
   - Market sizing with TAM, SAM, SOM data
   - Customer behavior shifts and new pain points

2. EXTENSIVE FUNDING & FINANCIAL DATA:
   - Recent funding rounds with specific amounts and investors
   - Revenue data and growth metrics for 15+ companies
   - Valuation trends and exit strategies
   - Unit economics and business model analysis

3. REGULATORY & COMPLIANCE UPDATES:
   - Recent regulatory changes affecting the industry
   - Government incentives and support programs
   - Compliance requirements and best practices
   - International market considerations

4. TECHNOLOGY & INNOVATION TRENDS:
   - Latest technological advancements
   - Emerging tools and platforms
   - Innovation vectors and R&D focus areas
   - Technology adoption patterns

5. DETAILED CASE STUDIES:
   - 10+ recent company case studies with metrics
   - Success stories and failure analysis
   - Pivot strategies and market adaptations
   - Founder insights and lessons learned

6. STRATEGIC RECOMMENDATIONS:
   - Actionable next steps for founders
   - Risk mitigation strategies
   - Partnership opportunities
   - Market entry strategies

Focus on providing EXTREMELY DETAILED, DATA-RICH insights with specific numbers, dates, and sources. Include comprehensive tables and structured data.`;
      
      // Call the backend API for additional research with more article summaries
      const response = await fetch('/api/ai-research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: enhancedQuery,
          isAdditionalResearch: true,
          originalQuery: query,
          generateArticleSummaries: true,
          numSummaries: 12, // Generate 12 detailed article summaries
          preserveTables: researchPreferences.preserveTables
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const additionalData = await response.json();
      
      if (additionalData.error) {
        throw new Error(additionalData.error);
      }

      // Store additional research data
      setAdditionalResearchData(additionalData);
      
      // Append to existing results with enhanced formatting
      let additionalContent = '\n\n' + '='.repeat(100) + '\n\n';
      additionalContent += '🔍 DEEP DIVE ADDITIONAL RESEARCH & INSIGHTS:\n\n';
      additionalContent += additionalData.answer + '\n\n';
      
      // Add article summaries if available
      if (additionalData.articleSummaries && additionalData.articleSummaries.length > 0) {
        additionalContent += '📰 DETAILED ARTICLE SUMMARIES:\n\n';
        additionalData.articleSummaries.forEach((article: any, index: number) => {
          additionalContent += `Article ${index + 1}: ${article.title}\n`;
          additionalContent += `Source: ${article.source} | Date: ${article.date}\n`;
          additionalContent += `Summary: ${article.summary}\n`;
          additionalContent += `Link: ${article.link}\n\n`;
          additionalContent += '-'.repeat(80) + '\n\n';
        });
      }
      
      // Add YouTube videos if available
      if (additionalData.youtubeVideos && additionalData.youtubeVideos.length > 0) {
        additionalContent += '🎥 RELEVANT YOUTUBE VIDEOS (Sorted by View Count):\n\n';
        additionalData.youtubeVideos
          .sort((a: any, b: any) => (b.viewCount || 0) - (a.viewCount || 0))
          .forEach((video: any, index: number) => {
          additionalContent += `Video ${index + 1}: ${video.title}\n`;
          additionalContent += `Channel: ${video.channelTitle} | Views: ${video.viewCount}\n`;
          additionalContent += `Summary: ${video.summary}\n`;
          additionalContent += `Link: ${video.link}\n\n`;
          additionalContent += '-'.repeat(80) + '\n\n';
        });
      }
      
      setResearchResults(prev => prev + additionalContent);
      
      // Smooth scroll to show new content
      // Scroll to results after successful research
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 500);
      
    } catch (error: any) {
      console.error('Auto-load research failed:', error);
      setAutoLoadError(error.message || 'Unknown error occurred');
      setRetryCount(prev => prev + 1);
      
      // Only add error to results if it's not a retryable error
      if (retryCount >= 2) {
        setResearchResults(prev => prev + '\n\n' + '='.repeat(80) + '\n\n' + '❌ AUTO-LOAD RESEARCH FAILED: ' + (error.message || 'Unknown error occurred') + '\n\n' + 'Please try again or check your OpenAI API key configuration.');
      }
    } finally {
      setIsAutoLoading(false);
      setShowAutoLoadIndicator(false);
    }
  };

  // Retry function for failed auto-load requests
  const retryAutoLoad = async () => {
    setAutoLoadError(null);
    setRetryCount(0);
    await handleAutoLoad();
  };

  // Research modal handlers
  const handleResearchModalComplete = (preferences: any) => {
    console.log("Research preferences completed:", preferences);
    setShowResearchModal(false);
    // You can use these preferences to enhance the research query
  };

  const handleResearchModalClose = () => {
    setShowResearchModal(false);
  };

  // Function to detect and convert semi-tabular data to proper structure
  const convertToStructuredTable = (paragraphText: string, paragraphIndex: number) => {
    // Detect semi-tabular patterns
    const lines = paragraphText.split('\n').filter(line => line.trim());
    const hasTablePatterns = lines.some(line => 
      line.includes('|') || 
      line.includes('Company') && line.includes('Revenue') ||
      line.includes('Market') && line.includes('Growth') ||
      line.includes('Funding') && line.includes('Amount') ||
      line.includes('TAM') || line.includes('SAM') || line.includes('SOM') ||
      line.match(/\d+%/) || line.match(/\$\d+/) ||
      line.includes('•') && line.includes(':') ||
      line.match(/^\s*[A-Z][a-z]+.*:.*\d/) // Pattern like "Company: Value"
    );

    if (!hasTablePatterns) {
      alert('No semi-tabular data detected in this paragraph.');
      return;
    }

    // Convert to structured table format
    let structuredData = '';
    
    // Try to detect different patterns and convert them
    if (paragraphText.includes('|')) {
      // Already has some table structure, clean it up
      structuredData = paragraphText.replace(/\|+/g, '|').replace(/\|\s*\|/g, '|');
    } else {
      // Convert bullet points or other patterns to table format
      const convertedLines = lines.map(line => {
        // Handle patterns like "Company: Value" or "Company - Value"
        if (line.includes(':') || line.includes(' - ')) {
          const parts = line.split(/[:|]| - /);
          if (parts.length >= 2) {
            return parts.map(part => part.trim()).join(' | ');
          }
        }
        // Handle bullet points with data
        if (line.includes('•') && line.includes(':')) {
          return line.replace('•', '').replace(':', ' | ').trim();
        }
        return line;
      });
      
      structuredData = convertedLines.join('\n');
    }

    // Add table headers if missing
    if (!structuredData.includes('Company') && !structuredData.includes('Metric')) {
      const firstLine = structuredData.split('\n')[0];
      if (firstLine && !firstLine.includes('|')) {
        // Add basic headers
        structuredData = 'Metric | Value | Details\n' + structuredData;
      }
    }

    // Copy to clipboard
    navigator.clipboard.writeText(structuredData).then(() => {
      setStructuredParagraphs(prev => new Set([...prev, paragraphIndex]));
      setTimeout(() => {
        setStructuredParagraphs(prev => {
          const newSet = new Set(prev);
          newSet.delete(paragraphIndex);
          return newSet;
        });
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy structured data:', err);
      alert('Failed to copy structured data to clipboard.');
    });
  };

  // Function to copy paragraph to notepad
  const copyParagraphToNotepad = (paragraphText: string, paragraphIndex: number) => {
    // Open the notepad if it's not already open
    window.dispatchEvent(new Event("open-research-notepad"));
    
    // Add the paragraph to the notepad content
    const timestamp = new Date().toLocaleString();
    const formattedText = `\n\n--- Copied from AI Research (${timestamp}) ---\n${paragraphText}\n--- End of copied content ---\n`;
    
    // Dispatch event to add content to notepad
    const addToNotepadEvent = new CustomEvent("add-to-research-notepad", { 
      detail: { content: formattedText } 
    });
    window.dispatchEvent(addToNotepadEvent);
    
    // Show visual feedback
    setCopiedParagraphs(prev => new Set([...prev, paragraphIndex]));
    setTimeout(() => {
      setCopiedParagraphs(prev => {
        const newSet = new Set(prev);
        newSet.delete(paragraphIndex);
        return newSet;
      });
    }, 2000);
  };

  // Manual generate more functionality (removed auto-scroll)

  // Manual generate more button handler
  const handleGenerateMore = () => {
    if (isAutoLoading || !researchData) return;
    console.log('Generate More button clicked, loading additional content...');
    setShowAutoLoadIndicator(true);
    handleAutoLoad();
  };

  const handleResearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setShowResults(false);
    setAutoLoadCount(0); // Reset auto-load count for new research
    setAutoLoadError(null); // Reset error state
    setRetryCount(0); // Reset retry count
    
    try {
      // Enhanced query based on preferences
      let enhancedQuery = query;
      if (researchPreferences.industry || researchPreferences.focus || researchPreferences.depth) {
        enhancedQuery += '\n\nResearch Preferences:\n';
        if (researchPreferences.industry) enhancedQuery += `- Industry: ${researchPreferences.industry}\n`;
        if (researchPreferences.focus) enhancedQuery += `- Focus: ${researchPreferences.focus}\n`;
        if (researchPreferences.depth) enhancedQuery += `- Depth: ${researchPreferences.depth}\n`;
      }
      
      // Call the backend API with article summaries
      const response = await fetch('/api/ai-research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: enhancedQuery,
          preferences: researchPreferences,
          generateArticleSummaries: true,
          numSummaries: 8, // Generate 8 article summaries for initial research
          preserveTables: researchPreferences.preserveTables
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed: ${response.status}');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Store the full research data
      setResearchData(data);
      
      // Format the results nicely with Business Model Canvas structure (plain text)
      let formattedResults = `AI Research Results: ${query}

Executive Summary
${data.summary}

Business Model Canvas Analysis
${data.answer}

`;

      // Add article summaries if available
      if (data.articleSummaries && data.articleSummaries.length > 0) {
        formattedResults += '📰 RELEVANT ARTICLE SUMMARIES:\n\n';
        data.articleSummaries.forEach((article: any, index: number) => {
          formattedResults += `Article ${index + 1}: ${article.title}\n`;
          formattedResults += `Source: ${article.source} | Date: ${article.date}\n`;
          formattedResults += `Summary: ${article.summary}\n`;
          formattedResults += `Link: ${article.link}\n\n`;
          formattedResults += '-'.repeat(80) + '\n\n';
        });
      }

      // Add YouTube videos if available
      if (data.youtubeVideos && data.youtubeVideos.length > 0) {
        formattedResults += '🎥 RELEVANT YOUTUBE VIDEOS (Sorted by View Count):\n\n';
        data.youtubeVideos
          .sort((a: any, b: any) => (b.viewCount || 0) - (a.viewCount || 0))
          .forEach((video: any, index: number) => {
          formattedResults += `Video ${index + 1}: ${video.title}\n`;
          formattedResults += `Channel: ${video.channelTitle} | Views: ${video.viewCount}\n`;
          formattedResults += `Summary: ${video.summary}\n`;
          formattedResults += `Link: ${video.link}\n\n`;
          formattedResults += '-'.repeat(80) + '\n\n';
        });
      }

      formattedResults += 'Generated by AI Research Agent - Startup Founder Assistant';

      setResearchResults(formattedResults);
      setShowResults(true);
    } catch (error: any) {
      console.error("Research failed:", error);
      // Show error to user
      setResearchResults(`# Research Failed

Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}

Please try again or check your OpenAI API key configuration.`);
      setShowResults(true);
    } finally {
      setLoading(false);
    }
  };


  const quickPrompts = [
    "Business Model Canvas analysis for SaaS startups",
    "Competitive landscape and business model analysis in fintech",
    "Customer segments and value proposition analysis for B2B",
    "Product-market fit and business model validation",
    "Funding trends and revenue model analysis in AI sector",
    "User research and customer relationship strategies",
    
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#030303] overflow-x-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />

      <div className="relative z-10 flex min-h-screen max-w-full">
        {/* Left Sidebar - Expandable Docs Sidebar */}
        <div className="w-80 flex-shrink-0">
          <ExpandableDocsSidebar 
            currentPage="ai_researcher"
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 max-w-full">
          {/* Header */}
          <div className="p-8 pb-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-purple-100 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center gap-3">
              <Bot className="w-10 h-10 text-white" />
              <span>AI Research Agent</span>
            </h1>
            <p className="text-center text-white/60 mt-4 text-lg max-w-3xl mx-auto">
              Three-section research platform: AI Analysis, YouTube Summaries, and News Insights - all organized for startup founders
            </p>
          </div>

          {/* Page Content */}
          <div className="flex-1 px-8 pb-8 overflow-x-hidden overflow-y-auto min-w-0">
            <div className="bg-white/5 rounded-2xl p-6 text-gray-200 relative min-h-0 w-full max-w-full">
              {/* Floating geometric shapes */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
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

              <div className="relative z-10 w-full min-h-0">
                {/* Research Preferences */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="mb-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Industry Focus
                      </label>
                      <select
                        value={researchPreferences.industry}
                        onChange={(e) => setResearchPreferences(prev => ({ ...prev, industry: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 backdrop-blur-sm"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Select Industry</option>
                        <option value="Technology & Software" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Technology & Software</option>
                        <option value="Healthcare & Biotech" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Healthcare & Biotech</option>
                        <option value="Fintech & Financial Services" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Fintech & Financial Services</option>
                        <option value="E-commerce & Retail" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>E-commerce & Retail</option>
                        <option value="Clean Energy & Sustainability" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Clean Energy & Sustainability</option>
                        <option value="Education & EdTech" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Education & EdTech</option>
                        <option value="Real Estate & PropTech" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Real Estate & PropTech</option>
                        <option value="Transportation & Mobility" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Transportation & Mobility</option>
                        <option value="Food & Agriculture" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Food & Agriculture</option>
                        <option value="Manufacturing & Industrial" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Manufacturing & Industrial</option>
                        <option value="Media & Entertainment" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Media & Entertainment</option>
                        <option value="Gaming & Esports" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Gaming & Esports</option>
                        <option value="Cybersecurity" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Cybersecurity</option>
                        <option value="AI & Machine Learning" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>AI & Machine Learning</option>
                        <option value="Blockchain & Crypto" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Blockchain & Crypto</option>
                        <option value="SaaS & Cloud Services" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>SaaS & Cloud Services</option>
                        <option value="Marketplace & Platforms" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Marketplace & Platforms</option>
                        <option value="Consumer Goods & Services" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Consumer Goods & Services</option>
                        <option value="B2B Services" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>B2B Services</option>
                        <option value="Other" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Other (Custom)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Research Focus
                      </label>
                      <select
                        value={researchPreferences.focus}
                        onChange={(e) => setResearchPreferences(prev => ({ ...prev, focus: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 backdrop-blur-sm"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Select Research Focus</option>
                        <option value="Market Entry & Expansion" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Market Entry & Expansion</option>
                        <option value="Competitive Analysis" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Competitive Analysis</option>
                        <option value="Customer Segmentation" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Customer Segmentation</option>
                        <option value="Product-Market Fit" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Product-Market Fit</option>
                        <option value="Funding & Investment" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Funding & Investment</option>
                        <option value="Revenue Models & Pricing" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Revenue Models & Pricing</option>
                        <option value="Technology Trends" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Technology Trends</option>
                        <option value="Regulatory & Compliance" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Regulatory & Compliance</option>
                        <option value="Partnership Opportunities" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Partnership Opportunities</option>
                        <option value="Risk Assessment" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Risk Assessment</option>
                        <option value="Market Sizing & Growth" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Market Sizing & Growth</option>
                        <option value="Customer Acquisition" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Customer Acquisition</option>
                        <option value="Business Model Innovation" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Business Model Innovation</option>
                        <option value="International Expansion" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>International Expansion</option>
                        <option value="M&A Opportunities" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>M&A Opportunities</option>
                        <option value="Industry Benchmarking" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Industry Benchmarking</option>
                        <option value="Startup Ecosystem" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Startup Ecosystem</option>
                        <option value="Talent & Hiring" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Talent & Hiring</option>
                        <option value="Supply Chain Analysis" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Supply Chain Analysis</option>
                        <option value="Sustainability & ESG" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Sustainability & ESG</option>
                        <option value="Other" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Other (Custom)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Analysis Depth
                      </label>
                      <select
                        value={researchPreferences.depth}
                        onChange={(e) => setResearchPreferences(prev => ({ ...prev, depth: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 backdrop-blur-sm"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="comprehensive" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Comprehensive</option>
                        <option value="detailed" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Detailed</option>
                        <option value="overview" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Overview</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Data Format
                      </label>
                      <select
                        value={researchPreferences.preserveTables ? 'tables' : 'summary'}
                        onChange={(e) => setResearchPreferences(prev => ({ ...prev, preserveTables: e.target.value === 'tables' }))}
                        className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 backdrop-blur-sm"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="tables" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Detailed Tables</option>
                        <option value="summary" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Summarized</option>
                      </select>
                    </div>
                  </div>
                  {researchPreferences.preserveTables && (
                    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-blue-300 text-sm">
                        📊 <strong>Detailed Tables Mode:</strong> This will preserve all tabular data and comprehensive tables in the research results. Recommended for detailed market analysis and competitive intelligence.
                      </p>
                    </div>
                  )}
                </motion.div>


                {/* Main Research Input */}
                <motion.div 
                  className="flex gap-2 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <Input
                    placeholder="Describe your startup research topic, market analysis, or business question..."
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
                    {loading ? "🔍 Researching..." : "Generate Research Report"}
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 rounded-xl transition-all duration-300 hover:shadow-[0_0_25px_rgba(34,197,94,0.4)] font-semibold px-6"
                    onClick={() => setShowResearchModal(true)}
                    disabled={loading}
                  >
                    🎯 Research Preferences
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
                      Conducting comprehensive market analysis, competitive landscape research, and strategic insights...
                    </div>
                    <div className="mt-2 text-white/40 text-xs">
                      Generating detailed Business Model Canvas analysis with extensive data...
                    </div>
                  </motion.div>
                )}

                {/* Research Results */}
                {showResults && researchResults && (
                  <motion.div
                    ref={resultsRef}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 mt-8 w-full max-w-full"
                  >
                    {/* Section 1: AI Research Analysis */}
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-sm relative z-20 w-full max-w-full overflow-hidden">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                          <Bot className="w-5 h-5 text-indigo-400" />
                          {researchResults.includes('Research Failed') ? 'Research Error' : '🧠 AI Research Analysis'}
                        </h3>
                        {!researchResults.includes('Research Failed') && (
                          <Button
                            onClick={() => {
                              const blob = new Blob([researchResults], { type: "text/plain;charset=utf-8" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = 'ai-research-' + query.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() + '.txt';
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            }}
                            className="bg-white/[0.1] hover:bg-white/[0.2] text-white border border-white/[0.2] rounded-lg px-4 py-2 text-sm"
                          >
                            Download Results
                          </Button>
                        )}
                      </div>
                      <div className="prose prose-invert max-w-none relative z-10">
                        {researchResults.includes('Research Failed') ? (
                          <pre className="whitespace-pre-wrap text-sm leading-relaxed bg-white/[0.02] p-4 rounded-lg border border-white/[0.05] text-red-300 font-mono max-h-96 overflow-y-auto">
                            {researchResults}
                          </pre>
                        ) : (
                          <div className="bg-white/[0.02] p-4 rounded-lg border border-white/[0.05] max-h-[50vh] overflow-y-auto w-full max-w-full">
                            {researchResults.split('\n\n').map((paragraph, index) => {
                              if (!paragraph.trim()) return null;
                              const isCopied = copiedParagraphs.has(index);
                              return (
                                <div key={index} className="relative group mb-4 last:mb-0 w-full">
                                  <div className="flex items-start gap-3 w-full">
                                    <div className="flex-1 min-w-0 max-w-full">
                                      <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                                        {paragraph}
                                      </p>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => convertToStructuredTable(paragraph, index)}
                                        className={`opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 rounded-lg flex-shrink-0 ${
                                          structuredParagraphs.has(index)
                                            ? 'bg-blue-500/20 text-blue-300' 
                                            : 'bg-white/[0.08] hover:bg-white/[0.15] text-white/60 hover:text-white'
                                        }`}
                                        title={structuredParagraphs.has(index) ? "Structured data copied!" : "Convert to structured table"}
                                      >
                                        {structuredParagraphs.has(index) ? (
                                          <div className="w-4 h-4 flex items-center justify-center">
                                            <span className="text-blue-400 text-xs">✓</span>
                                          </div>
                                        ) : (
                                          <Table className="w-4 h-4" />
                                        )}
                                      </button>
                                      <button
                                        onClick={() => copyParagraphToNotepad(paragraph, index)}
                                        className={`opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 rounded-lg flex-shrink-0 ${
                                          isCopied 
                                            ? 'bg-green-500/20 text-green-300' 
                                            : 'bg-white/[0.08] hover:bg-white/[0.15] text-white/60 hover:text-white'
                                        }`}
                                        title={isCopied ? "Copied to notepad!" : "Copy paragraph to notepad"}
                                      >
                                        {isCopied ? (
                                          <div className="w-4 h-4 flex items-center justify-center">
                                            <span className="text-green-400 text-xs">✓</span>
                                          </div>
                                        ) : (
                                          <Copy className="w-4 h-4" />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {researchResults.includes('Research Failed') && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <p className="text-red-300 text-sm">
                            💡 <strong>Tip:</strong> Make sure you have configured your OpenAI API key in the environment variables. 
                            Create a <code className="bg-red-500/20 px-2 py-1 rounded">.env.local</code> file in your project root with:
                          </p>
                          <pre className="mt-2 text-xs text-red-200 bg-red-500/20 p-2 rounded">
OPENAI_API_KEY=your_actual_api_key_here
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* Vertical Stack Layout for All Sections */}
                    {!researchResults.includes('Research Failed') && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="space-y-12 mt-8 relative z-20 w-full max-w-full"
                      >
                        {/* Section 2: YouTube Video Analysis */}
                        {researchData?.youtubeVideos && researchData.youtubeVideos.length > 0 && (
                          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 md:p-6 backdrop-blur-sm h-fit w-full max-w-full overflow-hidden">
                            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                              📺 YouTube Video Analysis & Summaries
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-full">
                              {researchData.youtubeVideos
                                .sort((a: any, b: any) => (b.viewCount || 0) - (a.viewCount || 0))
                                .map((video: any, index: number) => (
                                <div key={video.id || index} className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl w-full max-w-full overflow-hidden">
                                  <div className="flex items-start gap-4">
                                    {video.thumbnail && (
                                      <img 
                                        src={video.thumbnail} 
                                        alt={video.title}
                                        className="w-24 h-18 object-cover rounded-lg flex-shrink-0"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-white mb-2 line-clamp-2">
                                        {video.title}
                                      </h4>
                                      <p className="text-sm text-white/70 mb-2">
                                        {video.channelTitle} • {video.viewCount.toLocaleString()} views • {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                                      </p>
                                      <p className="text-sm text-white/80 leading-relaxed mb-3">
                                        {video.summary}
                                      </p>
                                      <a 
                                        href={video.videoUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-block px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 hover:text-blue-200 text-sm transition-colors"
                                      >
                                        Watch Video →
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Section 3: News Article Analysis */}
                        {researchData?.newsArticles && researchData.newsArticles.length > 0 && (
                          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 md:p-6 backdrop-blur-sm h-fit w-full max-w-full overflow-hidden">
                            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                              📰 News Article Analysis & Insights
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-full">
                              {researchData.newsArticles.map((article: any, index: number) => (
                                <div key={index} className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl w-full max-w-full overflow-hidden">
                                  <h4 className="font-semibold text-white mb-2 line-clamp-2">
                                    {article.title}
                                  </h4>
                                  <p className="text-sm text-white/70 mb-2">
                                    {article.source} • {article.date}
                                  </p>
                                  <p className="text-sm text-white/80 leading-relaxed mb-3">
                                    {article.snippet}
                                  </p>
                                  <a 
                                    href={article.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-block px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-300 hover:text-green-200 text-sm transition-colors"
                                  >
                                    Read Article →
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Section 4: Additional Web-Searched Data */}
                        {additionalResearchData?.additionalWebData && additionalResearchData.additionalWebData.length > 0 && (
                          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 md:p-6 backdrop-blur-sm h-fit w-full max-w-full overflow-hidden">
                            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                              🌐 Additional Web-Searched Insights
                            </h3>
                            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                              <p className="text-blue-300 text-sm">
                                💡 <strong>Fresh Data:</strong> These insights were fetched from recent web searches to provide additional perspectives and up-to-date information.
                              </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-full">
                              {additionalResearchData.additionalWebData.map((article: any, index: number) => (
                                <div key={index} className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl w-full max-w-full overflow-hidden">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                                      Web-Searched
                                    </span>
                                    <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                                      Recent
                                    </span>
                                  </div>
                                  <h4 className="font-semibold text-white mb-2 line-clamp-2">
                                    {article.title}
                                  </h4>
                                  <p className="text-sm text-white/70 mb-2">
                                    {article.source} • {article.date}
                                  </p>
                                  <p className="text-sm text-white/80 leading-relaxed mb-3">
                                    {article.snippet}
                                  </p>
                                  <a 
                                    href={article.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-block px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 hover:text-blue-200 text-sm transition-colors"
                                  >
                                    Read Full Article →
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </motion.div>
                    )}

                    {/* Debug Information */}
                    {!researchResults.includes('Research Failed') && researchData && (
                      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                          🔍 Debug Information
                        </h3>
                        <div className="text-sm text-white/70 space-y-2">
                          <p>Research Data Available: {researchData ? 'Yes' : 'No'}</p>
                          <p>Answer Available: {researchData?.answer ? 'Yes' : 'No'}</p>
                          <p>YouTube Videos: {researchData?.youtubeVideos ? `${researchData.youtubeVideos.length} videos` : 'No'}</p>
                          <p>News Articles: {researchData?.newsArticles ? ` ${researchData.newsArticles.length} articles` : 'No'}</p>
                          <p>Summary Available: {researchData?.summary ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Generate More Button */}
                {showResults && researchResults && !researchResults.includes('Research Failed') && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={handleGenerateMore}
                      disabled={isAutoLoading}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 rounded-xl transition-all duration-300 hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] font-semibold px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAutoLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Generating More...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>🔍 Generate More Research</span>
                        </div>
                      )}
                    </Button>
                  </div>
                )}


              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Research Questions Modal */}
      <ResearchQuestionsModal
        isOpen={showResearchModal}
        onClose={handleResearchModalClose}
        onComplete={handleResearchModalComplete}
      />
    </div>
  );
}