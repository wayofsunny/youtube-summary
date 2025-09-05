# AI Research Agent Setup Guide

## Overview
The AI Research Agent is a powerful startup founder assistant that uses OpenAI's GPT models to provide extremely detailed, comprehensive, and data-rich research insights organized in Business Model Canvas format. It's specifically designed to help startup founders analyze their business model using the 9 building blocks with extensive data, examples, and detailed insights: Key Partnerships, Customer Segments, Value Propositions, Channels, Key Resources, Customer Relationships, Revenue Streams, Key Activities, and Cost Structure.

## Prerequisites
- Node.js 18+ installed
- OpenAI API account with credits
- Valid OpenAI API key

## Setup Instructions

### 1. Environment Configuration
Create a `.env.local` file in your project root with the following content:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_actual_openai_api_key_here

# YouTube API Configuration (for video analysis)
YOUTUBE_API_KEY=your_youtube_api_key_here

# SerpAPI Configuration (for news article search)
SERPAPI_API_KEY=your_serpapi_key_here

# Next.js Configuration (optional)
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

**Important:** Replace `your_actual_openai_api_key_here` with your real OpenAI API key.

### 2. Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and paste it in your `.env.local` file

### 3. Get YouTube API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Go to Credentials and create an API key
5. Copy the key and paste it in your `.env.local` file

### 4. Get SerpAPI Key
1. Go to [SerpAPI](https://serpapi.com/)
2. Sign up for an account
3. Navigate to your dashboard
4. Copy your API key
5. Paste it in your `.env.local` file

### 5. Install Dependencies
```bash
npm install
```

### 6. Run the Development Server
```bash
npm run dev
```

### 7. Access the AI Researcher Agent
Navigate to `http://localhost:3000/ai_researcher_agent` in your browser.

## Features

### Business Model Canvas Framework
The AI Research Agent organizes all research findings according to the Business Model Canvas framework, which consists of 9 key building blocks. Each section provides extremely detailed analysis with extensive data, specific examples, case studies, and comprehensive insights:

1. **Key Partnerships**: Detailed strategic alliances, joint ventures, supplier relationships, key stakeholders, partnership models, success factors, risks, and specific examples
2. **Customer Segments**: Comprehensive target customer groups, detailed user personas, market segments, customer characteristics, demographics, psychographics, behavior patterns, and specific examples
3. **Value Propositions**: Detailed core benefits, unique selling points, problem solutions, customer value, differentiation factors, competitive advantages, and specific examples
4. **Channels**: Comprehensive distribution channels, customer touchpoints, marketing channels, sales approaches, channel effectiveness, customer journey, and specific examples
5. **Key Resources**: Detailed human, financial, physical, and intellectual resources needed, resource requirements, acquisition strategies, and specific examples
6. **Customer Relationships**: Comprehensive customer acquisition, retention strategies, relationship types, customer lifecycle, engagement models, and specific examples
7. **Revenue Streams**: Detailed pricing models, revenue sources, monetization strategies, pricing strategies, revenue optimization, and specific examples
8. **Key Activities**: Comprehensive core business processes, operations, value-creating activities, operational requirements, efficiency factors, and specific examples
9. **Cost Structure**: Detailed fixed and variable costs, key cost drivers, resource allocation, cost optimization strategies, and specific examples

### Research Capabilities
- **Business Model Canvas Analysis**: Structured analysis using the 9 building blocks framework
- **Market Analysis**: Industry trends, competitive landscape, market opportunities, market size estimation
- **Business Strategy**: Strategic planning, business model validation, growth strategies, go-to-market planning
- **Customer Analysis**: Customer segments, relationships, value propositions, and acquisition strategies
- **Competitive Intelligence**: Competitor analysis, market positioning, differentiation strategies, competitive advantages
- **Financial Modeling**: Revenue streams, cost structure, pricing strategies, and financial sustainability
- **Partnership Strategy**: Key partnerships, resources, activities, and strategic alliances
- **Channel Strategy**: Distribution channels, marketing approaches, and customer touchpoints

### AI-Powered Insights
- **Extremely Detailed Analysis**: Comprehensive research with extensive data, examples, and actionable insights
- **Data-Rich Research**: Every point supported with detailed data, numbers, and specific examples
- **Comprehensive Coverage**: In-depth analysis covering all aspects of the Business Model Canvas
- **Professional Quality**: Research suitable for professional business analysis and investor presentations
- **Preference-Based Research**: Customize research based on your specific needs
- **Export Results**: Download detailed research findings as text files

### Integrated Research Platform
The AI Research Agent now provides a comprehensive research experience by combining multiple data sources:

#### YouTube Video Analysis
- **Smart Video Discovery**: Automatically finds the most relevant YouTube videos for your research topic
- **AI-Generated Summaries**: Creates concise, business-focused summaries of video content
- **Transcript Analysis**: Analyzes video transcripts to extract key business insights
- **Relevance Ranking**: Prioritizes videos by relevance and view count
- **Direct Links**: Easy access to watch videos or visit channels

#### News Article Analysis
- **Latest Industry News**: Searches for recent news articles related to your research topic
- **Reliable Sources**: Pulls from trusted news sources and publications
- **Content Summaries**: Provides article snippets and summaries
- **Source Attribution**: Clear information about article sources and publication dates
- **Direct Access**: Click-through links to read full articles

#### Combined Research Report
- **Unified Output**: All research findings presented in one comprehensive report
- **Cross-Reference Analysis**: AI identifies connections between different data sources
- **Actionable Insights**: Synthesized recommendations based on all available information
- **Downloadable Results**: Export complete research including videos and news

## Usage

### Basic Research
1. Enter your research question in the input field
2. Click "Start Research" button
3. Wait for AI analysis (typically 10-30 seconds)
4. Review the summary and detailed analysis
5. Download results if needed

### Advanced Research
1. Configure research preferences using the modal
2. Set industry focus, research depth, and specific areas of interest
3. The AI will incorporate these preferences into its analysis

### Quick Prompts
Use the pre-built research prompts for common Business Model Canvas analysis topics:
- Business Model Canvas analysis for SaaS startups
- Competitive landscape and business model analysis in fintech
- Customer segments and value proposition analysis for B2B
- Product-market fit and business model validation
- Funding trends and revenue model analysis in AI sector
- User research and customer relationship strategies
- Go-to-market strategy and channel analysis for B2C
- Pricing strategy and revenue stream optimization
- Market entry strategy and partnership opportunities
- Customer retention and cost structure optimization

## Troubleshooting

### Common Issues

#### "OpenAI API key not configured"
- Ensure `.env.local` file exists in project root
- Verify `OPENAI_API_KEY` variable is set correctly
- Restart the development server after adding environment variables

#### "Invalid OpenAI API key"
- Check that your API key is correct
- Ensure your OpenAI account has available credits
- Verify the API key hasn't expired

#### "Rate limit exceeded"
- Wait a few minutes before trying again
- Consider upgrading your OpenAI plan if this happens frequently

#### "API request failed"
- Check your internet connection
- Verify the development server is running
- Check browser console for detailed error messages

### Performance Tips
- Keep research queries specific and focused
- Use research preferences to get more targeted results
- Consider breaking complex research into smaller, focused queries

## API Endpoints

### POST /api/ai-research
**Request Body:**
```json
{
  "query": "Your research question here"
}
```

**Response:**
```json
{
  "summary": "Concise summary of findings",
  "answer": "Detailed research analysis",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Security Notes
- Never commit your `.env.local` file to version control
- Keep your OpenAI API key secure and private
- Monitor your API usage to avoid unexpected charges
- Consider implementing rate limiting for production use

## Support
If you encounter issues:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Verify environment variable configuration
4. Ensure all dependencies are properly installed

## License
This project is part of the YouTube Summary application. Please refer to the main project license for usage terms.
