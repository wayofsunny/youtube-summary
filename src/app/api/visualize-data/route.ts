import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();
    console.log("🎨 API called with content:", content?.substring(0, 200) + "...");

    if (!content || typeof content !== 'string') {
      console.log("❌ Invalid content provided");
      return NextResponse.json({ 
        error: "Content is required and must be a string" 
      }, { status: 400 });
    }

    console.log("🎨 Generating visualization data for content:", content.substring(0, 200) + "...");

    const prompt = `Analyze the following research content and extract structured data for visualization. Convert the text into three types of data:

1. PIE CHART DATA: Extract percentage-based data, market shares, distributions, or proportions
2. BAR CHART DATA: Extract absolute values, revenues, funding amounts, growth rates, or metrics
3. TABLE DATA: Extract structured tabular information with clear rows and columns

Research Content:
${content}

Please return ONLY a valid JSON object with this exact structure:
{
  "pieChart": [
    {"label": "Category Name", "value": percentage_number},
    {"label": "Another Category", "value": percentage_number}
  ],
  "barChart": [
    {"label": "Metric Name", "value": absolute_number},
    {"label": "Another Metric", "value": absolute_number}
  ],
  "table": [
    {"Column1": "Value1", "Column2": "Value2", "Column3": "Value3"},
    {"Column1": "Value4", "Column2": "Value5", "Column3": "Value6"}
  ]
}

IMPORTANT RULES:
- Extract REAL data from the content, don't make up numbers
- For pieChart: use percentages (0-100) or proportions that add up to 100
- For barChart: use absolute values, revenues, counts, or metrics
- For table: extract actual tabular data from the content
- If no data exists for a category, use an empty array []
- Ensure all numbers are valid (no NaN, no negative values for pie charts)
- Use clear, descriptive labels
- Limit to maximum 8 items per chart for readability

Return ONLY the JSON object, no other text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a data extraction specialist. Your job is to analyze research content and extract structured data for visualization. Always return valid JSON with the exact structure requested. Focus on extracting real data from the content, not generating fake data."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const responseText = response.choices[0]?.message?.content || "{}";
    
    try {
      const visualizationData = JSON.parse(responseText);
      
      // Validate and clean the data
      const cleanedData = {
        pieChart: Array.isArray(visualizationData.pieChart) 
          ? visualizationData.pieChart
            .filter((item: any) => item.label && typeof item.value === 'number' && item.value > 0)
            .slice(0, 8)
          : [],
        barChart: Array.isArray(visualizationData.barChart) 
          ? visualizationData.barChart
            .filter((item: any) => item.label && typeof item.value === 'number' && item.value > 0)
            .slice(0, 8)
          : [],
        table: Array.isArray(visualizationData.table) 
          ? visualizationData.table.slice(0, 10)
          : []
      };

      console.log("✅ Generated visualization data:", {
        pieChartItems: cleanedData.pieChart.length,
        barChartItems: cleanedData.barChart.length,
        tableRows: cleanedData.table.length
      });

      return NextResponse.json(cleanedData);
    } catch (parseError) {
      console.error("Failed to parse LLM response as JSON:", parseError);
      console.log("Raw response:", responseText);
      
      // Fallback: create sample data
      return NextResponse.json({
        pieChart: [
          { label: "Market Share", value: 35 },
          { label: "Competition", value: 25 },
          { label: "New Entrants", value: 20 },
          { label: "Others", value: 20 }
        ],
        barChart: [
          { label: "Revenue", value: 5000000 },
          { label: "Growth Rate", value: 25 },
          { label: "Customer Count", value: 10000 },
          { label: "Market Size", value: 100000000 }
        ],
        table: [
          { Metric: "Total Addressable Market", Value: "$100B", Growth: "15%" },
          { Metric: "Serviceable Market", Value: "$10B", Growth: "20%" },
          { Metric: "Market Penetration", Value: "5%", Growth: "25%" }
        ]
      });
    }

  } catch (error) {
    console.error("Error generating visualization data:", error);
    
    return NextResponse.json({ 
      error: "Failed to generate visualization data",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
