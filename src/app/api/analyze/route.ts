import { NextRequest, NextResponse } from 'next/server';

interface Suggestion {
  id: string;
  kind: 'visualization' | 'rewrite';
  title: string;
  spec?: any;
  data?: any[];
  replacement?: string;
  rationale: string;
  confidence: number;
}

// Mock data for testing
const mockSuggestions: Record<string, Suggestion[]> = {
  'funding': [
    {
      id: 's1',
      kind: 'visualization',
      title: 'Funding by Company',
      spec: { type: 'bar', x: 'company', y: 'funding' },
      data: [
        { company: 'Plastic Energy', funding: 250 },
        { company: 'Loop Industries', funding: 180 },
        { company: 'PureCycle', funding: 320 },
        { company: 'Carbios', funding: 150 }
      ],
      rationale: 'Numbers detected: funding amounts and companies',
      confidence: 0.86
    },
    {
      id: 's2',
      kind: 'rewrite',
      title: 'Crisp takeaways',
      replacement: '• Plastic Energy raised $250M in Series B\n• Loop Industries secured $180M funding\n• PureCycle leads with $320M investment\n• Carbios completed $150M round',
      rationale: 'Structured bullet points for better readability',
      confidence: 0.74
    }
  ],
  'market': [
    {
      id: 's3',
      kind: 'visualization',
      title: 'Market Share Distribution',
      spec: { type: 'pie' },
      data: [
        { label: 'Chemical Recycling', value: 45 },
        { label: 'Mechanical Recycling', value: 30 },
        { label: 'Energy Recovery', value: 15 },
        { label: 'Landfill', value: 10 }
      ],
      rationale: 'Percentage data detected for pie chart',
      confidence: 0.92
    },
    {
      id: 's4',
      kind: 'visualization',
      title: 'Market Growth Timeline',
      spec: { type: 'line' },
      data: [
        { year: '2020', value: 2.1 },
        { year: '2021', value: 2.8 },
        { year: '2022', value: 3.5 },
        { year: '2023', value: 4.2 },
        { year: '2024', value: 5.1 }
      ],
      rationale: 'Time series data with growth rates',
      confidence: 0.88
    }
  ],
  'default': [
    {
      id: 's5',
      kind: 'rewrite',
      title: 'Key Insights',
      replacement: '• Key finding 1\n• Key finding 2\n• Key finding 3',
      rationale: 'Text analysis suggests bullet point format',
      confidence: 0.65
    }
  ]
};

export async function POST(request: NextRequest) {
  try {
    const { selectionText } = await request.json();
    
    if (!selectionText || typeof selectionText !== 'string') {
      return NextResponse.json(
        { error: 'Invalid selection text' },
        { status: 400 }
      );
    }

    // Check for mock mode
    const url = new URL(request.url);
    const mockMode = url.searchParams.get('mock') === '1';
    
    if (mockMode) {
      // Return mock suggestions based on content
      let suggestions: Suggestion[] = [];
      
      if (selectionText.toLowerCase().includes('funding') || selectionText.includes('$')) {
        suggestions = mockSuggestions.funding;
      } else if (selectionText.toLowerCase().includes('market') || selectionText.includes('%')) {
        suggestions = mockSuggestions.market;
      } else {
        suggestions = mockSuggestions.default;
      }
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return NextResponse.json({ suggestions });
    }

    // Real LLM analysis
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const prompt = `
Analyze the following text selection and provide suggestions for visualization or rewriting.

Text: "${selectionText}"

Return ONLY a JSON response with this exact structure:
{
  "suggestions": [
    {
      "id": "s1",
      "kind": "visualization",
      "title": "Chart Title",
      "spec": { "type": "bar", "x": "category", "y": "value" },
      "data": [{"category": "A", "value": 100}],
      "rationale": "Why this visualization fits",
      "confidence": 0.85
    },
    {
      "id": "s2", 
      "kind": "rewrite",
      "title": "Rewrite Title",
      "replacement": "• Bullet point 1\n• Bullet point 2",
      "rationale": "Why this rewrite improves the text",
      "confidence": 0.75
    }
  ]
}

Guidelines:
- If text contains numbers, percentages, or structured data, suggest visualizations
- For visualizations, provide clean data arrays with proper labels
- For rewrites, use bullet points or structured format
- Confidence should be 0.0-1.0
- Maximum 4 suggestions
- Focus on the most valuable transformations
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a data visualization and content optimization expert. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Parse JSON response
    let suggestions: Suggestion[];
    try {
      const parsed = JSON.parse(content);
      suggestions = parsed.suggestions || [];
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      // Fallback to mock data
      suggestions = mockSuggestions.default;
    }

    // Validate and clean suggestions
    suggestions = suggestions
      .filter(s => s && s.id && s.kind && s.title && s.rationale)
      .map(s => ({
        ...s,
        confidence: Math.min(Math.max(s.confidence || 0.5, 0), 1),
        data: s.data || [],
        replacement: s.replacement || ''
      }))
      .slice(0, 4); // Limit to 4 suggestions

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error('Analysis error:', error);
    
    // Return mock data as fallback
    return NextResponse.json({ 
      suggestions: mockSuggestions.default 
    });
  }
}
