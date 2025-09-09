import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSystemPrompt } from '../prompts';
import { TextBlock } from '@anthropic-ai/sdk/resources';

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
      // Return a default response when API key is not available
      return NextResponse.json({
        response: `<step type="create_file" path="src/App.jsx">
<code>
import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to Your Generated Website!</h1>
        <p>This is a demo website generated without AI API key.</p>
        <div className="features">
          <div className="feature">
            <h3>🚀 Demo Website</h3>
            <p>This is a sample website created as a fallback</p>
          </div>
          <div className="feature">
            <h3>⚡ React Ready</h3>
            <p>Built with React and modern web technologies</p>
          </div>
          <div className="feature">
            <h3>🎨 Beautiful Design</h3>
            <p>Responsive and modern design patterns</p>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
</code>
</step>

<step type="create_file" path="src/App.css">
<code>
.App {
  text-align: center;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.App-header {
  background: rgba(255, 255, 255, 0.1);
  padding: 40px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  color: white;
  max-width: 800px;
  margin: 20px;
}

.App-header h1 {
  font-size: 2.5rem;
  margin-bottom: 20px;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 30px;
}

.feature {
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.feature h3 {
  margin-bottom: 10px;
  color: #4ecdc4;
}
</code>
</step>`
      }, { headers: corsHeaders });
    }

    const { messages } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400, headers: corsHeaders });
    }
    
    console.log('Chat API: Processing messages:', messages.length);
    
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
