"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, PieChart, Table, X, Loader2, TrendingUp } from 'lucide-react';
// import Plot from 'plotly.js-dist-min';

interface VisualizationData {
  pieChart?: Array<{ label: string; value: number }>;
  barChart?: Array<{ label: string; value: number }>;
  table?: Array<Record<string, any>>;
}

interface InlineDataVisualizationProps {
  content: string;
  onClose?: () => void;
}

export const InlineDataVisualization: React.FC<InlineDataVisualizationProps> = ({ content, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [visualizationData, setVisualizationData] = useState<VisualizationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pie' | 'bar' | 'table'>('pie');
  
  console.log('InlineDataVisualization rendered with content:', content?.substring(0, 100) + '...');
  
  const pieRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const colorPalette = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  const generateVisualizationData = async (text: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/visualize-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: text }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate visualization data');
      }

      const data = await response.json();
      setVisualizationData(data);
    } catch (err) {
      console.error('Error generating visualization data:', err);
      setError('Failed to generate visualization data');
      
      // Fallback: create sample data
      setVisualizationData({
        pieChart: [
          { label: 'Market Share', value: 35 },
          { label: 'Competition', value: 25 },
          { label: 'New Entrants', value: 20 },
          { label: 'Others', value: 20 }
        ],
        barChart: [
          { label: 'Revenue', value: 5000000 },
          { label: 'Growth', value: 25 },
          { label: 'Customers', value: 10000 },
          { label: 'Market Size', value: 100000000 }
        ],
        table: [
          { Metric: 'Total Addressable Market', Value: '$100B', Details: 'Global market size' },
          { Metric: 'Serviceable Market', Value: '$10B', Details: 'Addressable segment' },
          { Metric: 'Market Growth Rate', Value: '15%', Details: 'Annual growth' }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (content) {
      generateVisualizationData(content);
    }
  }, [content]);

  // Simple chart rendering without Plotly for now
  useEffect(() => {
    console.log('Chart rendering effect triggered:', { 
      hasPieChart: !!visualizationData?.pieChart, 
      hasBarChart: !!visualizationData?.barChart,
      activeTab 
    });
  }, [visualizationData, activeTab]);

  // Always show something for testing
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-white/5 border border-white/10 rounded-lg p-4 mt-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Data Visualization (Test)
        </h4>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="text-white">
        <p>Content received: {content?.substring(0, 100)}...</p>
        <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
        <p>Error: {error || 'None'}</p>
        <p>Has visualization data: {visualizationData ? 'Yes' : 'No'}</p>
        {visualizationData && (
          <div>
            <p>Pie chart items: {visualizationData.pieChart?.length || 0}</p>
            <p>Bar chart items: {visualizationData.barChart?.length || 0}</p>
            <p>Table rows: {visualizationData.table?.length || 0}</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="bg-white/5 border border-white/10 rounded-lg p-4 mt-4"
      >
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            <span className="text-white">Generating visualizations...</span>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error && !visualizationData) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mt-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <X className="w-4 h-4 text-red-400" />
            <span className="text-red-300">Failed to generate visualizations</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  if (!visualizationData) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-white/5 border border-white/10 rounded-lg p-4 mt-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Data Visualization
        </h4>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4">
        {visualizationData.pieChart && (
          <button
            onClick={() => setActiveTab('pie')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'pie'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
            }`}
          >
            <PieChart className="w-4 h-4" />
            Pie Chart
          </button>
        )}
        {visualizationData.barChart && (
          <button
            onClick={() => setActiveTab('bar')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'bar'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Bar Chart
          </button>
        )}
        {visualizationData.table && (
          <button
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'table'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
            }`}
          >
            <Table className="w-4 h-4" />
            Table
          </button>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'pie' && visualizationData.pieChart && (
          <motion.div
            key="pie"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full"
          >
            <div className="w-full h-96 flex items-center justify-center">
              <div className="text-white">
                <h4 className="text-lg font-semibold mb-4">Pie Chart Data</h4>
                <div className="space-y-2">
                  {visualizationData.pieChart.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: colorPalette[index % colorPalette.length] }}
                      />
                      <span className="text-sm">{item.label}: {item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'bar' && visualizationData.barChart && (
          <motion.div
            key="bar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full"
          >
            <div className="w-full h-96 flex items-center justify-center">
              <div className="text-white">
                <h4 className="text-lg font-semibold mb-4">Bar Chart Data</h4>
                <div className="space-y-2">
                  {visualizationData.barChart.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: colorPalette[index % colorPalette.length] }}
                      />
                      <span className="text-sm">{item.label}: {item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/20">
                    {Object.keys(visualizationData.table[0] || {}).map((header, index) => (
                      <th
                        key={index}
                        className="text-left py-3 px-4 text-white/80 font-medium"
                      >
                        {header}
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
                          className="py-3 px-4 text-white/70 text-sm"
                        >
                          {String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
