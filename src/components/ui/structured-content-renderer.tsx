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
  const [activeVisualization, setActiveVisualization] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const pieRef = useRef<SVGSVGElement>(null);
  const barRef = useRef<SVGSVGElement>(null);

  // Color palette for visualizations
  const colorPalette = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];


  useEffect(() => {
    parseContent();
  }, [content]);

  const parseContent = () => {
    try {
      setIsLoading(true);
      
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

      setParsedContent(sections);
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
    if (activeVisualization === 'pie' && parsedContent?.visualizationData?.pieChart && pieRef.current) {
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
  }, [activeVisualization, parsedContent]);

  // Create bar chart
  useEffect(() => {
    if (activeVisualization === 'bar' && parsedContent?.visualizationData?.barChart && barRef.current) {
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

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(parsedContent.visualizationData.barChart, (d: any) => d.value) || 0])
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
  }, [activeVisualization, parsedContent]);

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
      {parsedContent.visualizationData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-lg p-4"
        >
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-400" />
            Data Visualizations
          </h3>
          
          <div className="flex gap-4 mb-4">
            {parsedContent.visualizationData.pieChart && (
              <button
                onClick={() => setActiveVisualization(activeVisualization === 'pie' ? null : 'pie')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeVisualization === 'pie'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <PieChart className="w-4 h-4 inline mr-2" />
                Pie Chart
              </button>
            )}
            {parsedContent.visualizationData.barChart && (
              <button
                onClick={() => setActiveVisualization(activeVisualization === 'bar' ? null : 'bar')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeVisualization === 'bar'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Bar Chart
              </button>
            )}
          </div>

          {activeVisualization === 'pie' && (
            <div className="flex justify-center">
              <svg ref={pieRef}></svg>
            </div>
          )}

          {activeVisualization === 'bar' && (
            <div className="flex justify-center">
              <svg ref={barRef}></svg>
            </div>
          )}
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
