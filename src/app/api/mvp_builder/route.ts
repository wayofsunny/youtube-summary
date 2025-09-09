import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { BASE_PROMPT, getSystemPrompt } from './prompts';
import { basePrompt as nodeBasePrompt } from './defaults/node';
import { basePrompt as reactBasePrompt } from './defaults/react';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-testing',
});

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};


export async function GET() {
  // Health check endpoint
  return NextResponse.json({
    status: 'ok',
    hasOpenAIKey: !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy-key-for-testing'),
    timestamp: new Date().toISOString()
  }, {
    headers: corsHeaders
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}

export async function POST(request: NextRequest) {
  try {
    const { type, prompt, messages } = await request.json();
    
    // Validate request body
    if (!type) {
      return NextResponse.json(
        { error: 'Missing required field: type' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key-for-testing') {
      console.log('OpenAI API key not configured, returning mock response');
      
      // Return mock response for development
      if (type === 'template') {
        return NextResponse.json({
          prompts: [
            'Create a basic React application structure',
            'Set up package.json with necessary dependencies'
          ],
          uiPrompts: [
            'Create package.json with React and Vite dependencies',
            'Create index.html with proper structure',
            'Create src/main.jsx as entry point',
            'Create src/App.jsx with basic component',
            'Create src/index.css for styling'
          ]
        }, {
          headers: corsHeaders
        });
      }
      
      if (type === 'chat') {
        return NextResponse.json({
          uiPrompts: [
            'Create additional React components',
            'Add more styling and functionality'
          ]
        }, {
          headers: corsHeaders
        });
      }
      
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.' },
        { status: 500, headers: corsHeaders }
      );
    }
    
    console.log('OpenAI API key found, using real API calls');

    if (type === 'template') {
      // Validate prompt for template request
      if (!prompt || typeof prompt !== 'string') {
        return NextResponse.json(
          { error: 'Missing or invalid prompt for template request' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Determine if project should be React or Node.js using OpenAI
      console.log('Making OpenAI API call to determine project type...');
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
      
      console.log('OpenAI response received:', response.choices[0]?.message?.content);

      const answer = response.choices[0]?.message?.content?.trim().toLowerCase();

      if (answer === 'react') {
      return NextResponse.json({
        prompts: [
          BASE_PROMPT, 
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`
        ],
        uiPrompts: [reactBasePrompt]
      }, {
        headers: corsHeaders
      });
      }

      if (answer === 'node') {
        return NextResponse.json({
          prompts: [
            BASE_PROMPT,
            `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`
          ],
          uiPrompts: [nodeBasePrompt]
        }, {
          headers: corsHeaders
        });
      }

      return NextResponse.json(
        { error: 'Unable to determine project type' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (type === 'chat') {
      // Validate messages for chat request
      if (!messages || !Array.isArray(messages)) {
        return NextResponse.json(
          { error: 'Missing or invalid messages for chat request' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Validate message format
      for (const msg of messages) {
        if (!msg.role || !msg.content || !['user', 'assistant'].includes(msg.role)) {
          return NextResponse.json(
            { error: 'Invalid message format. Each message must have role (user|assistant) and content' },
            { status: 400, headers: corsHeaders }
          );
        }
      }

      // Handle chat messages using OpenAI
      console.log('Processing chat request with', messages.length, 'messages');
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
      
      console.log('Making OpenAI chat completion request...');

      const response = await openai.chat.completions.create({
        messages: openaiMessages,
        model: 'gpt-4o-mini',
        max_tokens: 8000,
        temperature: 0.3
      });

      const aiResponse = response.choices[0]?.message?.content || 'No response generated';
      
      return NextResponse.json({
        response: aiResponse
      }, {
        headers: corsHeaders
      });
    }

    return NextResponse.json(
      { error: 'Invalid request type' },
      { status: 400, headers: corsHeaders }
    );

  } catch (error) {
    console.error('MVP Builder API error:', error);
    
    // Handle specific OpenAI API errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid OpenAI API key' },
          { status: 401, headers: corsHeaders }
        );
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'OpenAI API rate limit exceeded. Please try again later.' },
          { status: 429, headers: corsHeaders }
        );
      }
      if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'OpenAI API quota exceeded. Please check your billing.' },
          { status: 402, headers: corsHeaders }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
