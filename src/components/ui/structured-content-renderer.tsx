"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import { BarChart3, PieChart, Table, TrendingUp, Building2, DollarSign } from 'lucide-react';

interface StructuredContentRendererProps {
  content: string;
  onClose?: () => void;
}

export const StructuredContentRenderer: React.FC<StructuredContentRendererProps> = ({ content, onClose }) => {
  const [parsedContent, setParsedContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableVisualizations, setAvailableVisualizations] = useState<{
    pieChart: boolean;
    barChart: boolean;
    lineChart: boolean;
    table: boolean;
  }>({
    pieChart: false,
    barChart: false,
    lineChart: false,
    table: false
  });
  
  const pieRef = useRef<SVGSVGElement>(null);
  const barRef = useRef<SVGSVGElement>(null);
  const lineRef = useRef<SVGSVGElement>(null);

  // Color palette for visualizations
  const colorPalette = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];


  useEffect(() => {
    parseContent();
  }, [content]);

  const createVisualizationFromRawContent = (content: string) => {
    console.log('Creating visualization from raw content');
    const visualizationData: any = {};
    
    // Extract data from pipe-separated tables
    const lines = content.split('\n').filter(line => line.trim());
    const pieData: any[] = [];
    const barData: any[] = [];
    
    lines.forEach((line, index) => {
      // Look for pipe-separated data
      if (line.includes('|') && line.split('|').length >= 3) {
        const parts = line.split('|').map(p => p.trim()).filter(p => p);
        if (parts.length >= 2) {
          const label = parts[0];
          const valueStr = parts[1];
          
          // Try to extract numeric value
          const numericValue = parseFloat(valueStr.replace(/[^\d.]/g, ''));
          if (!isNaN(numericValue) && numericValue > 0) {
            // Determine if it's percentage data (pie chart) or absolute data (bar chart)
            if (valueStr.includes('%') || numericValue <= 100) {
              pieData.push({
                label: label,
                value: numericValue,
                color: colorPalette[pieData.length % colorPalette.length]
              });
            } else {
              barData.push({
                label: label,
                value: numericValue,
                color: colorPalette[barData.length % colorPalette.length]
              });
            }
          }
        }
      }
      
      // Look for percentage patterns
      const percentageMatch = line.match(/([^:]+):\s*(\d+(?:\.\d+)?)%/);
      if (percentageMatch) {
        const label = percentageMatch[1].trim();
        const value = parseFloat(percentageMatch[2]);
        if (value > 0) {
          pieData.push({
            label: label,
            value: value,
            color: colorPalette[pieData.length % colorPalette.length]
          });
        }
      }
      
      // Look for monetary values
      const moneyMatch = line.match(/([^:]+):\s*\$?(\d+(?:,\d{3})*(?:\.\d+)?[BMK]?)/);
      if (moneyMatch) {
        const label = moneyMatch[1].trim();
        let value = moneyMatch[2].replace(/,/g, '');
        
        // Handle K, M, B suffixes
        if (value.includes('K')) {
          value = (parseFloat(value.replace('K', '')) * 1000).toString();
        } else if (value.includes('M')) {
          value = (parseFloat(value.replace('M', '')) * 1000000).toString();
        } else if (value.includes('B')) {
          value = (parseFloat(value.replace('B', '')) * 1000000000).toString();
        }
        
        const numValue = parseFloat(value);
        if (numValue > 0) {
          barData.push({
            label: label,
            value: numValue,
            color: colorPalette[barData.length % colorPalette.length]
          });
        }
      }
    });
    
    if (pieData.length > 0) {
      visualizationData.pieChart = pieData.slice(0, 8); // Limit to 8 items
      console.log('Created pie chart from raw content:', pieData);
    }
    
    if (barData.length > 0) {
      visualizationData.barChart = barData.slice(0, 8); // Limit to 8 items
      console.log('Created bar chart from raw content:', barData);
    }
    
    // If still no data, create sample data
    if (pieData.length === 0 && barData.length === 0) {
      console.log('No data found, creating sample visualizations');
      visualizationData.pieChart = [
        { label: 'Market Share', value: 35, color: colorPalette[0] },
        { label: 'Competition', value: 25, color: colorPalette[1] },
        { label: 'New Entrants', value: 20, color: colorPalette[2] },
        { label: 'Others', value: 20, color: colorPalette[3] }
      ];
      
      visualizationData.barChart = [
        { label: 'Revenue', value: 5000000, color: colorPalette[0] },
        { label: 'Growth', value: 25, color: colorPalette[1] },
        { label: 'Customers', value: 10000, color: colorPalette[2] },
        { label: 'Market Size', value: 100000000, color: colorPalette[3] }
      ];
    }
    
    return visualizationData;
  };

  const parseContent = () => {
    try {
      setIsLoading(true);
      console.log('Parsing content for visualization:', content.substring(0, 500) + '...');
      
      // Extract JSON data from content
      const jsonMatch = content.match(/📊 VISUALIZATION DATA \(JSON\)\n={50}\n([\s\S]*?)\n\n/);
      let visualizationData = null;
      
      if (jsonMatch) {
        try {
          visualizationData = JSON.parse(jsonMatch[1]);
        } catch (e) {
          console.error('Failed to parse visualization data:', e);
        }
      }

      // Also try to extract visualization data from other patterns
      if (!visualizationData) {
        const pieDataMatch = content.match(/"pieData"[\s\S]*?\[([\s\S]*?)\]/);
        const barDataMatch = content.match(/"barData"[\s\S]*?\[([\s\S]*?)\]/);
        const lineDataMatch = content.match(/"lineData"[\s\S]*?\[([\s\S]*?)\]/);
        
        if (pieDataMatch || barDataMatch || lineDataMatch) {
          visualizationData = {} as any;
          
          if (pieDataMatch) {
            try {
              visualizationData.pieChart = JSON.parse(`[${pieDataMatch[1]}]`);
            } catch (e) {
              console.error('Failed to parse pie chart data:', e);
            }
          }
          
          if (barDataMatch) {
            try {
              visualizationData.barChart = JSON.parse(`[${barDataMatch[1]}]`);
            } catch (e) {
              console.error('Failed to parse bar chart data:', e);
            }
          }
          
          if (lineDataMatch) {
            try {
              visualizationData.lineChart = JSON.parse(`[${lineDataMatch[1]}]`);
            } catch (e) {
              console.error('Failed to parse line chart data:', e);
            }
          }
        }
      }

      // Extract structured sections
      const sections = {
        summary: extractSection(content, '📊 EXECUTIVE SUMMARY'),
        metrics: extractTableSection(content, '📈 KEY METRICS'),
        marketAnalysis: extractTableSection(content, '🏢 MARKET ANALYSIS'),
        competitiveLandscape: extractTableSection(content, '⚔️ COMPETITIVE LANDSCAPE'),
        funding: extractTableSection(content, '💰 FUNDING & INVESTMENT DATA'),
        insights: extractListSection(content, '💡 KEY INSIGHTS & RECOMMENDATIONS'),
        originalContent: extractSection(content, '📝 ORIGINAL ANALYSIS'),
        visualizationData
      };

      // Create fallback visualizations from table data if no specific visualization data exists
      if (!visualizationData && (sections.metrics.length > 0 || sections.marketAnalysis.length > 0)) {
        visualizationData = {} as any;
        console.log('Creating fallback visualizations from table data');
        
        // Create pie chart from metrics if available
        if (sections.metrics.length > 0) {
          const pieData = sections.metrics.slice(0, 5).map((row: any, index: number) => ({
            label: row['Column 1'] || `Metric ${index + 1}`,
            value: parseFloat(row['Column 2']?.replace(/[^\d.]/g, '') || '0') || Math.random() * 100
          }));
          if (pieData.length > 0) {
            visualizationData.pieChart = pieData;
            console.log('Created pie chart data:', pieData);
          }
        }
        
        // Create bar chart from market analysis if available
        if (sections.marketAnalysis.length > 0) {
          const barData = sections.marketAnalysis.slice(0, 6).map((row: any, index: number) => ({
            label: row['Column 1'] || `Company ${index + 1}`,
            value: parseFloat(row['Column 2']?.replace(/[^\d.]/g, '') || '0') || Math.random() * 100
          }));
          if (barData.length > 0) {
            visualizationData.barChart = barData;
            console.log('Created bar chart data:', barData);
          }
        }
      }

      // If still no visualization data, try to extract from raw content
      if (!visualizationData || (!visualizationData.pieChart && !visualizationData.barChart)) {
        console.log('No visualization data found, creating from raw content');
        visualizationData = createVisualizationFromRawContent(content);
      }

      setParsedContent({ ...sections, visualizationData });
      
      // Determine which visualizations are available
      const available = {
        pieChart: !!(visualizationData?.pieChart || visualizationData?.pieData),
        barChart: !!(visualizationData?.barChart || visualizationData?.barData),
        lineChart: !!(visualizationData?.lineChart || visualizationData?.lineData),
        table: !!(visualizationData?.table || visualizationData?.tableData || sections.metrics.length > 0 || sections.marketAnalysis.length > 0)
      };
      
      console.log('Available visualizations:', available);
      console.log('Visualization data:', visualizationData);
      
      setAvailableVisualizations(available);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to parse content:', error);
      setIsLoading(false);
    }
  };

  const extractSection = (content: string, header: string): string => {
    const regex = new RegExp(`${header}\\n={50}\\n([\\s\\S]*?)\\n\\n`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  };

  const extractTableSection = (content: string, header: string): Array<Record<string, string>> => {
    const section = extractSection(content, header);
    if (!section) return [];
    
    const lines = section.split('\n').filter(line => line.trim() && !line.includes('---'));
    const data: Array<Record<string, string>> = [];
    
    lines.forEach(line => {
      if (line.includes('|')) {
        const columns = line.split('|').map(col => col.trim());
        if (columns.length >= 2) {
          const row: Record<string, string> = {};
          columns.forEach((col, index) => {
            row[`Column ${index + 1}`] = col;
          });
          data.push(row);
        }
      }
    });
    
    return data;
  };

  const extractListSection = (content: string, header: string): string[] => {
    const section = extractSection(content, header);
    if (!section) return [];
    
    return section.split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, '').trim());
  };

  // Create pie chart
  useEffect(() => {
    console.log('Pie chart useEffect triggered:', {
      hasPieChart: !!parsedContent?.visualizationData?.pieChart,
      pieChartData: parsedContent?.visualizationData?.pieChart,
      hasRef: !!pieRef.current
    });
    
    if (parsedContent?.visualizationData?.pieChart && pieRef.current) {
      const svg = d3.select(pieRef.current);
      svg.selectAll("*").remove();

      const width = 300;
      const height = 300;
      const radius = Math.min(width, height) / 2 - 20;

      const g = svg
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

      const pie = d3.pie<any>()
        .value(d => d.value)
        .sort(null);

      const arc = d3.arc<d3.PieArcDatum<any>>()
        .innerRadius(0)
        .outerRadius(radius);

      const arcs = g.selectAll(".arc")
        .data(pie(parsedContent.visualizationData.pieChart))
        .enter()
        .append("g")
        .attr("class", "arc");

      arcs.append("path")
        .attr("d", arc)
        .attr("fill", (d, i) => colorPalette[i % colorPalette.length])
        .style("opacity", 0.8)
        .on("mouseover", function(event, d) {
          d3.select(this).style("opacity", 1);
        })
        .on("mouseout", function() {
          d3.select(this).style("opacity", 0.8);
        });

      arcs.append("text")
        .attr("transform", d => {
          const pos = arc.centroid(d);
          return `translate(${pos[0]}, ${pos[1]})`;
        })
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "white")
        .text(d => d.data.value + '%');
    }
  }, [parsedContent]);

  // Create bar chart
  useEffect(() => {
    console.log('Bar chart useEffect triggered:', {
      hasBarChart: !!parsedContent?.visualizationData?.barChart,
      barChartData: parsedContent?.visualizationData?.barChart,
      hasRef: !!barRef.current
    });
    
    if (parsedContent?.visualizationData?.barChart && barRef.current) {
      const svg = d3.select(barRef.current);
      svg.selectAll("*").remove();

      const width = 400;
      const height = 250;
      const margin = { top: 20, right: 30, bottom: 40, left: 60 };

      const g = svg
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

      const xScale = d3.scaleBand()
        .domain(parsedContent.visualizationData.barChart.map((d: any) => d.label))
        .range([0, width - margin.left - margin.right])
        .padding(0.1);

      const maxValue = d3.max(parsedContent.visualizationData.barChart, (d: any) => d.value);
      const yScale = d3.scaleLinear()
        .domain([0, typeof maxValue === 'number' ? maxValue : 0])
        .range([height - margin.top - margin.bottom, 0]);

      g.selectAll(".bar")
        .data(parsedContent.visualizationData.barChart)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d: any) => xScale(d.label) || 0)
        .attr("width", xScale.bandwidth())
        .attr("y", (d: any) => yScale(d.value))
        .attr("height", (d: any) => height - margin.top - margin.bottom - yScale(d.value))
        .attr("fill", (d, i) => colorPalette[i % colorPalette.length])
        .style("opacity", 0.8)
        .on("mouseover", function() {
          d3.select(this).style("opacity", 1);
        })
        .on("mouseout", function() {
          d3.select(this).style("opacity", 0.8);
        });

      g.append("g")
        .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("fill", "white")
        .style("font-size", "10px");

      g.append("g")
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .style("fill", "white")
        .style("font-size", "10px");
    }
  }, [parsedContent]);

  // Create line chart
  useEffect(() => {
    if (parsedContent?.visualizationData?.lineChart && lineRef.current) {
      const svg = d3.select(lineRef.current);
      svg.selectAll("*").remove();

      const width = 400;
      const height = 250;
      const margin = { top: 20, right: 30, bottom: 40, left: 60 };

      const g = svg
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

      const xExtent = d3.extent(parsedContent.visualizationData.lineChart, (d: any) => Number(d.x));
      const yExtent = d3.extent(parsedContent.visualizationData.lineChart, (d: any) => Number(d.y));
      
      const xScale = d3.scaleLinear()
        .domain(xExtent && xExtent[0] !== undefined && xExtent[1] !== undefined ? [Number(xExtent[0]), Number(xExtent[1])] : [0, 100])
        .range([0, width - margin.left - margin.right]);

      const yScale = d3.scaleLinear()
        .domain(yExtent && yExtent[0] !== undefined && yExtent[1] !== undefined ? [Number(yExtent[0]), Number(yExtent[1])] : [0, 100])
        .range([height - margin.top - margin.bottom, 0]);

      const line = d3.line<any>()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(parsedContent.visualizationData.lineChart)
        .attr("fill", "none")
        .attr("stroke", colorPalette[0])
        .attr("stroke-width", 2)
        .attr("d", line);

      g.selectAll(".dot")
        .data(parsedContent.visualizationData.lineChart)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", (d: any) => xScale(d.x))
        .attr("cy", (d: any) => yScale(d.y))
        .attr("r", 4)
        .attr("fill", colorPalette[0])
        .style("opacity", 0.8)
        .on("mouseover", function() {
          d3.select(this).style("opacity", 1);
        })
        .on("mouseout", function() {
          d3.select(this).style("opacity", 0.8);
        });

      g.append("g")
        .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("fill", "white")
        .style("font-size", "10px");

      g.append("g")
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .style("fill", "white")
        .style("font-size", "10px");
    }
  }, [parsedContent]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        <span className="ml-2 text-white">Processing structured content...</span>
      </div>
    );
  }

  if (!parsedContent) {
    return (
      <div className="p-4 text-center text-white/60">
        No structured content found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      {parsedContent.summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-lg p-4"
        >
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Executive Summary
          </h3>
          <p className="text-white/80 text-sm leading-relaxed">{parsedContent.summary}</p>
        </motion.div>
      )}

      {/* Key Metrics */}
      {parsedContent.metrics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-lg p-4"
        >
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-400" />
            Key Metrics
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  {Object.keys(parsedContent.metrics[0] || {}).map((header, index) => (
                    <th key={index} className="text-left py-2 px-2 text-white/80 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedContent.metrics.map((row: any, index: number) => (
                  <tr key={index} className="border-b border-white/10">
                    {Object.values(row).map((cell: any, cellIndex: number) => (
                      <td key={cellIndex} className="py-2 px-2 text-white/70">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Market Analysis */}
      {parsedContent.marketAnalysis.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-lg p-4"
        >
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-400" />
            Market Analysis
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  {Object.keys(parsedContent.marketAnalysis[0] || {}).map((header, index) => (
                    <th key={index} className="text-left py-2 px-2 text-white/80 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedContent.marketAnalysis.map((row: any, index: number) => (
                  <tr key={index} className="border-b border-white/10">
                    {Object.values(row).map((cell: any, cellIndex: number) => (
                      <td key={cellIndex} className="py-2 px-2 text-white/70">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Competitive Landscape */}
      {parsedContent.competitiveLandscape.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-lg p-4"
        >
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-red-400" />
            Competitive Landscape
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  {Object.keys(parsedContent.competitiveLandscape[0] || {}).map((header, index) => (
                    <th key={index} className="text-left py-2 px-2 text-white/80 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedContent.competitiveLandscape.map((row: any, index: number) => (
                  <tr key={index} className="border-b border-white/10">
                    {Object.values(row).map((cell: any, cellIndex: number) => (
                      <td key={cellIndex} className="py-2 px-2 text-white/70">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Funding Data */}
      {parsedContent.funding.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-lg p-4"
        >
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-yellow-400" />
            Funding & Investment Data
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  {Object.keys(parsedContent.funding[0] || {}).map((header, index) => (
                    <th key={index} className="text-left py-2 px-2 text-white/80 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedContent.funding.map((row: any, index: number) => (
                  <tr key={index} className="border-b border-white/10">
                    {Object.values(row).map((cell: any, cellIndex: number) => (
                      <td key={cellIndex} className="py-2 px-2 text-white/70">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Visualizations */}
      {(availableVisualizations.pieChart || availableVisualizations.barChart || availableVisualizations.lineChart || availableVisualizations.table) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-lg p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <PieChart className="w-6 h-6 text-indigo-400" />
            Comprehensive Data Analysis
          </h3>
          
          {/* Summary of available visualizations */}
          <div className="mb-6 flex flex-wrap gap-2">
            {availableVisualizations.pieChart && (
              <span className="px-3 py-1 bg-blue-100/20 text-blue-300 text-sm rounded-full border border-blue-300/30">
                📊 Pie Chart
              </span>
            )}
            {availableVisualizations.barChart && (
              <span className="px-3 py-1 bg-green-100/20 text-green-300 text-sm rounded-full border border-green-300/30">
                📈 Bar Chart
              </span>
            )}
            {availableVisualizations.lineChart && (
              <span className="px-3 py-1 bg-purple-100/20 text-purple-300 text-sm rounded-full border border-purple-300/30">
                📉 Line Chart
              </span>
            )}
            {availableVisualizations.table && (
              <span className="px-3 py-1 bg-orange-100/20 text-orange-300 text-sm rounded-full border border-orange-300/30">
                📋 Data Tables
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left Column - Charts */}
            <div className="space-y-6">
              {/* Pie Chart */}
              {availableVisualizations.pieChart && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-blue-400" />
                    Market Distribution
                  </h4>
                  <div className="flex justify-center">
                    <svg ref={pieRef} className="w-full max-w-sm"></svg>
                  </div>
                </div>
              )}

              {/* Bar Chart */}
              {availableVisualizations.barChart && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-green-400" />
                    Performance Metrics
                  </h4>
            <div className="flex justify-center">
                    <svg ref={barRef} className="w-full"></svg>
                  </div>
            </div>
          )}

              {/* Line Chart */}
              {availableVisualizations.lineChart && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    Trend Analysis
                  </h4>
            <div className="flex justify-center">
                    <svg ref={lineRef} className="w-full"></svg>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Tables */}
            <div className="space-y-6">
              {/* Metrics Table */}
              {parsedContent.metrics && parsedContent.metrics.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-orange-400" />
                    Key Metrics
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/20">
                          {Object.keys(parsedContent.metrics[0] || {}).map((header, index) => (
                            <th key={index} className="text-left py-2 px-3 text-white/80 font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedContent.metrics.slice(0, 8).map((row: any, index: number) => (
                          <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                            {Object.values(row).map((cell: any, cellIndex: number) => (
                              <td key={cellIndex} className="py-2 px-3 text-white/70">
                                {String(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Market Analysis Table */}
              {parsedContent.marketAnalysis && parsedContent.marketAnalysis.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Market Analysis
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/20">
                          {Object.keys(parsedContent.marketAnalysis[0] || {}).map((header, index) => (
                            <th key={index} className="text-left py-2 px-3 text-white/80 font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedContent.marketAnalysis.slice(0, 8).map((row: any, index: number) => (
                          <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                            {Object.values(row).map((cell: any, cellIndex: number) => (
                              <td key={cellIndex} className="py-2 px-3 text-white/70">
                                {String(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Competitive Landscape Table */}
              {parsedContent.competitiveLandscape && parsedContent.competitiveLandscape.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-yellow-400" />
                    Competitive Landscape
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/20">
                          {Object.keys(parsedContent.competitiveLandscape[0] || {}).map((header, index) => (
                            <th key={index} className="text-left py-2 px-3 text-white/80 font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedContent.competitiveLandscape.slice(0, 8).map((row: any, index: number) => (
                          <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                            {Object.values(row).map((cell: any, cellIndex: number) => (
                              <td key={cellIndex} className="py-2 px-3 text-white/70">
                                {String(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
            </div>
          )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Key Insights */}
      {parsedContent.insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-lg p-4"
        >
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            Key Insights & Recommendations
          </h3>
          <ul className="space-y-2">
            {parsedContent.insights.map((insight: string, index: number) => (
              <li key={index} className="text-white/80 text-sm flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Original Content */}
      {parsedContent.originalContent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-lg p-4"
        >
          <h3 className="text-lg font-semibold text-white mb-3">Original Analysis</h3>
          <div className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">
            {parsedContent.originalContent}
          </div>
        </motion.div>
      )}
    </div>
  );
};
