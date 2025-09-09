import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSystemPrompt } from '../prompts';
import { TextBlock } from '@anthropic-ai/sdk/resources';

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
    const { messages } = await request.json();
    
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

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}
