import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { BASE_PROMPT, getSystemPrompt } from './prompts';
import { basePrompt as nodeBasePrompt } from './defaults/node';
import { basePrompt as reactBasePrompt } from './defaults/react';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function extractReactCode(response: string): string {
  // Try to extract code from markdown code blocks
  const codeBlockMatch = response.match(/```(?:jsx?|tsx?|javascript|typescript)?\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  
  // If no code block found, return the response as is
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const { type, prompt, messages } = await request.json();

    if (type === 'template') {
      // Determine if project should be React or Node.js
      const response = await openai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra"
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'gpt-4o-mini',
        max_tokens: 200,
        temperature: 0.3
      });

      const answer = response.choices[0]?.message?.content?.trim().toLowerCase();

      if (answer === 'react') {
        return NextResponse.json({
          prompts: [
            BASE_PROMPT,
            `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`
          ],
          uiPrompts: [reactBasePrompt]
        });
      }

      if (answer === 'node') {
        return NextResponse.json({
          prompts: [
            `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`
          ],
          uiPrompts: [nodeBasePrompt]
        });
      }

      return NextResponse.json(
        { error: 'Unable to determine project type' },
        { status: 400 }
      );
    }

    if (type === 'chat') {
      // Handle chat messages
      const systemPrompt = getSystemPrompt();
      const openaiMessages = [
        {
          role: 'system' as const,
          content: systemPrompt
        },
        ...messages.map((msg: any) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      ];

      const response = await openai.chat.completions.create({
        messages: openaiMessages,
        model: 'gpt-4o-mini',
        max_tokens: 8000,
        temperature: 0.3
      });

      const aiResponse = response.choices[0]?.message?.content || 'No response generated';
      
      // Extract React component code from the response
      const reactCode = extractReactCode(aiResponse);
      
      return NextResponse.json({
        response: reactCode
      });
    }

    return NextResponse.json(
      { error: 'Invalid request type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('MVP Builder API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
