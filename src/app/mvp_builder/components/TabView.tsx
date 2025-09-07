import React from 'react';

interface TabViewProps {
  activeTab: 'code' | 'preview';
  onTabChange: (tab: 'code' | 'preview') => void;
  children: React.ReactNode;
}

export function TabView({ activeTab, onTabChange, children }: TabViewProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => onTabChange('code')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'code' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          Code
        </button>
        <button
          onClick={() => onTabChange('preview')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'preview' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          Preview
        </button>
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
