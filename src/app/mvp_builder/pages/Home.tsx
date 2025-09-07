import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, AlertCircle } from 'lucide-react';

export function Home() {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const validatePrompt = (prompt: string): { isValid: boolean; message?: string } => {
    if (!prompt.trim()) {
      return { isValid: false, message: 'Please describe your website idea' };
    }
    
    if (prompt.trim().length < 10) {
      return { isValid: false, message: 'Please provide a more detailed description (at least 10 characters)' };
    }
    
    if (prompt.trim().length > 1000) {
      return { isValid: false, message: 'Description is too long (maximum 1000 characters)' };
    }
    
    return { isValid: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const validation = validatePrompt(prompt);
    if (!validation.isValid) {
      setError(validation.message || 'Invalid input');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate('/builder', { state: { prompt: prompt.trim() } });
    } catch (error) {
      setError('Failed to start builder. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Wand2 className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-100 mb-4">
            Website Builder AI
          </h1>
          <p className="text-lg text-gray-300">
            Describe your dream website, and we'll help you build it step by step
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            {/* Error Display */}
            {error && (
              <div className="mb-4 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              </div>
            )}
            
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  setError(null); // Clear error when user types
                }}
                placeholder="Describe the website you want to build..."
                className={`w-full h-32 p-4 bg-gray-900 text-gray-100 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-500 ${
                  error ? 'border-red-500' : 'border-gray-700'
                }`}
                maxLength={1000}
                disabled={isSubmitting}
              />
              
              {/* Character Counter */}
              <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                {prompt.length}/1000
              </div>
            </div>
            
            <button
              type="submit"
              disabled={!prompt.trim() || isSubmitting || prompt.trim().length < 10}
              className={`w-full mt-4 py-3 px-6 rounded-lg font-medium transition-colors ${
                !prompt.trim() || prompt.trim().length < 10
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : isSubmitting
                  ? 'bg-blue-600 text-gray-100'
                  : 'bg-blue-600 text-gray-100 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Starting Builder...
                </div>
              ) : (
                'Generate Website Plan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}