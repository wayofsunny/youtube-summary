"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, PieChart, Table, Edit3, RotateCcw, MoreHorizontal } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

interface VizBlockProps {
  id: string;
  type: 'bar' | 'pie' | 'line' | 'area' | 'table';
  title: string;
  data: any[];
  spec?: any;
  originalText: string;
  onEdit: (id: string) => void;
  onConvert: (id: string, newType: string) => void;
  onRestore: (id: string) => void;
}

const colorPalette = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

export const VizBlock: React.FC<VizBlockProps> = ({
  id,
  type,
  title,
  data,
  spec,
  originalText,
  onEdit,
  onConvert,
  onRestore
}) => {
  const [showToolbar, setShowToolbar] = useState(false);

  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-400">
          No data available
        </div>
      );
    }

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="label" 
                stroke="#9CA3AF"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colorPalette[index % colorPalette.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="label" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="label" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#3B82F6" 
                fill="#3B82F6"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'table':
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-600">
                  {Object.keys(data[0] || {}).map((key) => (
                    <th key={key} className="text-left py-2 px-3 text-gray-300 font-medium">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index} className="border-b border-gray-700">
                    {Object.values(row).map((value, cellIndex) => (
                      <td key={cellIndex} className="py-2 px-3 text-gray-200">
                        {String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return (
          <div className="h-64 flex items-center justify-center text-gray-400">
            Unsupported chart type: {type}
          </div>
        );
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'bar': return <BarChart3 className="w-4 h-4" />;
      case 'pie': return <PieChart className="w-4 h-4" />;
      case 'table': return <Table className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 border border-gray-600 rounded-lg p-4 my-4 relative group"
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {getIcon()}
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        
        {/* Mini Toolbar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showToolbar ? 1 : 0 }}
          className="flex items-center space-x-1"
        >
          <button
            onClick={() => onEdit(id)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Edit Spec"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onConvert(id, type === 'bar' ? 'pie' : 'bar')}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Convert to Table"
          >
            <Table className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onRestore(id)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Restore Text"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </motion.div>
      </div>

      {/* Chart/Table Content */}
      <div className="bg-gray-700 rounded-lg p-4">
        {renderChart()}
      </div>

      {/* Caption */}
      <div className="mt-3 text-sm text-gray-400">
        Generated from: "{originalText.substring(0, 100)}{originalText.length > 100 ? '...' : ''}"
      </div>
    </motion.div>
  );
};
