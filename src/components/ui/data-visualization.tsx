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
  const [activeTab, setActiveTab] = useState<'pie' | 'bar' | 'table'>('pie');
  const [visualizationData, setVisualizationData] = useState<VisualizationData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const pieRef = useRef<SVGSVGElement>(null);
  const barRef = useRef<SVGSVGElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Color palette for visualizations
  const colorPalette = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  // Parse data and extract structured information
  useEffect(() => {
    const parseData = () => {
      try {
        setIsLoading(true);
        setError(null);

        const lines = data.split('\n').filter(line => line.trim());
        const parsedData: VisualizationData = {};

        // Extract pie chart data (percentages, market share, etc.)
        const pieData: DataPoint[] = [];
        const barData: DataPoint[] = [];
        const tableData: Array<Record<string, any>> = [];
        const allColumns = new Set<string>();

        // First pass: identify all possible column headers
        lines.forEach((line) => {
          if (line.includes('|')) {
            const columns = line.split('|').map(col => col.trim()).filter(col => col);
            columns.forEach((col, index) => {
              if (index === 0) {
                allColumns.add('Metric');
              } else if (index === 1) {
                allColumns.add('Value');
              } else {
                allColumns.add(`Column ${index + 1}`);
              }
            });
          }
        });

        // Look for percentage patterns
        lines.forEach((line, index) => {
          const percentageMatch = line.match(/([^:]+):\s*(\d+(?:\.\d+)?)%/);
          if (percentageMatch) {
            const label = percentageMatch[1].trim();
            const value = parseFloat(percentageMatch[2]);
            if (value > 0) {
              pieData.push({
                label,
                value,
                color: colorPalette[pieData.length % colorPalette.length]
              });
            }
          }

          // Look for numerical data patterns
          const numberMatch = line.match(/([^:]+):\s*\$?(\d+(?:,\d{3})*(?:\.\d+)?[BMK]?)/);
          if (numberMatch) {
            const label = numberMatch[1].trim();
            let value = numberMatch[2].replace(/,/g, '');
            
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

          // Look for table-like patterns
          if (line.includes('|') || (line.includes(':') && line.includes(','))) {
            const tableRow: Record<string, any> = {};
            
            if (line.includes('|')) {
              const columns = line.split('|').map(col => col.trim()).filter(col => col);
              if (columns.length >= 2) {
                // Dynamically create columns based on data
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
            } else {
              const parts = line.split(':');
              if (parts.length >= 2) {
                tableRow['Metric'] = parts[0].trim();
                tableRow['Value'] = parts[1].trim();
                tableData.push(tableRow);
              }
            }
          }

          // Also look for other structured patterns
          if (line.includes(' - ') && !line.includes('|')) {
            const parts = line.split(' - ');
            if (parts.length >= 2) {
              const tableRow: Record<string, any> = {
                'Metric': parts[0].trim(),
                'Value': parts[1].trim()
              };
              tableData.push(tableRow);
            }
          }

          // Look for bullet point patterns
          if (line.includes('•') && line.includes(':')) {
            const cleanLine = line.replace('•', '').trim();
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

        // If no structured data found, create sample data
        if (pieData.length === 0 && barData.length === 0 && tableData.length === 0) {
          // Create sample data based on common business metrics
          parsedData.pieChart = [
            { label: 'Market Share', value: 35, color: colorPalette[0] },
            { label: 'Competition', value: 25, color: colorPalette[1] },
            { label: 'New Entrants', value: 20, color: colorPalette[2] },
            { label: 'Others', value: 20, color: colorPalette[3] }
          ];
          
          parsedData.barChart = [
            { label: 'Revenue', value: 5000000, color: colorPalette[0] },
            { label: 'Growth', value: 25, color: colorPalette[1] },
            { label: 'Customers', value: 10000, color: colorPalette[2] },
            { label: 'Market Size', value: 100000000, color: colorPalette[3] }
          ];
          
          parsedData.table = [
            { Metric: 'Total Addressable Market', Value: '$100B', Details: 'Global market size' },
            { Metric: 'Serviceable Market', Value: '$10B', Details: 'Addressable segment' },
            { Metric: 'Market Growth Rate', Value: '15%', Details: 'Annual growth' }
          ];
        } else {
          if (pieData.length > 0) parsedData.pieChart = pieData;
          if (barData.length > 0) parsedData.barChart = barData;
          if (tableData.length > 0) parsedData.table = tableData;
        }

        setVisualizationData(parsedData);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to parse data for visualization');
        setIsLoading(false);
      }
    };

    parseData();
  }, [data]);

  // Create pie chart
  useEffect(() => {
    if (activeTab === 'pie' && visualizationData.pieChart && pieRef.current) {
      const svg = d3.select(pieRef.current);
      svg.selectAll("*").remove();

      const width = 400;
      const height = 400;
      const radius = Math.min(width, height) / 2 - 20;

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

      const arcs = g.selectAll(".arc")
        .data(pie(visualizationData.pieChart))
        .enter()
        .append("g")
        .attr("class", "arc");

      arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => d.data.color || colorPalette[0])
        .style("opacity", 0.8)
        .on("mouseover", function(event, d) {
          d3.select(this).style("opacity", 1);
          
          // Show tooltip
          const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "white")
            .style("padding", "8px 12px")
            .style("border-radius", "6px")
            .style("font-size", "12px")
            .style("pointer-events", "none")
            .style("z-index", "1000")
            .style("opacity", 0);

          tooltip.transition().duration(200).style("opacity", 1);
          tooltip.html(`
            <strong>${d.data.label}</strong><br/>
            Value: ${d.data.value}${d.data.value <= 100 ? '%' : ''}
          `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
          d3.select(this).style("opacity", 0.8);
          d3.selectAll(".tooltip").remove();
        });

      // Add labels
      arcs.append("text")
        .attr("transform", d => {
          const pos = outerArc.centroid(d);
          return `translate(${pos[0]}, ${pos[1]})`;
        })
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "white")
        .text(d => d.data.value + (d.data.value <= 100 ? '%' : ''));
    }
  }, [activeTab, visualizationData.pieChart]);

  // Create bar chart
  useEffect(() => {
    if (activeTab === 'bar' && visualizationData.barChart && barRef.current) {
      const svg = d3.select(barRef.current);
      svg.selectAll("*").remove();

      const width = 500;
      const height = 300;
      const margin = { top: 20, right: 30, bottom: 40, left: 60 };

      const g = svg
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

      const xScale = d3.scaleBand()
        .domain(visualizationData.barChart.map(d => d.label))
        .range([0, width - margin.left - margin.right])
        .padding(0.1);

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(visualizationData.barChart, d => d.value) || 0])
        .range([height - margin.top - margin.bottom, 0]);

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
        .on("mouseover", function(event, d) {
          d3.select(this).style("opacity", 1);
          
          const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "white")
            .style("padding", "8px 12px")
            .style("border-radius", "6px")
            .style("font-size", "12px")
            .style("pointer-events", "none")
            .style("z-index", "1000")
            .style("opacity", 0);

          tooltip.transition().duration(200).style("opacity", 1);
          tooltip.html(`
            <strong>${d.label}</strong><br/>
            Value: ${d.value.toLocaleString()}
          `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
          d3.select(this).style("opacity", 0.8);
          d3.selectAll(".tooltip").remove();
        });

      // Add x-axis
      g.append("g")
        .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("fill", "white")
        .style("font-size", "12px");

      // Add y-axis
      g.append("g")
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .style("fill", "white")
        .style("font-size", "12px");
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white/10 border border-white/20 rounded-2xl backdrop-blur-sm w-full max-w-6xl max-h-[95vh] overflow-hidden"
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
                <h3 className="text-lg font-semibold text-white mb-4">Market Distribution</h3>
                <svg ref={pieRef} className="w-full max-w-md"></svg>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  {visualizationData.pieChart.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-white/80">{item.label}: {item.value}{item.value <= 100 ? '%' : ''}</span>
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
                <div className="overflow-x-auto max-w-full border border-white/10 rounded-lg">
                  <div className="min-w-full">
                    <table className="w-full border-collapse table-fixed" style={{ minWidth: '800px' }}>
                      <thead>
                        <tr className="border-b border-white/20">
                          {Object.keys(visualizationData.table[0] || {}).map((header, index) => (
                            <th
                              key={index}
                              className="text-left py-3 px-2 text-white/80 font-medium whitespace-nowrap"
                              style={{ 
                                width: `${Math.max(150, 100 / Object.keys(visualizationData.table?.[0] || {}).length)}%`,
                                minWidth: '120px'
                              }}
                            >
                              <div className="truncate" title={header}>
                                {header}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {visualizationData.table.map((row, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className="border-b border-white/10 hover:bg-white/5 transition-colors"
                          >
                            {Object.values(row).map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="py-3 px-2 text-white/70 text-sm"
                                style={{ 
                                  width: `${Math.max(150, 100 / Object.keys(visualizationData.table?.[0] || {}).length)}%`,
                                  minWidth: '120px'
                                }}
                              >
                                <div 
                                  className="truncate" 
                                  title={String(cell)}
                                >
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
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/50">
                  <div>Rows: {visualizationData.table.length}</div>
                  <div>Columns: {Object.keys(visualizationData.table[0] || {}).length}</div>
                  <div className="flex flex-wrap gap-1">
                    <span>Columns:</span>
                    {Object.keys(visualizationData.table[0] || {}).map((col, index) => (
                      <span key={index} className="px-2 py-1 bg-white/10 rounded text-white/70">
                        {col}
                      </span>
                    ))}
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
