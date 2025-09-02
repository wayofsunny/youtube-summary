"use client";

import React, { useState } from 'react';
import Recommendations from '@/components/ui/recommendations';

export default function RecommendationsDemo() {
  const [query, setQuery] = useState<string>('');
  const [selectedQuery, setSelectedQuery] = useState<string>('');
  const [useCase, setUseCase] = useState<'people' | 'recruiting' | 'sales' | 'investor' | 'company'>('people');
  const [enableWebFilters, setEnableWebFilters] = useState<boolean>(false);
  const [enableCompanySearch, setEnableCompanySearch] = useState<boolean>(true);

  // Mock context data for demonstration
  const mockContext = {
    source: 'demo',
    items: [
      {
        name: 'John Smith',
        currentJob: 'Senior Engineer at Google',
        titleSummary: 'Software Engineer',
        education: 'Stanford University'
      },
      {
        name: 'Sarah Johnson',
        currentJob: 'Product Manager at Microsoft',
        titleSummary: 'Product Manager',
        education: 'MIT'
      },
      {
        name: 'Mike Chen',
        currentJob: 'CTO at StartupXYZ',
        titleSummary: 'Chief Technology Officer',
        education: 'UC Berkeley'
      }
    ]
  };

  const handleQueryPick = (pickedQuery: string) => {
    setSelectedQuery(pickedQuery);
    setQuery(pickedQuery);
    console.log('Selected query:', pickedQuery);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Enhanced Recommendations with Company Search
          </h1>
          <p className="text-xl text-white/80">
            Experience the power of intelligent search suggestions combined with company database autocomplete
          </p>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Configuration</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Use Case</label>
              <select
                value={useCase}
                onChange={(e) => setUseCase(e.target.value as any)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="people">People</option>
                <option value="recruiting">Recruiting</option>
                <option value="sales">Sales</option>
                <option value="investor">Investor</option>
                <option value="company">Company</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Web Filters</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={enableWebFilters}
                  onChange={(e) => setEnableWebFilters(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                />
                <span className="ml-2 text-white/80">Enable site: filters</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Company Search</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={enableCompanySearch}
                  onChange={(e) => setEnableCompanySearch(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                />
                <span className="ml-2 text-white/80">Enable company search</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Current Query</label>
              <div className="text-white font-mono text-sm bg-white/10 px-3 py-2 rounded-lg">
                {query || 'None'}
              </div>
            </div>
          </div>
        </div>

        {/* Search Interface */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Search & Recommendations</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/80 mb-2">
              Start typing to see recommendations (min 2 characters)
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try: 'John', 'Engineer', 'Google', 'Startup'..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Enhanced Recommendations Component */}
          {query.length >= 2 && (
            <Recommendations
              seedQuery={query}
              context={mockContext}
              onPick={handleQueryPick}
              useCase={useCase}
              enableWebFilters={enableWebFilters}
              enableCompanySearch={enableCompanySearch}
            />
          )}
        </div>

        {/* Results Display */}
        {selectedQuery && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Selected Query</h2>
            
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white/80 text-sm">Last Selected</span>
              </div>
              
              <div className="text-2xl font-mono text-white bg-white/10 px-4 py-3 rounded-lg">
                "{selectedQuery}"
              </div>
              
              <div className="mt-4 text-white/60 text-sm">
                This query would be used to perform a search with the selected parameters and company information.
              </div>
            </div>
          </div>
        )}

        {/* Feature Highlights */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 mt-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Key Features</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-medium text-white">Smart Recommendations</h3>
                  <p className="text-white/60 text-sm">AI-powered suggestions based on context and use case</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-medium text-white">Company Database</h3>
                  <p className="text-white/60 text-sm">Search through thousands of companies with autocomplete</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-medium text-white">Use Case Templates</h3>
                  <p className="text-white/60 text-sm">Specialized suggestions for recruiting, sales, investing, etc.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-medium text-white">Keyboard Navigation</h3>
                  <p className="text-white/60 text-sm">Full keyboard support with arrow keys and Enter</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 text-center">
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-3">How to Use</h3>
            <div className="text-white/70 space-y-2 text-sm">
              <p>1. Type in the search box to see intelligent recommendations</p>
              <p>2. Click "🔍 Search company database..." to access company search</p>
              <p>3. Use arrow keys to navigate suggestions</p>
              <p>4. Press Enter to select a recommendation</p>
              <p>5. Experiment with different use cases and settings</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
