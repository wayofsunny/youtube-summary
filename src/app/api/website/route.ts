import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { BASE_PROMPT, getSystemPrompt } from './prompts';
import { ContentBlock, TextBlock } from '@anthropic-ai/sdk/resources';
import { basePrompt as nodeBasePrompt } from './defaults/node';
import { basePrompt as reactBasePrompt } from './defaults/react';

const anthropic = new Anthropic();

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
    const { endpoint, ...body } = await request.json();
    
    if (endpoint === 'template') {
      const { prompt } = body;
      
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
    }

    if (endpoint === 'chat') {
      const { messages } = body;
      
      const response = await anthropic.messages.create({
        messages: messages,
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8000,
        system: getSystemPrompt()
      });

      console.log(response);

      return NextResponse.json({
        response: (response.content[0] as TextBlock)?.text
      }, { headers: corsHeaders });
    }

    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400, headers: corsHeaders });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}
