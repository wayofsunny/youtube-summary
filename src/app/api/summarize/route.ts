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
      console.warn("⚠️ OPENAI_API_KEY is not set. Returning basic info summary.");
      return `Title: ${videoTitle}\nChannel: ${channelTitle}\nViews: ${viewCount.toLocaleString()}\n\nNo API key configured. Cannot generate AI summary.`;
    }

    const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
      return await Promise.race<T>([
        promise,
        new Promise<T>((_resolve, reject) => setTimeout(() => reject(new Error(`OpenAI timeout after ${ms}ms`)), ms)) as Promise<T>
      ]);
    };

    if (!sourceText || sourceText.trim().length < 50) {
      return `Title: ${videoTitle}\nChannel: ${channelTitle}\nViews: ${viewCount.toLocaleString()}\n\nNo transcript or sufficient description available to summarize.`;
    }

    const completion = await withTimeout(client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert YouTube video summarizer. Create a comprehensive, engaging summary of the video content that includes:
          
         - Weave together the key points, important details, and memorable quotes into a smooth narrative.  
- Provide enough depth so the reader understands the main arguments, insights, and examples without needing to watch the video.  
- Keep the summary engaging, professional, and easy to follow, written in clear paragraphs.  
- At the end, include the video’s duration and view count as contextual information.  

The result should be a comprehensive, paragraph-based summary that reads like a human-written recap of the video.  `
        },
        {
          role: "user",
          content: `Generate a comprehensive summary for this YouTube video:\n\nTitle: ${videoTitle}\nChannel: ${channelTitle}\nViews: ${viewCount.toLocaleString()}\n\nContent:\n${sourceText}`
        }
      ],
      temperature: 0.6,
      max_tokens: 900,
    }), 20000);

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

      // ✅ 1. Fetch Top 10 YouTube Videos
    const searchRes = await youtube.search.list({
      key: process.env.YOUTUBE_API_KEY,
      part: ["snippet"],
      q: query,
        maxResults: 10,
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
        .slice(0, 8); // Top 8 non-Shorts

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