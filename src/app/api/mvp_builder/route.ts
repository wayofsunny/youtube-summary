import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure it's in .env.local
});

export async function POST(req: Request) {
  try {
    console.log("✅ /api/mvp_builder called");

    const { prompt } = await req.json();
    console.log("📥 Prompt received:", prompt);

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // 🔥 Call OpenAI to generate HTML/CSS for a simple MVP website
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // or gpt-4o / gpt-3.5-turbo depending on your plan
      messages: [
        { role: "system", content: "You are an expert website builder AI. Generate clean,beautiful , expert next.js great project only. Do NOT include explanations." },
        { role: "user", content: `Build a simple MVP landing page for: ${prompt}` },
      ],
      temperature: 0.7,
    });
  
    const result = completion.choices[0].message?.content || "";
    console.log("📤 Response length:", result.length);

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("❌ API error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
