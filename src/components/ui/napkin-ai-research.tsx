"use client";

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Lightbulb, X, Loader2 } from 'lucide-react';
import { VizBlock } from './viz-block';

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

interface VizBlockData {
  id: string;
  type: 'bar' | 'pie' | 'line' | 'area' | 'table';
  title: string;
  data: any[];
  spec?: any;
  originalText: string;
  startOffset: number;
  endOffset: number;
}

interface NapkinAIResearchProps {
  content: string;
  className?: string;
}

interface HoverToolbarProps {
  text: string;
  rect: DOMRect;
  onAnalyze: (text: string) => Promise<Suggestion[]>;
  onInsert: (suggestion: Suggestion, originalText: string) => void;
  onClose: () => void;
}

const HoverToolbar: React.FC<HoverToolbarProps> = ({
  text,
  rect,
  onAnalyze,
  onInsert,
  onClose
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVisualize = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await onAnalyze(text);
      setSuggestions(result);
      setShowSuggestions(true);
    } catch (err) {
      setError('Failed to analyze text');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRecommend = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await onAnalyze(text);
      setSuggestions(result);
      setShowSuggestions(true);
    } catch (err) {
      setError('Failed to analyze text');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleInsert = (suggestion: Suggestion) => {
    onInsert(suggestion, text);
    setShowSuggestions(false);
    setSuggestions([]);
    onClose();
  };

  return (
    <>
      {/* Floating Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.9 }}
        className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-2 flex items-center space-x-2 z-[9999]"
        style={{
          left: `${Math.max(10, rect.left + rect.width / 2 - 150)}px`,
          top: `${Math.max(10, rect.top - 60)}px`,
        }}
      >
        <button
          onClick={handleVisualize}
          disabled={isAnalyzing}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white rounded-md transition-colors text-sm"
        >
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <BarChart3 className="w-4 h-4" />
          )}
          <span>Visualize</span>
        </button>
        
        <button
          onClick={handleRecommend}
          disabled={isAnalyzing}
          className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white rounded-md transition-colors text-sm"
        >
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Lightbulb className="w-4 h-4" />
          )}
          <span>Recommend</span>
        </button>
        
        <button
          onClick={onClose}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors text-sm"
        >
          <X className="w-4 h-4" />
          <span>Close</span>
        </button>
      </motion.div>

      {/* Suggestions Panel */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-4 w-96 max-h-96 overflow-y-auto z-[9999]"
            style={{
              left: `${rect.right + 20}px`,
              top: `${rect.top}px`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Suggestions</h3>
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-900 border border-red-600 rounded-md">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-white font-medium">{suggestion.title}</h4>
                      <p className="text-gray-300 text-sm mt-1">{suggestion.rationale}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                        {Math.round(suggestion.confidence * 100)}%
                      </span>
                      <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">
                        {suggestion.kind}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleInsert(suggestion)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
                    >
                      Insert
                    </button>
                    <button className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors">
                      Copy Spec
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const NapkinAIResearch: React.FC<NapkinAIResearchProps> = ({
  content,
  className = ''
}) => {
  const [vizBlocks, setVizBlocks] = useState<VizBlockData[]>([]);
  const [history, setHistory] = useState<Array<{ action: string; data: any }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [hoveredText, setHoveredText] = useState<{ text: string; rect: DOMRect; element: HTMLElement } | null>(null);
  
  const contentRef = useRef<HTMLDivElement>(null);

  // Check for mock mode
  const isMockMode = typeof window !== 'undefined' && 
    new URLSearchParams(window.location.search).get('mock') === '1';

  // Hover detection for text elements
  const handleTextHover = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const text = target.textContent || '';
    
    // Only show toolbar for text with numbers or data
    if (text.length > 20 && (/\d/.test(text) || /\$/.test(text) || /%/.test(text))) {
      const rect = target.getBoundingClientRect();
      setHoveredText({
        text: text.trim(),
        rect: rect,
        element: target
      });
    }
  }, []);

  const handleTextLeave = useCallback(() => {
    setHoveredText(null);
  }, []);

  const analyzeHoveredText = useCallback(async (text: string): Promise<Suggestion[]> => {
    try {
      const url = isMockMode ? '/api/analyze?mock=1' : '/api/analyze';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectionText: text
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const result = await response.json();
      return result.suggestions || [];
    } catch (error) {
      console.error('Analysis error:', error);
      throw error;
    }
  }, [isMockMode]);

  const insertSuggestion = useCallback((suggestion: Suggestion, originalText: string) => {
    const newVizBlock: VizBlockData = {
      id: `viz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: getChartType(suggestion),
      title: suggestion.title,
      data: suggestion.data || [],
      spec: suggestion.spec,
      originalText: originalText,
      startOffset: 0, // Will be set by text selection
      endOffset: originalText.length
    };

    // Add to history
    const historyEntry = {
      action: 'insert',
      data: { vizBlock: newVizBlock, originalText }
    };
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(historyEntry);
      return newHistory.slice(-50); // Keep last 50 actions
    });
    setHistoryIndex(prev => prev + 1);

    setVizBlocks(prev => [...prev, newVizBlock]);
  }, [historyIndex]);

  const getChartType = (suggestion: Suggestion): 'bar' | 'pie' | 'line' | 'area' | 'table' => {
    if (suggestion.kind === 'rewrite') return 'table';
    
    const spec = suggestion.spec;
    if (spec?.type === 'pie') return 'pie';
    if (spec?.type === 'line') return 'line';
    if (spec?.type === 'area') return 'area';
    if (spec?.type === 'table') return 'table';
    
    // Default to bar chart for visualizations
    return 'bar';
  };

  const handleEditVizBlock = useCallback((id: string) => {
    // TODO: Implement edit functionality
    console.log('Edit viz block:', id);
  }, []);

  const handleConvertVizBlock = useCallback((id: string, newType: string) => {
    setVizBlocks(prev => prev.map(block => 
      block.id === id 
        ? { ...block, type: newType as any }
        : block
    ));
  }, []);

  const handleRestoreVizBlock = useCallback((id: string) => {
    // Add to history
    const block = vizBlocks.find(b => b.id === id);
    if (block) {
      const historyEntry = {
        action: 'restore',
        data: { vizBlock: block }
      };
      
      setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(historyEntry);
        return newHistory.slice(-50);
      });
      setHistoryIndex(prev => prev + 1);
    }

    setVizBlocks(prev => prev.filter(block => block.id !== id));
  }, [vizBlocks, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex >= 0) {
      const entry = history[historyIndex];
      
      if (entry.action === 'insert') {
        // Remove the viz block
        setVizBlocks(prev => prev.filter(block => block.id !== entry.data.vizBlock.id));
      } else if (entry.action === 'restore') {
        // Re-add the viz block
        setVizBlocks(prev => [...prev, entry.data.vizBlock]);
      }
      
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const entry = history[historyIndex + 1];
      
      if (entry.action === 'insert') {
        // Re-add the viz block
        setVizBlocks(prev => [...prev, entry.data.vizBlock]);
      } else if (entry.action === 'restore') {
        // Remove the viz block
        setVizBlocks(prev => prev.filter(block => block.id !== entry.data.vizBlock.id));
      }
      
      setHistoryIndex(prev => prev + 1);
    }
  }, [history, historyIndex]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  return (
    <div className={`relative ${className}`}>
      {/* Undo/Redo Controls */}
      <div className="fixed top-4 right-4 z-50 flex space-x-2">
        <button
          onClick={handleUndo}
          disabled={historyIndex < 0}
          className="px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
          title="Undo (Ctrl+Z)"
        >
          ↶ Undo
        </button>
        <button
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1}
          className="px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
          title="Redo (Ctrl+Y)"
        >
          ↷ Redo
        </button>
      </div>

      {/* Mock Mode Indicator */}
      {isMockMode && (
        <div className="fixed top-4 left-4 z-50 bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm">
          🧪 Mock Mode Active
        </div>
      )}

      {/* Debug Hover Indicator */}
      <div className="fixed bottom-4 left-4 z-50 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm">
        🖱️ Hover over text with numbers to see toolbar
      </div>

      {/* Debug Test Button */}
      <button
        onClick={() => {
          console.log('Test hover button clicked');
          setHoveredText({
            text: 'Test hover with funding data: $250M, $180M, $320M',
            rect: new DOMRect(100, 100, 300, 20),
            element: document.createElement('div')
          });
        }}
        className="fixed bottom-4 right-4 z-50 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm"
      >
        🧪 Test Hover
      </button>

      {/* Content Area */}
      <div ref={contentRef} className="relative">
        {/* Original Content */}
        <div className="prose prose-invert max-w-none">
          <div 
            className="text-gray-200 leading-relaxed select-text hover:bg-gray-700/20 transition-colors cursor-pointer"
            style={{ 
              whiteSpace: 'pre-wrap',
              userSelect: 'text',
              WebkitUserSelect: 'text',
              MozUserSelect: 'text',
              msUserSelect: 'text'
            }}
            onMouseEnter={handleTextHover}
            onMouseLeave={handleTextLeave}
          >
            {content}
          </div>
        </div>

        {/* Viz Blocks */}
        <AnimatePresence>
          {vizBlocks.map((block) => (
            <VizBlock
              key={block.id}
              id={block.id}
              type={block.type}
              title={block.title}
              data={block.data}
              spec={block.spec}
              originalText={block.originalText}
              onEdit={handleEditVizBlock}
              onConvert={handleConvertVizBlock}
              onRestore={handleRestoreVizBlock}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Hover-based Floating Toolbar */}
      {hoveredText && (
        <HoverToolbar
          text={hoveredText.text}
          rect={hoveredText.rect}
          onAnalyze={analyzeHoveredText}
          onInsert={insertSuggestion}
          onClose={() => setHoveredText(null)}
        />
      )}
    </div>
  );
};
