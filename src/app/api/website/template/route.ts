import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { BASE_PROMPT } from '../prompts';
import { TextBlock } from '@anthropic-ai/sdk/resources';
import { basePrompt as nodeBasePrompt } from '../defaults/node';
import { basePrompt as reactBasePrompt } from '../defaults/react';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    // Check if API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set - using fallback response');
      // Return a default React template when API key is not available
      return NextResponse.json({
        prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
        uiPrompts: [reactBasePrompt]
      }, { headers: corsHeaders });
    }

    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400, headers: corsHeaders });
    }
    
    console.log('Template API: Processing prompt:', prompt);
    
    const response = await anthropic.messages.create({
      messages: [{
        role: 'user', 
        content: prompt
      }],
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 200,
      system: "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra"
    });

    const answer = (response.content[0] as TextBlock).text; // react or node
    
    if (answer === "react") {
      return NextResponse.json({
        prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
        uiPrompts: [reactBasePrompt]
      }, { headers: corsHeaders });
    }

    if (answer === "node") {
      return NextResponse.json({
        prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
        uiPrompts: [nodeBasePrompt]
      }, { headers: corsHeaders });
    }

    return NextResponse.json({ message: "You cant access this" }, { status: 403, headers: corsHeaders });

  } catch (error) {
    console.error('Template API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}
