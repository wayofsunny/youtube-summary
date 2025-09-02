import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure your .env file has this variable
});

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "No query provided." }, { status: 400 });
    }

    // Generate research answer using LLM
    const answerCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert AI research agent. Provide a detailed, well-structured answer to the user's query."
        },
        {
          role: "user",
          content: query
        }
      ],
      temperature: 0.7,
      max_tokens: 1200,
    });

    const answer = answerCompletion.choices[0]?.message?.content || "No answer generated.";

    // Generate summary using LLM
    const summaryPrompt = `Summarize the following answer in 2-3 sentences:\n\n${answer}`;
    const summaryCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert summarizer. Provide a concise summary."
        },
        {
          role: "user",
          content: summaryPrompt
        }
      ],
      temperature: 0.5,
      max_tokens: 300,
    });

    const summary = summaryCompletion.choices[0]?.message?.content || "No summary generated.";

    // Return both summary and answer to frontend
    return NextResponse.json({
      summary,
      answer,
    });
  } catch (error) {
    console.error("AI Research Agent Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}