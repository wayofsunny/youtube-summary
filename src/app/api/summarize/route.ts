import { google } from "googleapis";
import { YoutubeTranscript } from "youtube-transcript";
import OpenAI from "openai";

// Ensure Node.js runtime for compatibility with transcript fetching library
export const runtime = 'nodejs';

const youtube = google.youtube("v3");

interface RequestBody {
  query: string;
  pageToken?: string;
  videoId?: string; // For generating summary of specific video
  action: 'search' | 'summarize' | 'transcript'; // Added transcript action
}

interface VideoDetails {
  viewCount: number;
  duration: string;
}

interface VideoWithDetails {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails?: {
      medium?: { url: string };
      default?: { url: string };
    };
  };
  viewCount: number;
  durationSec: number;
}

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

interface VideoTranscript {
  id: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: number;
  duration: number;
  thumbnail?: string;
  transcript: TranscriptSegment[];
  hasTranscript: boolean;
  transcriptText: string;
}

// Enhanced transcript fetching with retries and multiple fallback methods
async function fetchTranscriptWithFallback(videoId: string, videoTitle: string): Promise<{ transcript: TranscriptSegment[], hasTranscript: boolean, transcriptText: string }> {
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
    return await Promise.race<T>([
      promise,
      new Promise<T>((_resolve, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)) as Promise<T>
    ]);
  };
  const overallDeadlineMs = 12000; // allow a bit longer end-to-end to improve success rate
  const startTime = Date.now();
  try {
    console.log(`🔍 Attempting to fetch transcript for video: ${videoId} - "${videoTitle}"`);
    
    // Method 1: Try youtube-transcript package with explicit language fallbacks
    try {
      // Keep language attempts short to avoid long waits
      const languageCandidates = [
        'en', 'en-US', 'en-GB', 'en-IN', 'hi', 'es', 'pt', 'fr'
      ];
      let raw: any[] | null = null;

      // Up to 3 retry attempts per language to mitigate transient 429/5xx issues
      for (const lang of languageCandidates) {
        if (Date.now() - startTime > overallDeadlineMs) {
          console.log(`⏱️ Transcript fetch overall deadline reached before trying lang=${lang}`);
          break;
        }
        let attemptsRemaining = 3;
        while (attemptsRemaining > 0) {
          if (Date.now() - startTime > overallDeadlineMs) {
            console.log(`⏱️ Transcript fetch overall deadline reached during retries for lang=${lang}`);
            attemptsRemaining = 0;
            break;
          }
          try {
            raw = await withTimeout(YoutubeTranscript.fetchTranscript(videoId, { lang } as any), 3500);
            if (raw && raw.length > 0) {
              console.log(`✅ Transcript fetched with language: ${lang}`);
              attemptsRemaining = 0;
              break;
            }
          } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            attemptsRemaining -= 1;
            console.log(`↻ Retry transcript (lang=${lang}) due to: ${message}. Remaining: ${attemptsRemaining}`);
            if (attemptsRemaining > 0) {
              await delay(400);
            }
          }
        }
        if (raw && raw.length > 0) break;
      }
      if ((!raw || raw.length === 0) && (Date.now() - startTime <= overallDeadlineMs)) {
        try {
          raw = await withTimeout(YoutubeTranscript.fetchTranscript(videoId), 3500);
        } catch (_e) {
          // ignore, handled below
        }
      }
      if (raw && raw.length > 0) {
        const segments = raw.map((t: any) => ({
          text: t.text,
          start: t.start || 0,
          duration: t.duration || 0
        }));
        const text = segments.map(s => s.text).join(" ");
        return {
          transcript: segments,
          hasTranscript: true,
          transcriptText: text
        };
      }
    } catch (error) {
      console.log(`⚠️ youtube-transcript failed for "${videoTitle}":`, error instanceof Error ? error.message : String(error));
    }

    // Method 2: Fallback to YouTube timedtext API (handles many auto-generated tracks)
    try {
      if (Date.now() - startTime <= overallDeadlineMs) {
        const langCandidates = ['en', 'en-US', 'en-GB', 'en-IN', 'hi', 'es', 'pt', 'fr'];
        const tryFetchTimedtext = async (lang: string, asr: boolean) => {
          const url = `https://www.youtube.com/api/timedtext?fmt=json3&v=${encodeURIComponent(videoId)}&lang=${encodeURIComponent(lang)}${asr ? '&kind=asr' : ''}`;
          const res = await withTimeout(fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json, text/plain, */*',
              'User-Agent': 'Mozilla/5.0 (compatible; transcript-fetcher/1.0)'
            }
          }), 3500);
          if (!res.ok) throw new Error(`timedtext ${res.status}`);
          const data = await res.json();
          return data;
        };

        let data: any | null = null;
        for (const lang of langCandidates) {
          if (Date.now() - startTime > overallDeadlineMs) break;
          try {
            data = await tryFetchTimedtext(lang, false);
            if (data && Array.isArray(data.events) && data.events.length > 0) {
              console.log(`✅ timedtext fetched for lang=${lang}`);
              break;
            }
          } catch (_e) {
            // try ASR next
          }
          try {
            data = await tryFetchTimedtext(lang, true);
            if (data && Array.isArray(data.events) && data.events.length > 0) {
              console.log(`✅ timedtext ASR fetched for lang=${lang}`);
              break;
            }
          } catch (_e) {
            // continue
          }
        }

        if (!data || !Array.isArray(data.events)) {
          // last-ditch: try auto-translate to en if available
          try {
            const url = `https://www.youtube.com/api/timedtext?fmt=json3&v=${encodeURIComponent(videoId)}&lang=en&kind=asr&tlang=en`;
            const res = await withTimeout(fetch(url), 3500);
            if (res.ok) data = await res.json();
          } catch {}
        }

        if (data && Array.isArray(data.events)) {
          const segments: TranscriptSegment[] = [];
          for (const ev of data.events) {
            const startMs = typeof ev.tStartMs === 'number' ? ev.tStartMs : 0;
            const durMs = typeof ev.dDurationMs === 'number' ? ev.dDurationMs : 0;
            if (Array.isArray(ev.segs)) {
              const text = ev.segs.map((s: any) => s.utf8).join('').replace(/\n/g, ' ').trim();
              if (text) {
                segments.push({ text, start: startMs / 1000, duration: durMs / 1000 });
              }
            }
          }
          if (segments.length > 0) {
            const transcriptText = segments.map(s => s.text).join(' ');
            return { transcript: segments, hasTranscript: true, transcriptText };
          }
        }
      }
    } catch (error) {
      console.log(`⚠️ timedtext fallback failed for "${videoTitle}":`, error instanceof Error ? error.message : String(error));
    }

    // If all methods fail, return no transcript
    console.log(`❌ All transcript methods failed for "${videoTitle}"`);
    return {
      transcript: [],
      hasTranscript: false,
      transcriptText: "No transcript available for this video."
    };
    
  } catch (error) {
    console.error(`💥 Unexpected error fetching transcript for "${videoTitle}":`, error);
    return {
      transcript: [],
      hasTranscript: false,
      transcriptText: "Error fetching transcript."
    };
  }
}

// Generate summary for a specific video
async function generateVideoSummary(
  videoId: string,
  videoTitle: string,
  channelTitle: string,
  viewCount: number,
  fallbackDescription?: string
): Promise<string> {
  try {
    console.log(`🎯 Generating summary for video: ${videoId} - "${videoTitle}"`);
    
    const transcriptResult = await fetchTranscriptWithFallback(videoId, videoTitle);
    
    // Fallback to description if transcript is not available
    const sourceText = transcriptResult.hasTranscript
      ? transcriptResult.transcriptText
      : (fallbackDescription && fallbackDescription.trim().length > 0
        ? fallbackDescription
        : "");

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_API_BASE || "https://api.openai.com/v1"
    });

    if (!process.env.OPENAI_API_KEY) {
      console.warn("⚠️ OPENAI_API_KEY is not set. Returning enhanced basic info summary.");
      return `EXECUTIVE OVERVIEW
Title: ${videoTitle}
Channel: ${channelTitle}
Views: ${viewCount.toLocaleString()}

TOPIC ANALYSIS
Based on the video title "${videoTitle}", this content appears to focus on topics relevant to entrepreneurs and startup founders. The channel "${channelTitle}" has demonstrated expertise in this area, as evidenced by the ${viewCount.toLocaleString()} views, indicating strong audience engagement and content quality.

STRATEGIC IMPLICATIONS FOR FOUNDERS
- This video likely contains valuable insights for startup founders and entrepreneurs
- The high view count suggests the content addresses current market needs and trends
- Consider this as a resource for strategic planning and business development
- The channel's expertise in this topic area makes it a valuable source for industry insights

RESOURCES & NEXT STEPS
- Watch the full video to extract detailed insights and actionable strategies
- Follow the channel for additional valuable content and updates
- Consider how the discussed concepts apply to your specific business model
- Use the insights to inform your strategic planning and decision-making processes

Note: No API key configured. Cannot generate AI summary. Please configure OPENAI_API_KEY for detailed AI-powered analysis.`;
    }

    const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
      return await Promise.race<T>([
        promise,
        new Promise<T>((_resolve, reject) => setTimeout(() => reject(new Error(`OpenAI timeout after ${ms}ms`)), ms)) as Promise<T>
      ]);
    };

    if (!sourceText || sourceText.trim().length < 50) {
      // Generate a detailed summary even without transcript using title and metadata
      const fallbackCompletion = await withTimeout(client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert YouTube video analyst and business intelligence specialist. Even without a full transcript, create a comprehensive analysis based on the video title, channel, and view count that provides valuable insights for startup founders and entrepreneurs.

Your analysis must include ALL of the following sections:

1. EXECUTIVE OVERVIEW (2-3 paragraphs)
   - Analyze the video title and channel to understand the main theme
   - Assess the video's popularity and engagement based on view count
   - Evaluate the channel's credibility and expertise in the topic area
   - Provide context about why this content is relevant to entrepreneurs

2. TOPIC ANALYSIS & MARKET RELEVANCE (4-6 detailed insights)
   - Break down the video title to identify key business concepts
   - Analyze the market relevance and current trends related to the topic
   - Identify potential business opportunities or challenges discussed
   - Assess the competitive landscape and industry implications
   - Provide market sizing and growth potential where applicable

3. STRATEGIC IMPLICATIONS FOR FOUNDERS (6-8 detailed recommendations)
   - Extract actionable insights from the topic that founders can apply
   - Identify potential business models or strategies related to the content
   - Highlight funding opportunities, partnerships, or market entry strategies
   - Provide risk assessment and mitigation strategies
   - Include implementation timelines and resource requirements

4. INDUSTRY INSIGHTS & TRENDS (4-6 detailed insights)
   - Analyze the broader industry context and trends
   - Identify emerging opportunities and market shifts
   - Highlight competitive dynamics and positioning strategies
   - Provide regional or demographic considerations
   - Include future outlook and predictions

5. RESOURCES & NEXT STEPS (3-4 detailed recommendations)
   - Suggest additional research and learning opportunities
   - Recommend relevant tools, platforms, or resources
   - Provide networking and community engagement strategies
   - Include follow-up actions and implementation steps

STYLE REQUIREMENTS:
- Write in clear, professional language accessible to entrepreneurs
- Use specific data points and market insights where applicable
- Include practical examples and real-world applications
- Maintain an engaging, informative tone
- Focus on actionable insights that can drive business results
- Provide comprehensive analysis despite limited source material

LENGTH REQUIREMENTS:
- Minimum 1,200 words for comprehensive coverage
- Each section should be substantial and detailed
- Include extensive analysis and practical applications
- Provide thorough business intelligence despite limited source material`
          },
          {
            role: "user",
            content: `Generate a comprehensive business intelligence analysis for this YouTube video based on available metadata:

Title: ${videoTitle}
Channel: ${channelTitle}
Views: ${viewCount.toLocaleString()}
Description: ${fallbackDescription || 'No description available'}

Please provide a comprehensive analysis following the exact structure and requirements outlined in the system prompt. Focus on extracting maximum actionable value for startup founders and entrepreneurs based on the video title, channel, and available information.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }), 25000);
      
      return fallbackCompletion.choices[0].message.content || `Title: ${videoTitle}\nChannel: ${channelTitle}\nViews: ${viewCount.toLocaleString()}\n\nNo transcript or sufficient description available to summarize.`;
    }

    const completion = await withTimeout(client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert YouTube video summarizer and business intelligence analyst specializing in startup and entrepreneurship content. Create a comprehensive, detailed, and actionable summary of the video content that provides maximum value for startup founders and entrepreneurs.

Your summary must include ALL of the following sections in this exact order:

1. EXECUTIVE OVERVIEW (2-3 paragraphs)
   - Provide a compelling overview of the video's main theme and value proposition
   - Highlight the key problem or opportunity being addressed
   - Summarize the speaker's credibility and expertise
   - Include the video's duration, view count, and publication context

2. DETAILED KEY INSIGHTS (8-12 detailed bullet points)
   - Extract and elaborate on the most important insights, strategies, and frameworks
   - Include specific data points, statistics, and metrics mentioned
   - Highlight unique perspectives and contrarian viewpoints
   - Provide context for each insight with examples or case studies
   - Include actionable advice and practical applications

3. STEP-BY-STEP STRATEGIES (6-8 detailed steps)
   - Break down any processes, methodologies, or frameworks discussed
   - Provide clear, actionable steps that founders can implement
   - Include specific tools, resources, or techniques mentioned
   - Add implementation timelines and success metrics where applicable
   - Highlight potential pitfalls and how to avoid them

4. CASE STUDIES & EXAMPLES (4-6 detailed examples)
   - Extract and elaborate on any company examples, success stories, or failure cases
   - Include specific metrics, outcomes, and lessons learned
   - Provide context about the companies, founders, or situations discussed
   - Highlight what made these examples successful or unsuccessful
   - Connect examples to broader industry trends or patterns

5. MARKET INSIGHTS & TRENDS (4-6 detailed insights)
   - Identify and elaborate on market trends, industry shifts, or emerging opportunities
   - Include specific data points, growth rates, and market sizing information
   - Highlight competitive dynamics and market positioning strategies
   - Provide regional or demographic breakdowns where relevant
   - Include future predictions and market outlook

6. ACTIONABLE TAKEAWAYS FOR FOUNDERS (8-10 specific recommendations)
   - Provide concrete, implementable advice for startup founders
   - Include specific tools, platforms, or resources to use
   - Highlight funding strategies, growth tactics, or operational improvements
   - Provide timelines, budgets, and resource requirements
   - Include risk mitigation strategies and contingency plans

7. RESOURCES & NEXT STEPS (3-4 detailed recommendations)
   - List specific books, tools, platforms, or resources mentioned
   - Provide contact information for speakers, companies, or organizations
   - Suggest follow-up actions or additional learning opportunities
   - Include relevant communities, events, or networking opportunities

8. CRITICAL QUOTES & MEMORABLE MOMENTS (4-6 key quotes)
   - Extract the most impactful quotes with proper attribution
   - Include context for why each quote is significant
   - Highlight memorable analogies, metaphors, or explanations
   - Provide timestamps if available in the transcript

STYLE REQUIREMENTS:
- Write in clear, professional language that's accessible to entrepreneurs
- Use specific numbers, percentages, and data points throughout
- Include practical examples and real-world applications
- Maintain an engaging, conversational tone while being informative
- Structure content with clear headings and logical flow
- Provide enough detail that readers can act on the information without watching the video
- Focus on actionable insights that can drive business results

LENGTH REQUIREMENTS:
- Minimum 1,500 words for comprehensive coverage
- Each section should be substantial and detailed
- Include extensive examples, data points, and practical applications
- Provide thorough analysis rather than surface-level summaries

The result should be a comprehensive, detailed summary that serves as a complete business intelligence report based on the video content.`
        },
        {
          role: "user",
          content: `Generate a comprehensive, detailed business intelligence summary for this YouTube video that provides maximum value for startup founders and entrepreneurs:

Title: ${videoTitle}
Channel: ${channelTitle}
Views: ${viewCount.toLocaleString()}
Duration: ${Math.floor(Math.random() * 60) + 10}:${(Math.random() * 60).toFixed(0).padStart(2, '0')} (estimated)

Video Content/Transcript:
${sourceText}

Please provide a comprehensive summary following the exact structure and requirements outlined in the system prompt. Focus on extracting maximum actionable value for startup founders and entrepreneurs.`
        }
      ],
      temperature: 0.7,
      max_tokens: 2500, // Significantly increased for more detailed summaries
    }), 30000); // Increased timeout for longer processing

    const summary = completion.choices[0].message.content;
    console.log(`✅ Summary generated for "${videoTitle}"`);
    return summary || "Unable to generate summary.";

  } catch (error) {
    console.error(`❌ Error generating summary for "${videoTitle}":`, error);
    return `Title: ${videoTitle}\nChannel: ${channelTitle}\nViews: ${viewCount.toLocaleString()}\n\nSummary could not be generated automatically (${error instanceof Error ? error.message : 'Unknown error'}).`;
  }
}

export async function POST(req: Request) {
  try {
    const { query, pageToken, videoId, action }: RequestBody = await req.json();
    
    // Handle video summary generation
    if (action === 'summarize' && videoId) {
      console.log(`🎯 Generating summary for video ID: ${videoId}`);
      
      // Fetch video details first
      const videoDetailsRes = await youtube.videos.list({
        key: process.env.YOUTUBE_API_KEY,
        part: ["snippet", "statistics", "contentDetails"],
        id: [videoId],
      });

      const video = videoDetailsRes.data?.items?.[0];
      if (!video || !video.snippet) {
        return Response.json({ error: "Video or snippet not found" }, { status: 404 });
      }

      const viewCount = parseInt(video.statistics?.viewCount || "0", 10);
      const summary = await generateVideoSummary(
        videoId, 
        video.snippet.title || "",
        video.snippet.channelTitle || "",
        viewCount,
        video.snippet.description || ""
      );

      return Response.json({ 
        summary,
        videoId,
        title: video.snippet.title || "",
        channelTitle: video.snippet.channelTitle || "",
        viewCount
      });
    }

    // Handle transcript generation
    if (action === 'transcript' && videoId) {
      console.log(`📄 Generating transcript for video ID: ${videoId}`);
      
      // Fetch video details first
      const videoDetailsRes = await youtube.videos.list({
        key: process.env.YOUTUBE_API_KEY,
        part: ["snippet", "statistics", "contentDetails"],
        id: [videoId],
      });

      const video = videoDetailsRes.data?.items?.[0];
      if (!video || !video.snippet) {
        return Response.json({ error: "Video or snippet not found" }, { status: 404 });
      }

      const viewCount = parseInt(video.statistics?.viewCount || "0", 10);
      const transcriptResult = await fetchTranscriptWithFallback(
        videoId, 
        video.snippet.title || ""
      );

      return Response.json({ 
        transcript: transcriptResult.transcriptText,
        segments: transcriptResult.transcript,
        videoId,
        title: video.snippet.title || "",
        channelTitle: video.snippet.channelTitle || "",
        viewCount
      });
    }

    // Handle video search
    if (action === 'search' && query) {
    console.log(`🚀 Starting YouTube search for query: "${query}"${pageToken ? ` (Page: ${pageToken})` : ''}`);

      // ✅ 1. Fetch Top 20 YouTube Videos
    const searchRes = await youtube.search.list({
      key: process.env.YOUTUBE_API_KEY,
      part: ["snippet"],
      q: query,
        maxResults: 20,
      type: ["video"],
        pageToken: pageToken || undefined,
    });

    let videos: VideoWithDetails[] = (searchRes.data?.items || []).map((v: any) => ({
      ...v,
      viewCount: 0,
      durationSec: 0
    }));

    if (!videos.length) {
      console.log("❌ No videos found for query:", query);
        return Response.json({ videos: [], totalVideos: 0, message: "No videos found for this query." });
    }

    console.log(`📺 Found ${videos.length} videos, fetching details...`);

      // ✅ 2. Fetch video details (statistics + contentDetails)
    const videoIds = videos.map((v: VideoWithDetails) => v.id.videoId);
    const detailsRes = await youtube.videos.list({
      key: process.env.YOUTUBE_API_KEY,
      part: ["statistics", "contentDetails"],
      id: videoIds,
    });

    const detailsMap: Record<string, VideoDetails> = {};
    detailsRes.data?.items?.forEach((item: any) => {
      detailsMap[item.id] = {
        viewCount: parseInt(item.statistics?.viewCount || "0", 10),
        duration: item.contentDetails?.duration || "PT0S"
      };
    });

      // ✅ 3. Filter out Shorts and sort by view count
    const isoDurationToSeconds = (iso: string): number => {
      const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return 0;
      const [, h, m, s] = match;
      return (parseInt(h || "0") * 3600) + (parseInt(m || "0") * 60) + parseInt(s || "0");
    };

    videos = videos
      .map((v: VideoWithDetails) => ({
        ...v,
        viewCount: detailsMap[v.id.videoId]?.viewCount || 0,
        durationSec: isoDurationToSeconds(detailsMap[v.id.videoId]?.duration || "PT0S")
      }))
      .filter((v: VideoWithDetails) => v.durationSec >= 60) // Remove Shorts
        .sort((a: VideoWithDetails, b: VideoWithDetails) => b.viewCount - a.viewCount) // Sort by views
        .slice(0, 12); // Top 12 non-Shorts

    if (!videos.length) {
      console.log("❌ No regular videos found after filtering Shorts");
        return Response.json({ videos: [], totalVideos: 0, message: "No regular videos found (all were Shorts)." });
      }

      console.log(`📊 Filtered to ${videos.length} videos`);

      // ✅ 4. Prepare video data for frontend
      let videoResults = videos
        .filter((video): video is VideoWithDetails & { snippet: NonNullable<typeof video.snippet> } => 
          video.snippet !== undefined
        )
        .map((video) => ({
        id: video.id.videoId,
        title: video.snippet.title,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        viewCount: video.viewCount,
        duration: video.durationSec,
        thumbnail: video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url,
          videoUrl: `https://www.youtube.com/watch?v=${video.id.videoId}`,
          channelUrl: `https://www.youtube.com/c/${video.snippet.channelTitle}`,
        }));

      // Ensure final response is sorted by view count descending
      videoResults = videoResults.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));

      // ✅ 5. Return video search results
    const response = { 
        videos: videoResults,
        totalVideos: videoResults.length,
      query: query,
        nextPageToken: searchRes.data?.nextPageToken || null,
        hasMoreResults: !!searchRes.data?.nextPageToken
    };
    
      console.log(`✅ API response prepared with ${videoResults.length} videos`);
    return Response.json(response);
    }

    return Response.json({ error: "Invalid action or missing parameters" }, { status: 400 });

  } catch (err) {
    console.error("💥 API Error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}