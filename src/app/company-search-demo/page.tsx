"use client";

import React, { useState } from 'react';
import SearchBox from '@/components/SearchBox';

export default function CompanySearchDemo() {
  const [selectedCompany, setSelectedCompany] = useState<string>('');

  const handleCompanySelect = (companyName: string) => {
    setSelectedCompany(companyName);
    console.log('Selected company:', companyName);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Company Search Autocomplete
          </h1>
          <p className="text-xl text-gray-600">
            Search through thousands of company names with real-time autocomplete
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Search Companies
          </h2>
          
          <SearchBox
            placeholder="Start typing a company name..."
            onCompanySelect={handleCompanySelect}
            className="mb-6"
          />

          {selectedCompany && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2">Selected Company:</h3>
              <p className="text-blue-800 text-lg">{selectedCompany}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Features
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Real-time Search</h3>
                  <p className="text-gray-600 text-sm">Debounced search with 300ms delay for optimal performance</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Keyboard Navigation</h3>
                  <p className="text-gray-600 text-sm">Use arrow keys, Enter, and Escape for full keyboard support</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Smart Dropdown</h3>
                  <p className="text-gray-600 text-sm">Auto-closes when clicking outside, shows loading states</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Responsive Design</h3>
                  <p className="text-gray-600 text-sm">Built with TailwindCSS for beautiful, modern UI</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500">
            Try searching for companies like "Apple", "Microsoft", "Google", or any other company name
          </p>
        </div>
      </div>
    </div>
  );
}
