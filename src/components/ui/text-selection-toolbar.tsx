"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Lightbulb, X, Loader2 } from 'lucide-react';

interface TextSelection {
  text: string;
  startOffset: number;
  endOffset: number;
  rect: DOMRect;
}

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

interface TextSelectionToolbarProps {
  onAnalyze: (selection: TextSelection) => Promise<Suggestion[]>;
  onInsert: (suggestion: Suggestion, originalText: string) => void;
}

export const TextSelectionToolbar: React.FC<TextSelectionToolbarProps> = ({
  onAnalyze,
  onInsert
}) => {
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const toolbarRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Handle text selection
  useEffect(() => {
    const handleSelection = () => {
      const windowSelection = window.getSelection();
      
      console.log('Selection changed:', {
        hasSelection: !!windowSelection,
        isCollapsed: windowSelection?.isCollapsed,
        selectedText: windowSelection?.toString()
      });
      
      if (!windowSelection || windowSelection.isCollapsed) {
        console.log('No selection or collapsed, clearing state');
        setSelection(null);
        setShowSuggestions(false);
        setSuggestions([]);
        return;
      }

      const selectedText = windowSelection.toString().trim();
      console.log('Selected text:', selectedText, 'Length:', selectedText.length);
      
      if (selectedText.length < 10) {
        console.log('Text too short, clearing state');
        setSelection(null);
        setShowSuggestions(false);
        setSuggestions([]);
        return;
      }

      const range = windowSelection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      console.log('Selection rect:', rect);
      
      setSelection({
        text: selectedText,
        startOffset: range.startOffset,
        endOffset: range.endOffset,
        rect: rect
      });
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

  // Position toolbar
  useEffect(() => {
    if (selection && toolbarRef.current) {
      const toolbar = toolbarRef.current;
      const { rect } = selection;
      
      console.log('Positioning toolbar for rect:', rect);
      
      // Position above selection
      toolbar.style.position = 'fixed';
      toolbar.style.left = `${Math.max(10, rect.left + rect.width / 2 - 150)}px`; // Center with min left margin
      toolbar.style.top = `${Math.max(10, rect.top - 60)}px`; // Above selection with min top margin
      toolbar.style.zIndex = '9999';
      toolbar.style.pointerEvents = 'auto';
      
      console.log('Toolbar positioned at:', {
        left: toolbar.style.left,
        top: toolbar.style.top
      });
    }
  }, [selection]);

  // Position suggestions panel
  useEffect(() => {
    if (showSuggestions && suggestionsRef.current && selection) {
      const panel = suggestionsRef.current;
      const { rect } = selection;
      
      // Position to the right of selection
      panel.style.position = 'fixed';
      panel.style.left = `${rect.right + 20}px`;
      panel.style.top = `${rect.top}px`;
      panel.style.zIndex = '1001';
    }
  }, [showSuggestions, selection]);

  const handleVisualize = async () => {
    if (!selection) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await onAnalyze(selection);
      setSuggestions(result);
      setShowSuggestions(true);
    } catch (err) {
      setError('Failed to analyze selection');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRecommend = async () => {
    if (!selection) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await onAnalyze(selection);
      setSuggestions(result);
      setShowSuggestions(true);
    } catch (err) {
      setError('Failed to analyze selection');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleInsert = (suggestion: Suggestion) => {
    if (!selection) return;
    
    onInsert(suggestion, selection.text);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelection(null);
    
    // Clear selection
    window.getSelection()?.removeAllRanges();
  };

  const handleCancel = () => {
    setSelection(null);
    setShowSuggestions(false);
    setSuggestions([]);
    setError(null);
    window.getSelection()?.removeAllRanges();
  };

  console.log('TextSelectionToolbar render:', { 
    hasSelection: !!selection, 
    showSuggestions, 
    isAnalyzing 
  });

  if (!selection) return null;

  return (
    <>
      {/* Floating Toolbar */}
      <AnimatePresence>
        {selection && !showSuggestions && (
          <motion.div
            ref={toolbarRef}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-2 flex items-center space-x-2"
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
              onClick={handleCancel}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors text-sm"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions Panel */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            className="bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-4 w-96 max-h-96 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Suggestions</h3>
              <button
                onClick={handleCancel}
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
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onInsert={() => handleInsert(suggestion)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

interface SuggestionCardProps {
  suggestion: Suggestion;
  onInsert: () => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, onInsert }) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
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

      {suggestion.kind === 'visualization' && suggestion.data && (
        <div className="mb-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          
          {showPreview && (
            <div className="mt-2 p-3 bg-gray-600 rounded border">
              <ChartPreview data={suggestion.data} spec={suggestion.spec} />
            </div>
          )}
        </div>
      )}

      {suggestion.kind === 'rewrite' && suggestion.replacement && (
        <div className="mb-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          
          {showPreview && (
            <div className="mt-2 p-3 bg-gray-600 rounded border">
              <div className="text-gray-200 text-sm whitespace-pre-wrap">
                {suggestion.replacement}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex space-x-2">
        <button
          onClick={onInsert}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
        >
          Insert
        </button>
        <button className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors">
          Copy Spec
        </button>
        <button className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors">
          More like this
        </button>
      </div>
    </div>
  );
};

interface ChartPreviewProps {
  data: any[];
  spec?: any;
}

const ChartPreview: React.FC<ChartPreviewProps> = ({ data, spec }) => {
  // Simple preview - in real implementation, this would render the actual chart
  return (
    <div className="text-center">
      <div className="text-gray-400 text-sm mb-2">Chart Preview</div>
      <div className="bg-gray-500 h-20 rounded flex items-center justify-center">
        <span className="text-gray-300 text-sm">
          {data.length} data points
        </span>
      </div>
    </div>
  );
};
