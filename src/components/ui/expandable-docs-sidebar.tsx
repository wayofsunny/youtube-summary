"use client";

import { useState } from "react";
import { 
  startNewResearch, 
  saveResearchWork, 
  exportResearchResults, 
  shareResearch, 
  generateResearchReport 
} from "@/components/ui/research-notepad";
import { Target, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface ExpandableDocsSidebarProps {
  className?: string;
  currentPage?: "youtube" | "article" | "linkedin" | "ai_researcher";
}

export const ExpandableDocsSidebar = ({ className, currentPage }: ExpandableDocsSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getPageSpecificSections = (): DocSection[] => {
    return [
      {
        id: "quick-actions",
        title: "Quick Actions",
        icon: <Target className="w-4 h-4" />,
        content: (
          <div className="space-y-3 text-sm">
            <div className="space-y-2">
              <button onClick={() => startNewResearch()} className="w-full p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg text-left hover:bg-blue-500/30 transition-colors">
                <p className="text-white/90 font-medium">Start New Research</p>
                <p className="text-white/60 text-xs">Begin a fresh market analysis</p>
              </button>
              <button onClick={() => saveResearchWork()} className="w-full p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg text-left hover:bg-green-500/30 transition-colors">
                <p className="text-white/90 font-medium">Save Current Work</p>
                <p className="text-white/60 text-xs">Store your research progress notebook locally</p>
              </button>
              <button onClick={() => exportResearchResults()} className="w-full p-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg text-left hover:bg-orange-500/30 transition-colors">
                <p className="text-white/90 font-medium">Export Results</p>
                <p className="text-white/60 text-xs">Download your findings notebook</p>
              </button>
              <button onClick={() => shareResearch()} className="w-full p-2 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 rounded-lg text-left hover:bg-indigo-500/30 transition-colors">
                <p className="text-white/90 font-medium">Share Research</p>
                <p className="text-white/60 text-xs">Collaborate with team members using share web api</p>
              </button>
              <button onClick={() => generateResearchReport()} className="w-full p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg text-left hover:bg-purple-500/30 transition-colors">
                <p className="text-white/90 font-medium">Generate Report</p>
                <p className="text-white/60 text-xs">Create comprehensive analysis report</p>
              </button>
            </div>
          </div>
        ),

      },
    ];
  };

  const sections = getPageSpecificSections();

  if (isCollapsed) {
    return (
      <div className="w-16 bg-white/[0.03] border-r border-white/[0.1] backdrop-blur-lg flex flex-col items-center py-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-white/[0.1] rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-white/60" />
        </button>
        <div className="mt-4 space-y-2">
          {sections.slice(0, 3).map((section) => (
            <div
              key={section.id}
              className="p-2 rounded-lg"
              title={section.title}
            >
              <span className="text-white/60">{section.icon}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-80 bg-white/[0.03] border-r border-white/[0.1] backdrop-blur-lg min-h-screen", className)}>
      <div className="p-4 border-b border-white/[0.1]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white/90 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Quick Actions
          </h2>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 hover:bg-white/[0.1] rounded transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {sections.map((section) => (
          <div key={section.id} className="border border-white/[0.05] rounded-lg overflow-hidden">
            <div className="px-3 py-3 flex items-center gap-2">
              <span className="text-white/60">{section.icon}</span>
              <span className="text-white/90 font-medium">{section.title}</span>
            </div>
            
            <div className="px-3 pb-3 border-t border-white/[0.05]">
              {section.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};