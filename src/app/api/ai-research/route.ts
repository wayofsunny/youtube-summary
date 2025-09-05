import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Chunk summarization utility functions
function splitIntoChunks(text: string, maxChunkSize: number = 3000): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim() + '.';
    
    if (currentChunk.length + trimmedSentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmedSentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

async function summarizeChunk(chunk: string, chunkIndex: number, totalChunks: number, query: string): Promise<string> {
  try {
    // Check if chunk contains tabular data
    const hasTableData = chunk.includes('|') && chunk.includes('Company') || 
                        chunk.includes('Table') || 
                        chunk.includes('Funding') && chunk.includes('Revenue') ||
                        chunk.includes('Market') && chunk.includes('Growth');
    
    const summaryPrompt = hasTableData 
      ? `This chunk (${chunkIndex + 1}/${totalChunks}) contains TABULAR DATA about: "${query}"

Chunk Content:
${chunk}

CRITICAL INSTRUCTIONS FOR TABULAR DATA:
- PRESERVE ALL TABLE STRUCTURE exactly as provided
- DO NOT summarize or condense table rows
- Keep all column headers and data intact
- Maintain pipe (|) separators for table formatting
- Include ALL data points, numbers, and metrics
- Only add brief context if needed, but preserve the table structure
- If the table is incomplete due to chunking, note this and preserve what's available

If this chunk contains table data, return it EXACTLY as provided with minimal changes.`
      : `Summarize this chunk (${chunkIndex + 1}/${totalChunks}) of research about: "${query}"

Chunk Content:
${chunk}

Provide a comprehensive summary focusing on:
- Key data points and metrics
- Important insights and trends
- Actionable recommendations
- Specific examples and case studies

CRITICAL: Use ONLY plain text formatting. NO markdown symbols (#, *, **). Use hyphens (-) for bullet points only.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: hasTableData 
            ? "You are an expert research analyst. When processing tabular data, you MUST preserve the exact table structure, formatting, and all data points. Do not summarize or condense tables - return them exactly as provided with pipe separators intact."
            : "You are an expert research analyst. Create detailed, structured summaries of research content with focus on actionable insights and specific data points. Use ONLY plain text formatting - NO markdown symbols (#, *, **). Use hyphens (-) for bullet points only."
        },
        {
          role: "user",
          content: summaryPrompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent table preservation
      max_tokens: hasTableData ? 4000 : 2000, // More tokens for table preservation
    });

    return response.choices[0]?.message?.content || `Chunk ${chunkIndex + 1} summary unavailable.`;
  } catch (error) {
    console.error(`Error summarizing chunk ${chunkIndex + 1}:`, error);
    return `Chunk ${chunkIndex + 1} summary failed to generate.`;
  }
}

async function combineChunkSummaries(chunkSummaries: string[], originalQuery: string): Promise<string> {
  try {
    // Check if any chunks contain tabular data
    const hasTableData = chunkSummaries.some(summary => 
      summary.includes('|') && summary.includes('Company') || 
      summary.includes('Table') || 
      summary.includes('Funding') && summary.includes('Revenue') ||
      summary.includes('Market') && summary.includes('Growth')
    );

    const combinedPrompt = hasTableData
      ? `Combine these chunk summaries into a comprehensive final summary for research about: "${originalQuery}"

Chunk Summaries:
${chunkSummaries.map((summary, index) => `\n--- Chunk ${index + 1} Summary ---\n${summary}`).join('\n')}

CRITICAL INSTRUCTIONS FOR TABULAR DATA:
- PRESERVE ALL TABLE STRUCTURE exactly as provided in chunks
- DO NOT summarize, condense, or modify table rows
- Keep all column headers and data intact
- Maintain pipe (|) separators for table formatting
- Include ALL data points, numbers, and metrics from all chunks
- Combine tables from different chunks if they are the same type
- If tables are split across chunks, merge them back together
- Preserve the exact table structure and formatting
- Only add brief context sections between tables if needed

Create a unified, comprehensive summary that:
- Integrates insights from all chunks
- Eliminates redundancy in text sections only (NOT in tables)
- Maintains all important data points and table structures
- Provides clear structure and flow
- Focuses on actionable insights for startup founders
- PRESERVES ALL TABULAR DATA EXACTLY AS PROVIDED

CRITICAL: Use ONLY plain text formatting. NO markdown symbols (#, *, **). Use hyphens (-) for bullet points only. Format as a well-structured summary with clear sections, bullet points, and preserved tables.`
      : `Combine these chunk summaries into a comprehensive final summary for research about: "${originalQuery}"

Chunk Summaries:
${chunkSummaries.map((summary, index) => `\n--- Chunk ${index + 1} Summary ---\n${summary}`).join('\n')}

Create a unified, comprehensive summary that:
- Integrates insights from all chunks
- Eliminates redundancy
- Maintains all important data points
- Provides clear structure and flow
- Focuses on actionable insights for startup founders

CRITICAL: Use ONLY plain text formatting. NO markdown symbols (#, *, **). Use hyphens (-) for bullet points only. Format as a well-structured summary with clear sections and bullet points.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: hasTableData
            ? "You are an expert research analyst. When combining summaries that contain tabular data, you MUST preserve the exact table structure, formatting, and all data points. Do not summarize or condense tables - return them exactly as provided with pipe separators intact. Combine tables from different chunks if they are the same type."
            : "You are an expert research analyst. Combine multiple research summaries into a comprehensive, well-structured final summary that eliminates redundancy while preserving all important insights. Use ONLY plain text formatting - NO markdown symbols (#, *, **). Use hyphens (-) for bullet points only."
        },
        {
          role: "user",
          content: combinedPrompt
        }
      ],
      temperature: 0.2, // Lower temperature for more consistent table preservation
      max_tokens: hasTableData ? 8000 : 4000, // More tokens for table preservation
    });

    return response.choices[0]?.message?.content || "Failed to combine chunk summaries.";
  } catch (error) {
    console.error("Error combining chunk summaries:", error);
    return "Failed to combine chunk summaries.";
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured");
      return NextResponse.json({ 
        error: "OpenAI API key not configured. Please set OPENAI_API_KEY in your environment variables.",
        details: "Missing OPENAI_API_KEY environment variable"
      }, { status: 500 });
    }

    // Validate API key format
    if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
      console.error("Invalid OpenAI API key format");
      return NextResponse.json({ 
        error: "Invalid OpenAI API key format. API key should start with 'sk-'.",
        details: "API key format validation failed"
      }, { status: 500 });
    }

    const { query, isAdditionalResearch, originalQuery, generateArticleSummaries, numSummaries = 5, preserveTables = true } = await request.json();

    // Validate input
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ 
        error: "Invalid query provided. Query must be a non-empty string.",
        details: "Query validation failed"
      }, { status: 400 });
    }

    if (query.length > 10000) {
      return NextResponse.json({ 
        error: "Query too long. Please keep queries under 10,000 characters.",
        details: "Query length validation failed"
      }, { status: 400 });
    }

    // Validate numSummaries
    const validNumSummaries = Math.min(Math.max(parseInt(numSummaries) || 5, 1), 20);
    if (validNumSummaries !== numSummaries) {
      console.warn(`numSummaries adjusted from ${numSummaries} to ${validNumSummaries}`);
    }

    console.log("🚀 AI Research Agent started for query:", query);
    if (isAdditionalResearch) {
      console.log("📚 Additional research mode for original query:", originalQuery);
    }

    // Generate research answer using LLM
   
    const systemPrompt = isAdditionalResearch
    ? `You are an AI Research Agent for a Startup Founder Assistant, now conducting ADDITIONAL RESEARCH to complement previous findings. Your PRIMARY JOB is to generate COMPREHENSIVE TABULAR DATA.
  
     1) BUILD UPON existing research for: ${originalQuery}
  2) Provide FRESH PERSPECTIVES and NEW INSIGHTS that weren't covered before
  3) PRIORITIZE RECENT DEVELOPMENTS (last 6 months) and EMERGING TRENDS
  4) Add NEW CASE STUDIES and EXAMPLES across multiple industries and company stages
  5) Include ADDITIONAL DATA POINTS and METRICS with clear units, dates, and sources
  6) Suggest NEW STRATEGIC OPPORTUNITIES and RISKS with mitigation ideas
  7) Use WEB SEARCH to capture up-to-date insights; cite sources with publisher + date
  
     CRITICAL FORMATTING RULES:
     - NO markdown formatting (no #, *, **, or any markdown symbols)
     - NO traditional "Executive Summary" sections
     - NO JSON arrays or structured data formats
     - Use ONLY plain text with detailed tables and bullet points
     - Use hyphens (-) for bullet points, not asterisks
     - Use simple text headers, not markdown headers
     - START WITH TABLES, not summary text
     
     MANDATORY OUTPUT STRUCTURE (START WITH TABLES):
     
     DETAILED TABULAR DATA (MUST INCLUDE ALL - THIS IS THE PRIMARY CONTENT):
        1. Recent Market Analysis Table (25+ companies)
           Company | Market Position | Recent Developments | Funding Status | Revenue Growth | Key Metrics | Market Share | Source/Date
         
        2. Funding & Investment Trends Table (25+ companies)
           Company | Latest Round | Amount (USD) | Date | Lead Investor | Valuation | Previous Rounds | Revenue Multiple | Source/Date
         
        3. Revenue & Growth Metrics Table (25+ companies)
           Company | Annual Revenue | YoY Growth % | ARR/MRR | Profitability | Revenue Model | Key Customers | Market Position | Source/Date
         
        4. Competitive Landscape Table (25+ companies)
           Company | Market Share % | Key Differentiators | Strengths | Weaknesses | Recent Moves | Threat Level | Strategic Position | Source/Date
         
        5. Technology & Innovation Table (20+ companies)
           Company | Technology Focus | Innovation Areas | R&D Investment | Patents/IP | Partnerships | Market Impact | IP Portfolio | Source/Date
         
        6. Regulatory & Compliance Table (20+ items)
           Regulation/Policy | Effective Date | Impact Level | Affected Companies | Compliance Cost | Requirements | Penalties | Implementation | Source/Date
         
        7. Market Opportunities Table (20+ opportunities)
           Opportunity | Market Size (USD) | Growth Rate | Key Players | Entry Barriers | Success Factors | ROI Potential | Timeline | Source/Date
         
        8. Risk Assessment Table (20+ risks)
           Risk Category | Likelihood | Impact | Affected Areas | Mitigation Strategies | Examples | Cost of Mitigation | Timeline | Source/Date
         
        9. Financial Performance & Unit Economics Table (20+ companies)
           Company | CAC | LTV | LTV/CAC Ratio | Gross Margin | Operating Margin | Burn Rate | Runway | Growth Rate | Source/Date
         
        10. International Market Expansion Table (15+ markets)
           Country/Region | Market Size | Growth Rate | Key Players | Entry Barriers | Regulatory Environment | Success Rate | Investment Required | Source/Date
         
        11. Partnership & Strategic Alliances Table (20+ partnerships)
           Company | Partner | Partnership Type | Value | Duration | Success Metrics | Strategic Importance | Future Plans | Source/Date
         
        12. Customer Segmentation & Behavior Table (15+ segments)
           Segment | Size | Growth Rate | Pain Points | Willingness to Pay | Decision Makers | Sales Cycle | Retention Rate | Source/Date
     
     KEY INSIGHTS & ANALYSIS (After Tables - hyphen bullets only)
        - 25-30 actionable recommendations with specific steps and detailed implementation plans
        - Include comprehensive timelines, costs, resource requirements, and expected outcomes
        - Focus on practical implementation for startup founders with step-by-step guidance
        - Provide detailed risk mitigation strategies and contingency plans
        - Include specific metrics and KPIs for measuring success
        - Cover short-term (3-6 months), medium-term (6-18 months), and long-term (18+ months) strategies
     
     SOURCES & REFERENCES
        - List all sources with URLs and publication dates
        - Prioritize sources from last 6 months
        - Include source reliability and credibility notes
     
     STYLE REQUIREMENTS:
     - Use ONLY plain text formatting
     - Include specific numbers, percentages, and dates
     - Provide detailed data in table format
     - Avoid vague statements - be specific and data-driven
     - Focus on actionable insights for startup founders
     - START WITH TABLES, NOT SUMMARY TEXT`
    : `You are an AI Research Agent inside a Startup Founder Assistant.
  Your PRIMARY JOB is to generate COMPREHENSIVE TABULAR DATA for startup founders.
  DO NOT generate traditional "Executive Summary" format - focus on detailed tables with specific data.
     
     CRITICAL FORMATTING RULES:
     - NO markdown formatting (no #, *, **, or any markdown symbols)
     - NO traditional "Executive Summary" sections
     - Use ONLY plain text with detailed tables and bullet points
     - Use hyphens (-) for bullet points, not asterisks
     - Use simple text headers, not markdown headers
     - START WITH TABLES, not summary text
  
  Query Scope
     - Restate the research focus in 1-2 sentences
     - If vague, assume founders want insights into funding, revenues, markets, growth, and operational feasibility
     
     MANDATORY OUTPUT STRUCTURE (START WITH TABLES):
     
     DETAILED TABULAR DATA (MUST INCLUDE ALL - THIS IS THE PRIMARY CONTENT):
     1. Funding Data Table (25+ Companies)
        Company | Total Funding (USD) | Latest Round | Date | Lead Investor | Valuation | Previous Rounds | Revenue Multiple | Source/Date
     
     2. Revenue Data Table (25+ Companies)
        Company | Annual Revenue | YoY Growth % | ARR/MRR | Profitability | Revenue Model | Key Customers | Market Share | Source/Date
     
     3. Market Sizing Table (Comprehensive)
        Market Segment | TAM (USD) | SAM (USD) | SOM (USD) | CAGR | Key Players | Growth Drivers | Regional Breakdown | Source/Year
     
     4. Company Narratives Table (Large - 25+ companies)
        Company | Year Founded | Key Milestones | Founder Background | Pivots/Exits | Key Lessons | Current Status | Future Plans | Source/Date
     
     5. Competitor Benchmarks Table (25+ companies)
        Company | Market Position | Market Share % | CAC | LTV | Differentiation | Strengths | Weaknesses | Recent Moves | Source/Date
     
     6. Trends & Risks Table (25+ items)
        Trend/Risk | Sector Impact | Example Company | Likelihood | Impact | Mitigation | Founder Takeaway | Timeline | Source/Date
     
     7. Technology & Innovation Table (20+ companies)
        Company | Technology Focus | Innovation Areas | R&D Investment | Patents | Partnerships | Market Impact | IP Portfolio | Source/Date
     
     8. Regulatory & Compliance Table (20+ items)
        Regulation | Effective Date | Impact Level | Affected Activities | Compliance Steps | Cost | Requirements | Penalties | Source/Date
     
     9. Market Opportunities Table (20+ opportunities)
        Opportunity | Market Size (USD) | Growth Rate | Entry Barriers | Success Factors | Key Players | Timeline | ROI Potential | Source/Date
     
     10. Implementation Roadmap Table (24-36 months)
        Phase | Objectives | Key Activities | Timeline | Estimated Cost (USD) | KPIs | Risks | Mitigations | Resources Needed | Source/Date
     
     11. Financial Metrics & Unit Economics Table (20+ companies)
        Company | CAC | LTV | LTV/CAC Ratio | Gross Margin | Operating Margin | Burn Rate | Runway | Revenue Growth | Source/Date
     
     12. International Market Analysis Table (15+ markets)
        Country/Region | Market Size | Growth Rate | Key Players | Entry Barriers | Regulatory Environment | Cultural Factors | Success Rate | Source/Date
     
     13. Partnership & Ecosystem Table (20+ partnerships)
        Company | Partner | Partnership Type | Value | Duration | Success Metrics | Strategic Importance | Future Plans | Source/Date
     
     14. Customer Analysis Table (15+ customer segments)
        Segment | Size | Growth Rate | Pain Points | Willingness to Pay | Decision Makers | Sales Cycle | Retention Rate | Source/Date
     
     15. Technology Stack & Infrastructure Table (15+ companies)
        Company | Core Technology | Infrastructure | Scalability | Security | Performance | Cost Structure | Innovation Level | Source/Date
     
     KEY INSIGHTS & ANALYSIS (After Tables - hyphen bullets only)
     - Highlight comprehensive funding trends, top revenue performers, growth patterns, key risks, and actionable insights
     - Include extensive specific numbers, percentages, dates, and financial metrics
     - Focus on detailed practical recommendations for startup founders
     - Provide comprehensive market analysis with regional breakdowns
     - Include detailed competitive intelligence and strategic positioning
     - Cover technology trends, regulatory updates, and market opportunities
     - Provide extensive case studies and success/failure analysis
     
     Business Model Canvas Analysis (Table Format)
        Section | Key Insights | Data/Examples | Recommendations | Source/Year
  
  Style & Delivery
     - Be numeric, comparative, and data-driven
     - Use consistent units and define assumptions
     - Include specific numbers, percentages, and dates in every section
     - Focus on actionable insights for startup founders
     - NO markdown formatting - plain text only
     - START WITH TABLES, NOT SUMMARY TEXT`;

    const answerCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: query
        }
      ],
      temperature: 0.7,
      max_tokens: isAdditionalResearch ? 16000 : 12000, // Increased but reasonable token limits
    });

    const answer = answerCompletion.choices[0]?.message?.content || "No answer generated.";

    // Apply chunk summarization for large responses
    let processedAnswer = answer;
    
    // Check if response contains tabular data that should be preserved
    const hasTabularData = answer.includes('|') && answer.includes('Company') || 
                          answer.includes('Table') || 
                          answer.includes('Funding') && answer.includes('Revenue') ||
                          answer.includes('Market') && answer.includes('Growth') ||
                          answer.includes('TAM') || answer.includes('SAM') || answer.includes('SOM');
    
    if (answer.length > 5000 && !hasTabularData && !preserveTables) { // Only chunk if response is large AND doesn't contain tabular data AND user doesn't want to preserve tables
      console.log("📊 Applying chunk summarization for large response (no tabular data detected and preserveTables=false)...");
      
      try {
        const chunks = splitIntoChunks(answer, 3000);
        console.log(`📝 Split response into ${chunks.length} chunks`);
        
        // Summarize each chunk in parallel
        const chunkSummaryPromises = chunks.map((chunk, index) => 
          summarizeChunk(chunk, index, chunks.length, query)
        );
        
        const chunkSummaries = await Promise.all(chunkSummaryPromises);
        console.log(`✅ Generated ${chunkSummaries.length} chunk summaries`);
        
        // Combine chunk summaries into final comprehensive summary
        processedAnswer = await combineChunkSummaries(chunkSummaries, query);
        console.log("🎯 Combined chunk summaries into final comprehensive summary");
        
      } catch (chunkError) {
        console.error("Chunk summarization failed, using original response:", chunkError);
        // Fallback to original answer if chunking fails
        processedAnswer = answer;
      }
    } else if (answer.length > 5000 && (hasTabularData || preserveTables)) {
      console.log("📊 Large response with tabular data detected or preserveTables=true - preserving full structure without chunking");
      processedAnswer = answer; // Keep original response to preserve tabular data
    } else {
      console.log("📊 Response size acceptable - no chunking needed");
    }

    // For additional research, fetch more web-searched articles and data
    let additionalWebData = [];
    if (isAdditionalResearch && process.env.SERPAPI_API_KEY) {
      try {
        console.log("🔍 Fetching additional web-searched data for enhanced research...");
        
        // Search for recent articles and news related to the query
        const searchQuery = `${originalQuery} startup market trends 2024`;
        const serpApiUrl = new URL("https://serpapi.com/search.json");
        serpApiUrl.searchParams.set("api_key", process.env.SERPAPI_API_KEY);
        serpApiUrl.searchParams.set("q", searchQuery);
        serpApiUrl.searchParams.set("tbm", "nws"); // News search
        serpApiUrl.searchParams.set("num", "10"); // Get 10 recent articles
        serpApiUrl.searchParams.set("tbs", "qdr:m"); // Last month
        
        const serpResponse = await fetch(serpApiUrl.toString());
        if (serpResponse.ok) {
          const serpData = await serpResponse.json();
          if (serpData.news_results) {
            additionalWebData = serpData.news_results.slice(0,5).map((article: any) => ({
              title: article.title || '',
              source: article.source || '',
              date: article.date || '',
              link: article.link || '',
              snippet: article.snippet || '',
              type: 'web-searched',
              relevance: 'additional-research'
            }));
            console.log(`📰 Found ${additionalWebData.length} additional web-searched articles`);
          }
        }
      } catch (webSearchError) {
        console.warn("Web search failed:", webSearchError);
        // Continue without web search data
      }
    }

    // Call existing APIs to get YouTube and article data
    console.log("🔍 Fetching YouTube and article data from existing APIs...");
    
    let youtubeVideos = [];
    let newsArticles = [];

    try {
      const [youtubeResponse, articleResponse] = await Promise.all([
        fetch(`${request.nextUrl.origin}/api/summarize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: query,
            action: 'search'
          })
        }),
        fetch(`${request.nextUrl.origin}/api/article_analysis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: query,
            num: isAdditionalResearch ? 15 : 20
          })
        })
      ]);

      if (youtubeResponse.ok) {
        try {
          const youtubeData = await youtubeResponse.json();
          console.log("YouTube API response:", youtubeData);
          
          // Transform YouTube data to match frontend expectations
          if (youtubeData.videos && Array.isArray(youtubeData.videos)) {
            youtubeVideos = youtubeData.videos.map((video: any) => ({
              id: video.id,
              title: video.title,
              channelTitle: video.channelTitle,
              publishedAt: video.publishedAt,
              viewCount: video.viewCount || 0,
              duration: video.duration || 0,
              thumbnail: video.thumbnail,
              videoUrl: video.videoUrl,
              channelUrl: video.channelUrl,
              summary: `Video about ${query} by ${video.channelTitle} with ${(video.viewCount || 0).toLocaleString()} views`
            }));
          }
        } catch (e) {
          console.warn("Failed to parse YouTube response:", e);
        }
      } else {
        console.warn("YouTube API failed:", youtubeResponse.status, youtubeResponse.statusText);
      }

      if (articleResponse.ok) {
        try {
          const articleData = await articleResponse.json();
          console.log("Article API response:", articleData);
          
          // Transform article data to match frontend expectations
          if (articleData.articles && Array.isArray(articleData.articles)) {
            newsArticles = articleData.articles.map((article: any) => ({
              title: article.title || '',
              source: article.source || '',
              date: article.date || '',
              link: article.link || '',
              snippet: article.snippet || '',
              thumbnail: article.thumbnail || ''
            }));
          }
        } catch (e) {
          console.warn("Failed to parse article response:", e);
        }
      } else {
        console.warn("Article API failed:", articleResponse.status, articleResponse.statusText);
      }

      console.log(`📊 Processed data: ${youtubeVideos.length} videos, ${newsArticles.length} articles`);
    } catch (apiError) {
      console.error("Error calling external APIs:", apiError);
      // Continue with empty arrays - don't fail the entire request
    }

    // Generate article summaries if requested
    let articleSummaries = [];
    if (generateArticleSummaries && newsArticles.length > 0) {
      try {
        console.log(`📝 Generating ${numSummaries} article summaries...`);
        
        // Take the first numSummaries articles for summarization
        const articlesToSummarize = newsArticles.slice(0, numSummaries);
        
        // Generate individual summaries for each article
        const summaryPromises = articlesToSummarize.map(async (article: any, index: number) => {
          const individualSummaryPrompt = `Provide a detailed summary of this article related to: "${query}".

Article Details:
Title: ${article.title}
Source: ${article.source}
Date: ${article.date}
Snippet: ${article.snippet}

Please provide a COMPREHENSIVE and DETAILED summary including:
- Key Points (8-10 detailed bullet points with specific data and examples)
- Main Insights (5-6 detailed insights with supporting evidence)
- Market Implications (3-4 detailed implications for the industry)
- Relevance to the topic (detailed analysis of how this relates to startup founders)
- Actionable Takeaways for startup founders (6-8 specific, actionable recommendations)
- Financial Impact Analysis (if applicable, include specific numbers and metrics)
- Competitive Intelligence (if applicable, include competitor analysis)
- Technology Trends (if applicable, include technical insights)
- Regulatory Considerations (if applicable, include compliance insights)

CRITICAL: Use ONLY plain text formatting. NO markdown symbols (#, *, **). Use hyphens (-) for bullet points only. Format as a structured summary with clear sections. Provide extensive detail with specific data, numbers, and examples.`;

          try {
            const summaryCompletion = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content: "You are an expert research analyst specializing in startup and business intelligence. Your summaries should be detailed, insightful, and actionable for entrepreneurs and business professionals. Use ONLY plain text formatting - NO markdown symbols (#, *, **). Use hyphens (-) for bullet points only."
                },
                {
                  role: "user",
                  content: individualSummaryPrompt
                }
              ],
              temperature: 0.7,
              max_tokens: 1500, // Increased but reasonable token limit
            });

            return {
              ...article,
              summary: summaryCompletion.choices[0]?.message?.content || "No summary generated.",
              summaryIndex: index + 1
            };
          } catch (error) {
            console.error(`Error generating summary for article ${index + 1}:`, error);
            return {
              ...article,
              summary: "Error generating summary.",
              summaryIndex: index + 1
            };
          }
        });

        // Wait for all summaries to complete
        articleSummaries = await Promise.all(summaryPromises);

        console.log(`✅ Generated ${articleSummaries.length} article summaries`);
      } catch (summaryError) {
        console.error("Error generating article summaries:", summaryError);
        // Continue without summaries
      }
    }

    // Generate detailed key insights summary using LLM
    const summaryPrompt = `Create a comprehensive and detailed analysis of the following startup research report. Focus on the key insights, opportunities, market dynamics, and strategic recommendations that a startup founder needs to know. Provide extensive analysis with detailed data and examples. NO MARKDOWN FORMATTING - use plain text only:\n\n${processedAnswer}`;
    const summaryCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `"You are an expert startup research analyst. Your task is to create a highly detailed and actionable KEY INSIGHTS ANALYSIS based on the following research report. 

Guidelines:
- Use plain text only (NO Markdown, NO headers, NO special symbols like * or #).
- Structure the analysis into short, data-driven bullet points using only hyphens (-).
- Avoid vague statements — every point must reference specific data, examples, or trends from the report.
- Highlight insights that a startup founder can ACT on immediately.
- DO NOT use "Executive Summary" as a header - use "Key Insights Analysis" instead.

Focus Areas:
- Market opportunities and emerging trends
- Top-performing companies (funding, revenue, growth rates, valuations)
- Key risks and competitive threats
- Notable investors, funding patterns, and strategic deals
- Regulatory or technological shifts impacting the sector
- Strategic recommendations for founders (funding strategy, market entry, partnerships, cost optimization)

Output Requirements:
- 50-60 comprehensive, data-backed bullet points (doubled for more detail)
- Each bullet point should be 3-4 sentences with extensive specific data and examples
- Include extremely detailed market analysis, competitive landscape, and strategic insights
- Provide comprehensive financial analysis with revenue, funding, and valuation data
- Include detailed technology trends, regulatory updates, and market opportunities
- End with an extensive "Founder Takeaways" section (15-20 bullets) with detailed actionable strategies
- Provide extensive analysis with specific numbers, percentages, dates, and concrete examples
- Include detailed case studies, success stories, and failure analysis
- Cover international market considerations and cross-industry insights
- Provide detailed implementation timelines, costs, and resource requirements"`
        },
        {
          role: "user",
          content: summaryPrompt
        }
      ],
      temperature: 0.5,
      max_tokens: 4000, // Increased but reasonable token limit
    });

    let finalSummary = summaryCompletion.choices[0]?.message?.content || "No summary generated.";

    // Apply chunk summarization to executive summary if it's too large
    const summaryHasTabularData = finalSummary.includes('|') && finalSummary.includes('Company') || 
                                  finalSummary.includes('Table') || 
                                  finalSummary.includes('Funding') && finalSummary.includes('Revenue') ||
                                  finalSummary.includes('Market') && finalSummary.includes('Growth') ||
                                  finalSummary.includes('TAM') || finalSummary.includes('SAM') || finalSummary.includes('SOM');
    
    if (finalSummary.length > 3000 && !summaryHasTabularData && !preserveTables) {
      console.log("📊 Applying chunk summarization to executive summary (no tabular data detected and preserveTables=false)...");
      
      try {
        const summaryChunks = splitIntoChunks(finalSummary, 2000);
        console.log(`📝 Split executive summary into ${summaryChunks.length} chunks`);
        
        // Summarize each chunk of the executive summary
        const summaryChunkPromises = summaryChunks.map((chunk, index) => 
          summarizeChunk(chunk, index, summaryChunks.length, `Executive Summary for: ${query}`)
        );
        
        const summaryChunkSummaries = await Promise.all(summaryChunkPromises);
        console.log(`✅ Generated ${summaryChunkSummaries.length} executive summary chunk summaries`);
        
        // Combine executive summary chunks
        finalSummary = await combineChunkSummaries(summaryChunkSummaries, `Executive Summary for: ${query}`);
        console.log("🎯 Combined executive summary chunks");
        
      } catch (summaryChunkError) {
        console.error("Executive summary chunking failed, using original summary:", summaryChunkError);
        // Fallback to original summary if chunking fails
      }
    } else if (finalSummary.length > 3000 && (summaryHasTabularData || preserveTables)) {
      console.log("📊 Executive summary with tabular data detected or preserveTables=true - preserving full structure without chunking");
      // Keep original summary to preserve tabular data
    } else {
      console.log("📊 Executive summary size acceptable - no chunking needed");
    }

    // Return comprehensive research data to frontend
    return NextResponse.json({
      summary: finalSummary,
      answer: processedAnswer,
      youtubeVideos: youtubeVideos,
      newsArticles: newsArticles,
      additionalWebData: additionalWebData,
      articleSummaries: articleSummaries,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI Research Agent Error:", error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        return NextResponse.json({ 
          error: "Invalid OpenAI API key. Please check your configuration.",
          details: error.message
        }, { status: 401 });
      }
      if (error.message.includes('quota') || error.message.includes('billing')) {
        return NextResponse.json({ 
          error: "OpenAI API quota exceeded or billing issue. Please check your account.",
          details: error.message
        }, { status: 429 });
      }
      if (error.message.includes('rate limit')) {
        const retryAfter = error.message.match(/retry after (\d+)/i)?.[1] || "a moment";
        return NextResponse.json({ 
          error: `Rate limit exceeded. Please try again after ${retryAfter} seconds.`,
          details: error.message
        }, { status: 429 });
      }
      if (error.message.includes('max_tokens') || error.message.includes('token')) {
        return NextResponse.json({ 
          error: "Token limit exceeded. Please try with a shorter query or contact support.",
          details: error.message
        }, { status: 400 });
      }
      if (error.message.includes('timeout') || error.message.includes('network')) {
        return NextResponse.json({ 
          error: "Request timeout. Please try again with a shorter query.",
          details: error.message
        }, { status: 408 });
      }
    }
    
    return NextResponse.json({ 
      error: "AI research service temporarily unavailable. Please try again later.",
      details: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 });
  }
}