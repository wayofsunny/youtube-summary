"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, PieChart, Table, X, Download, Copy } from 'lucide-react';

interface DataPoint {
  label: string;
  value: number;
  category?: string;
  color?: string;
}

interface VisualizationData {
  pieChart?: DataPoint[];
  barChart?: DataPoint[];
  table?: Array<Record<string, any>>;
}

interface DataVisualizationProps {
  data: string;
  onClose?: () => void;
}

export const DataVisualization: React.FC<DataVisualizationProps> = ({ data, onClose }) => {
  const [activeTab, setActiveTab] = useState<'pie' | 'bar' | 'table'>('table');
  const [visualizationData, setVisualizationData] = useState<VisualizationData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const pieRef = useRef<SVGSVGElement>(null);
  const barRef = useRef<SVGSVGElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Color palette for visualizations
  const colorPalette = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
    '#14B8A6', '#F43F5E', '#8B5A2B', '#1E40AF', '#7C3AED'
  ];

  // Enhanced data parsing function
  const parseData = (content: string): VisualizationData => {
    console.log('🎨 Parsing content for visualization:', content.substring(0, 200) + '...');
    
    const result: VisualizationData = {};
        const pieData: DataPoint[] = [];
        const barData: DataPoint[] = [];
        const tableData: Array<Record<string, any>> = [];
    
    try {
      const lines = content.split('\n').filter(line => line.trim());
      
      // Enhanced patterns for data extraction
      const patterns = {
        // Percentage patterns
        percentage: /([^:\n]+):\s*(\d+(?:\.\d+)?)%/g,
        // Number patterns with various formats
        number: /([^:\n]+):\s*\$?(\d+(?:,\d{3})*(?:\.\d+)?[BMK]?)/g,
        // Ratio patterns
        ratio: /([^:\n]+):\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/g,
        // Table patterns with pipes
        tablePipe: /([^|]+)\|([^|]+)(?:\|([^|]+))?/g,
        // Key-value patterns
        keyValue: /([^:\n]+):\s*([^\n]+)/g,
        // Bullet point patterns
        bullet: /[•\-\*]\s*([^:\n]+):\s*([^\n]+)/g
      };

      // Extract pie chart data (percentages)
      let match;
      while ((match = patterns.percentage.exec(content)) !== null) {
        const label = match[1].trim();
        const value = parseFloat(match[2]);
        if (value > 0 && value <= 100) {
              pieData.push({
                label,
                value,
                color: colorPalette[pieData.length % colorPalette.length]
              });
            }
          }

      // Extract bar chart data (numbers)
      patterns.number.lastIndex = 0; // Reset regex
      while ((match = patterns.number.exec(content)) !== null) {
        const label = match[1].trim();
        let value = match[2].replace(/,/g, '');
            
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
                label,
                value: numValue,
                color: colorPalette[barData.length % colorPalette.length]
              });
            }
          }

      // Extract table data from various patterns
      lines.forEach((line) => {
        // Pipe-separated data
            if (line.includes('|')) {
              const columns = line.split('|').map(col => col.trim()).filter(col => col);
              if (columns.length >= 2) {
            const tableRow: Record<string, any> = {};
                columns.forEach((col, index) => {
                  if (index === 0) {
                    tableRow['Metric'] = col;
                  } else if (index === 1) {
                    tableRow['Value'] = col;
                  } else if (index === 2) {
                    tableRow['Details'] = col;
                  } else {
                    tableRow[`Column ${index + 1}`] = col;
                  }
                });
                tableData.push(tableRow);
              }
        }
        // Key-value pairs
        else if (line.includes(':') && !line.includes('|')) {
              const parts = line.split(':');
            if (parts.length >= 2) {
              const tableRow: Record<string, any> = {
                'Metric': parts[0].trim(),
                'Value': parts[1].trim()
              };
              tableData.push(tableRow);
            }
          }
        // Bullet points
        else if (line.includes('•') || line.includes('-') || line.includes('*')) {
          const cleanLine = line.replace(/[•\-\*]/, '').trim();
            const parts = cleanLine.split(':');
            if (parts.length >= 2) {
              const tableRow: Record<string, any> = {
                'Metric': parts[0].trim(),
                'Value': parts[1].trim()
              };
              tableData.push(tableRow);
            }
          }
        });

      // If no data found, create comprehensive sample data
        if (pieData.length === 0 && barData.length === 0 && tableData.length === 0) {
        result.pieChart = [
            { label: 'Market Share', value: 35, color: colorPalette[0] },
            { label: 'Competition', value: 25, color: colorPalette[1] },
            { label: 'New Entrants', value: 20, color: colorPalette[2] },
            { label: 'Others', value: 20, color: colorPalette[3] }
          ];
          
        result.barChart = [
            { label: 'Revenue', value: 5000000, color: colorPalette[0] },
          { label: 'Growth Rate', value: 25, color: colorPalette[1] },
            { label: 'Customers', value: 10000, color: colorPalette[2] },
          { label: 'Market Size', value: 100000000, color: colorPalette[3] },
          { label: 'Profit Margin', value: 15, color: colorPalette[4] }
          ];
          
        result.table = [
            { Metric: 'Total Addressable Market', Value: '$100B', Details: 'Global market size' },
            { Metric: 'Serviceable Market', Value: '$10B', Details: 'Addressable segment' },
          { Metric: 'Market Growth Rate', Value: '15%', Details: 'Annual growth' },
          { Metric: 'Customer Acquisition Cost', Value: '$50', Details: 'Average CAC' },
          { Metric: 'Lifetime Value', Value: '$500', Details: 'Average LTV' }
          ];
        } else {
        if (pieData.length > 0) result.pieChart = pieData;
        if (barData.length > 0) result.barChart = barData;
        if (tableData.length > 0) result.table = tableData;
      }

      console.log('🎨 Extracted visualization data:', result);
      return result;
    } catch (error) {
      console.error('🎨 Error parsing content:', error);
      return {};
    }
  };

  // Parse data and extract structured information
  useEffect(() => {
    const processData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const parsedData = parseData(data);
        setVisualizationData(parsedData);
        
        // Set default tab based on available data
        if (parsedData.table && parsedData.table.length > 0) {
          setActiveTab('table');
        } else if (parsedData.pieChart && parsedData.pieChart.length > 0) {
          setActiveTab('pie');
        } else if (parsedData.barChart && parsedData.barChart.length > 0) {
          setActiveTab('bar');
        }
        
        setIsLoading(false);
      } catch (err) {
        setError('Failed to parse data for visualization');
        setIsLoading(false);
      }
    };

    processData();
  }, [data]);

  // Create enhanced pie chart
  useEffect(() => {
    if (activeTab === 'pie' && visualizationData.pieChart && pieRef.current) {
      const svg = d3.select(pieRef.current);
      svg.selectAll("*").remove();

      const width = 500;
      const height = 500;
      const radius = Math.min(width, height) / 2 - 40;

      const g = svg
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

      const pie = d3.pie<DataPoint>()
        .value(d => d.value)
        .sort(null);

      const arc = d3.arc<d3.PieArcDatum<DataPoint>>()
        .innerRadius(0)
        .outerRadius(radius);

      const outerArc = d3.arc<d3.PieArcDatum<DataPoint>>()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 0.9);

      const labelArc = d3.arc<d3.PieArcDatum<DataPoint>>()
        .innerRadius(radius + 20)
        .outerRadius(radius + 20);

      const arcs = g.selectAll(".arc")
        .data(pie(visualizationData.pieChart))
        .enter()
        .append("g")
        .attr("class", "arc");

      // Add pie slices
      arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => d.data.color || colorPalette[0])
        .style("opacity", 0.8)
        .style("cursor", "pointer")
        .style("stroke", "#fff")
        .style("stroke-width", 2)
        .on("mouseover", function(event, d) {
          d3.select(this).style("opacity", 1);
          
          // Show tooltip
          const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.9)")
            .style("color", "white")
            .style("padding", "10px 15px")
            .style("border-radius", "8px")
            .style("font-size", "13px")
            .style("pointer-events", "none")
            .style("z-index", "1000")
            .style("opacity", 0)
            .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)");

          tooltip.transition().duration(200).style("opacity", 1);
          tooltip.html(`
            <div style="font-weight: bold; margin-bottom: 4px;">${d.data.label}</div>
            <div>Value: ${d.data.value.toFixed(1)}%</div>
            <div>Angle: ${((d.endAngle - d.startAngle) * 180 / Math.PI).toFixed(1)}°</div>
          `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
          d3.select(this).style("opacity", 0.8);
          d3.selectAll(".tooltip").remove();
        });

      // Add percentage labels on slices
      arcs.append("text")
        .attr("transform", d => {
          const pos = arc.centroid(d);
          return `translate(${pos[0]}, ${pos[1]})`;
        })
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "white")
        .style("font-weight", "bold")
        .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.5)")
        .text(d => {
          const percentage = ((d.endAngle - d.startAngle) / (2 * Math.PI) * 100).toFixed(1);
          return percentage + '%';
        });

      // Add legend labels
      arcs.append("text")
        .attr("transform", d => {
          const pos = labelArc.centroid(d);
          return `translate(${pos[0]}, ${pos[1]})`;
        })
        .attr("text-anchor", d => {
          const pos = labelArc.centroid(d);
          return pos[0] > 0 ? "start" : "end";
        })
        .style("font-size", "11px")
        .style("fill", "white")
        .style("font-weight", "500")
        .text(d => d.data.label);

      // Add chart title
      g.append("text")
        .attr("transform", `translate(0, -${radius + 30})`)
        .style("text-anchor", "middle")
        .style("fill", "white")
        .style("font-size", "16px")
        .style("font-weight", "700")
        .text("Data Distribution");
    }
  }, [activeTab, visualizationData.pieChart]);

  // Create bar chart with enhanced features
  useEffect(() => {
    if (activeTab === 'bar' && visualizationData.barChart && barRef.current) {
      const svg = d3.select(barRef.current);
      svg.selectAll("*").remove();

      const width = 600;
      const height = 400;
      const margin = { top: 40, right: 40, bottom: 80, left: 80 };

      const g = svg
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

      // Create scales
      const xScale = d3.scaleBand()
        .domain(visualizationData.barChart.map(d => d.label))
        .range([0, width - margin.left - margin.right])
        .padding(0.1);

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(visualizationData.barChart, d => d.value) || 0])
        .range([height - margin.top - margin.bottom, 0]);

      // Add bars with enhanced styling
      g.selectAll(".bar")
        .data(visualizationData.barChart)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.label) || 0)
        .attr("width", xScale.bandwidth())
        .attr("y", d => yScale(d.value))
        .attr("height", d => height - margin.top - margin.bottom - yScale(d.value))
        .attr("fill", d => d.color || colorPalette[0])
        .style("opacity", 0.8)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
          d3.select(this).style("opacity", 1);
          
          const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.9)")
            .style("color", "white")
            .style("padding", "10px 15px")
            .style("border-radius", "8px")
            .style("font-size", "13px")
            .style("pointer-events", "none")
            .style("z-index", "1000")
            .style("opacity", 0)
            .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)");

          tooltip.transition().duration(200).style("opacity", 1);
          tooltip.html(`
            <div style="font-weight: bold; margin-bottom: 4px;">${d.label}</div>
            <div>Value: ${d.value.toLocaleString()}</div>
          `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
          d3.select(this).style("opacity", 0.8);
          d3.selectAll(".tooltip").remove();
        });

      // Add value labels on top of bars
      g.selectAll(".bar-label")
        .data(visualizationData.barChart)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", d => (xScale(d.label) || 0) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.value) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "white")
        .style("font-weight", "500")
        .text(d => {
          if (d.value >= 1000000) {
            return (d.value / 1000000).toFixed(1) + 'M';
          } else if (d.value >= 1000) {
            return (d.value / 1000).toFixed(1) + 'K';
          } else {
            return d.value.toString();
          }
        });

      // Add x-axis with labels
      g.append("g")
        .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("fill", "white")
        .style("font-size", "12px")
        .style("font-weight", "500")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

      // Add y-axis with labels
      g.append("g")
        .call(d3.axisLeft(yScale).tickFormat(d3.format(".2s")))
        .selectAll("text")
        .style("fill", "white")
        .style("font-size", "12px")
        .style("font-weight", "500");

      // Add axis labels
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height - margin.top - margin.bottom) / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("fill", "white")
        .style("font-size", "14px")
        .style("font-weight", "600")
        .text("Values");

      g.append("text")
        .attr("transform", `translate(${(width - margin.left - margin.right) / 2}, ${height - margin.top - margin.bottom + 50})`)
        .style("text-anchor", "middle")
        .style("fill", "white")
        .style("font-size", "14px")
        .style("font-weight", "600")
        .text("Categories");

      // Add chart title
      g.append("text")
        .attr("transform", `translate(${(width - margin.left - margin.right) / 2}, -10)`)
        .style("text-anchor", "middle")
        .style("fill", "white")
        .style("font-size", "16px")
        .style("font-weight", "700")
        .text("Data Comparison Chart");
    }
  }, [activeTab, visualizationData.barChart]);

  const exportData = () => {
    const exportData = {
      pieChart: visualizationData.pieChart,
      barChart: visualizationData.barChart,
      table: visualizationData.table,
      originalData: data
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'visualization-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyData = () => {
    const textData = `Pie Chart Data:\n${JSON.stringify(visualizationData.pieChart, null, 2)}\n\nBar Chart Data:\n${JSON.stringify(visualizationData.barChart, null, 2)}\n\nTable Data:\n${JSON.stringify(visualizationData.table, null, 2)}`;
    navigator.clipboard.writeText(textData);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white/10 border border-white/20 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            <span className="text-white">Processing data for visualization...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white/10 border border-white/20 rounded-2xl p-8 backdrop-blur-sm max-w-md">
          <div className="text-center">
            <div className="text-red-400 text-lg mb-4">⚠️ Error</div>
            <p className="text-white/80 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white/10 border border-white/20 rounded-2xl backdrop-blur-sm w-full max-w-6xl max-h-[90vh] overflow-hidden pointer-events-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Data Visualization</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={copyData}
              className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
              title="Copy data"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={exportData}
              className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
              title="Export data"
            >
              <Download className="w-4 h-4" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10">
          {visualizationData.pieChart && (
            <button
              onClick={() => setActiveTab('pie')}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'pie'
                  ? 'text-white border-b-2 border-blue-400 bg-white/5'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <PieChart className="w-4 h-4" />
              Pie Chart
            </button>
          )}
          {visualizationData.barChart && (
            <button
              onClick={() => setActiveTab('bar')}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'bar'
                  ? 'text-white border-b-2 border-blue-400 bg-white/5'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Bar Chart
            </button>
          )}
          {visualizationData.table && (
            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'table'
                  ? 'text-white border-b-2 border-blue-400 bg-white/5'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Table className="w-4 h-4" />
              Table
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[70vh]">
          <AnimatePresence mode="wait">
            {activeTab === 'pie' && visualizationData.pieChart && (
              <motion.div
                key="pie"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Data Distribution</h3>
                <svg ref={pieRef} className="w-full max-w-lg"></svg>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm max-w-md">
                  {visualizationData.pieChart.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{item.label}</div>
                        <div className="text-white/70 text-xs">{item.value.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'bar' && visualizationData.barChart && (
              <motion.div
                key="bar"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Metrics Comparison</h3>
                <svg ref={barRef} className="w-full"></svg>
              </motion.div>
            )}

            {activeTab === 'table' && visualizationData.table && (
              <motion.div
                key="table"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Data Table</h3>
                <div className="overflow-x-auto max-w-full border border-white/10 rounded-lg bg-white/5">
                  <div className="min-w-full">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-white/20 bg-white/10">
                          {Object.keys(visualizationData.table[0] || {}).map((header, index) => (
                            <th
                              key={index}
                              className="text-left py-4 px-4 text-white font-semibold text-sm"
                              style={{ minWidth: '150px' }}
                            >
                              <div className="flex items-center gap-2">
                                <span>{header}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {visualizationData.table.map((row, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className="border-b border-white/10 hover:bg-white/10 transition-colors"
                          >
                            {Object.values(row).map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="py-4 px-4 text-white/80 text-sm"
                                style={{ minWidth: '150px' }}
                              >
                                <div className="break-words">
                                  {String(cell)}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/60">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Rows:</span>
                    <span className="px-2 py-1 bg-white/10 rounded">{visualizationData.table.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Columns:</span>
                    <span className="px-2 py-1 bg-white/10 rounded">{Object.keys(visualizationData.table[0] || {}).length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Columns:</span>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(visualizationData.table[0] || {}).map((col, index) => (
                        <span key={index} className="px-2 py-1 bg-white/10 rounded text-white/70 text-xs">
                        {col}
                      </span>
                    ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};