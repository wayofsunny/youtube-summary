"use client";

import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ExpandableDocsSidebar } from "@/components/ui/expandable-docs-sidebar";

export default function MarketAnalysisLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#030303]">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />

      <div className="relative z-10 flex min-h-screen">
        {/* Left Sidebar - Extreme Left */}
        <div className="w-80 flex-shrink-0">
          <ExpandableDocsSidebar 
            currentPage={
              pathname.includes('/youtube') ? 'youtube' : 
              pathname.includes('/article') ? 'article' : 
              pathname.includes('/linkedin') ? 'linkedin' : 
              'youtube'
            }
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-8 pb-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-purple-100 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center gap-3">
              <BarChart3 className="w-10 h-10 text-white" />
              <span>Market Analysis</span>
            </h1>

            <div className="flex justify-center gap-6 mt-8">
              <Link href="/market_analysis/youtube" className={`px-4 py-2 rounded-lg ${isActive("/market_analysis/youtube") ? "bg-indigo-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>YouTube Summarizer</Link>
              <Link href="/market_analysis/article" className={`px-4 py-2 rounded-lg ${isActive("/market_analysis/article") ? "bg-indigo-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>Article Analysis</Link>
              <Link href="/market_analysis/linkedin" className={`px-4 py-2 rounded-lg ${isActive("/market_analysis/linkedin") ? "bg-indigo-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>LinkedIn</Link>
            </div>
          </div>

          {/* Page Content */}
          <div className="flex-1 px-8 pb-8">
            <div className="bg-white/5 rounded-2xl p-6 text-gray-200">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


