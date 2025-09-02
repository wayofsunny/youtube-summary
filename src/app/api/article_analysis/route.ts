import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, content, contents, num = 10, pageToken } = body;

    // Handle article search
    if (query && typeof query === "string") {
      const apiKey = process.env.SERPAPI_API_KEY;
      if (!apiKey) {
        console.error("Missing SERPAPI_API_KEY in environment.");
        return Response.json(
          { error: "Missing SERPAPI_API_KEY in environment." },
          { status: 500 }
        );
      }

      // SerpAPI: Google search with tbm=nws (News vertical)
      const url = new URL("https://serpapi.com/search.json");
      url.searchParams.set("engine", "google");
      url.searchParams.set("tbm", "nws");
      url.searchParams.set("q", query);
      url.searchParams.set("api_key", apiKey);
      url.searchParams.set("hl", "en");
      url.searchParams.set("gl", "us");
      url.searchParams.set("num", String(num));
      // Pagination: use start offset as pageToken (stringified number)
      if (pageToken) {
        url.searchParams.set("start", String(pageToken));
      }

      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text();
        console.error(`SerpAPI error ${res.status}: ${text}`);
        return Response.json(
          { error: `SerpAPI error ${res.status}: ${text}` },
          { status: 502 }
        );
      }

      const data = await res.json();
      const results = Array.isArray(data?.news_results) ? data.news_results : [];

      // Normalize & limit (SerpAPI already respects num, but keep mapping tidy)
      const articles = results.map((item: any) => ({
        title: item.title ?? null,
        link: item.link ?? null,
        source: item.source ?? null,
        date: item.date ?? null,
        snippet: item.snippet ?? null,
        thumbnail: item.thumbnail ?? null,
      }));

      // Determine pagination from serpapi_pagination if present
      const pagination = data?.serpapi_pagination || {};
      let hasMoreResults = false;
      let nextPageToken: string | null = null;
      if (pagination.next) {
        hasMoreResults = true;
        // If SerpAPI gives a next link, try to extract the 'start' param
        try {
          const nextUrl = new URL(pagination.next as string);
          const nextStart = nextUrl.searchParams.get("start");
          if (nextStart) nextPageToken = nextStart;
        } catch {
          // Fallback: increment current start by num
          const currentStart = Number(pageToken || 0);
          nextPageToken = String(currentStart + Number(num));
        }
      }

      return Response.json({ query, count: articles.length, articles, hasMoreResults, nextPageToken });
    }

    // Handle individual article summary
    if (content && typeof content === "string") {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.error("Missing OPENAI_API_KEY in environment.");
        return Response.json(
          { error: "Missing OPENAI_API_KEY in environment." },
          { status: 500 }
        );
      }

      console.log("Sending request to OpenAI for individual summary with content:", content);
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an expert assistant that provides detailed and insightful summaries of text, capturing key points, context, and significant details in a clear and concise manner.",
            },
            {
              role: "user",
              content: `Provide a detailed summary of the following text in 4-5 sentences, highlighting key points, context, and any significant insights: ${content}`,
            },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(`OpenAI API error ${res.status}: ${text}`);
        return Response.json(
          { error: `OpenAI API error ${res.status}: ${text}` },
          { status: 502 }
        );
      }

      const data = await res.json();
      const summary = data.choices?.[0]?.message?.content?.trim() || "No summary generated.";
      console.log("OpenAI individual summary response:", summary);

      return Response.json({ summary });
    }

    // Handle global summary
    if (contents && Array.isArray(contents) && contents.every(item => typeof item === "string")) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.error("Missing OPENAI_API_KEY in environment.");
        return Response.json(
          { error: "Missing OPENAI_API_KEY in environment." },
          { status: 500 }
        );
      }

      const combinedContent = contents.join("\n\n---\n\n");
      console.log("Sending request to OpenAI for global summary with contents:", combinedContent);
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          modal: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an expert assistant that synthesizes multiple texts into a cohesive and insightful summary, identifying common themes, key points, and significant insights across all provided content.",
            },
            {
              role: "user",
              content: `Provide a detailed global summary of the following articles in 4-5 sentences, synthesizing key themes, insights, and context across all texts (each article is separated by ---): ${combinedContent}`,
            },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(`OpenAI API error ${res.status}: ${text}`);
        return Response.json(
          { error: `OpenAI API error ${res.status}: ${text}` },
          { status: 502 }
        );
      }

      const data = await res.json();
      const summary = data.choices?.[0]?.message?.content?.trim() || "No global summary generated.";
      console.log("OpenAI global summary response:", summary);

      return Response.json({ summary });
    }

    // If neither query, content, nor contents is provided
    return Response.json(
      { error: "Body must include either a 'query', 'content', or 'contents' field." },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Server error:", err.message);
    return Response.json(
      { error: err?.message ?? "Unexpected server error" },
      { status: 500 }
    );
  }
}