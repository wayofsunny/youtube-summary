"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Trash, StickyNote, Share, FileText, Save, Bold, Italic, List, Type, Highlighter, AlignLeft, AlignCenter, AlignRight, BarChart3, PieChart, Table, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";
import { StructuredContentRenderer } from "./structured-content-renderer";
// PDF libraries - will be available after npm install
let jsPDF: any = null;
let html2canvas: any = null;

try {
  jsPDF = require('jspdf').default;
  html2canvas = require('html2canvas').default;
} catch (e) {
  console.log('PDF libraries not installed yet. Using fallback text export.');
}

type ResearchNotepadProps = {
  className?: string;
  storageKey?: string;
};

/**
 * ResearchNotepad
 * - Lightweight, document-like notes panel
 * - Opens via custom window events: `open-research-notepad`, `toggle-research-notepad`
 * - Clears via `new-research` event and supports Export (download txt)
 * - Persists content in localStorage (no backend required)
 */
export function ResearchNotepad({ className, storageKey = "research_notepad_content" }: ResearchNotepadProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isStructuredMode, setIsStructuredMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);

  // Function to create formatted tables
  const createFormattedTable = useCallback((data: Array<Record<string, string>>, headers: string[]): string => {
    if (data.length === 0) return '';
    
    let table = '';
    
    // Create header row
    table += headers.join(' | ') + '\n';
    table += headers.map(() => '---').join(' | ') + '\n';
    
    // Create data rows
    data.forEach(row => {
      const rowData = headers.map(header => row[header] || '');
      table += rowData.join(' | ') + '\n';
    });
    
    return table;
  }, []);


  // Simple function to process incoming content (clean format)
  const processAndStructureContent = useCallback((rawContent: string): string => {
    return `\n\n${rawContent}\n`;
  }, []);

  // Function to clean up timestamp lines and structured data from content
  const cleanTimestampLines = useCallback((content: string): string => {
    return content
      // Remove timestamp lines
      .replace(/--- Added to Notes \([^)]+\) ---\s*\n/g, '')
      .replace(/--- End of content ---\s*\n/g, '')
      // Remove structured data sections
      .replace(/📊 AUTOMATED DATA ANALYSIS[\s\S]*?--- End of Data Visualization ---/g, '')
      .replace(/📊 VISUALIZATION DATA \(JSON\)[\s\S]*?}/g, '')
      .replace(/📈 KEY METRICS[\s\S]*?(?=\n\n|$)/g, '')
      .replace(/🏢 MARKET ANALYSIS[\s\S]*?(?=\n\n|$)/g, '')
      .replace(/⚔️ COMPETITIVE LANDSCAPE[\s\S]*?(?=\n\n|$)/g, '')
      .replace(/💰 FUNDING & INVESTMENT DATA[\s\S]*?(?=\n\n|$)/g, '')
      .replace(/💡 KEY INSIGHTS & RECOMMENDATIONS[\s\S]*?(?=\n\n|$)/g, '')
      .replace(/📋 STRUCTURED DATA TABLE[\s\S]*?(?=\n\n|$)/g, '')
      // Remove JSON-like data patterns
      .replace(/"pieData"[\s\S]*?],/g, '')
      .replace(/"barData"[\s\S]*?],/g, '')
      .replace(/"tableData"[\s\S]*?],/g, '')
      .replace(/"value"[\s\S]*?[,\n]/g, '')
      .replace(/"color"[\s\S]*?[,\n]/g, '')
      .replace(/"label"[\s\S]*?[,\n]/g, '')
      .replace(/"Column \d+"[\s\S]*?[,\n]/g, '')
      // Clean up multiple newlines
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }, []);

  // Load persisted state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        // Clean up any existing timestamp lines
        const cleanedContent = cleanTimestampLines(saved);
        
        // Check if cleaned content needs processing
        if (!cleanedContent.includes('📊 AUTOMATED DATA ANALYSIS') && 
            (cleanedContent.includes(':') || cleanedContent.includes('|') || cleanedContent.includes('%'))) {
          // Process existing content if it contains semi-structured data
          const processedContent = processAndStructureContent(cleanedContent);
          setContent(processedContent);
        } else {
          setContent(cleanedContent);
        }
      }
      const savedTitle = localStorage.getItem(`${storageKey}_title`);
      if (savedTitle) setTitle(savedTitle);
    } catch {}
  }, [storageKey, processAndStructureContent, cleanTimestampLines]);

  // Persist on change (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, content);
        localStorage.setItem(`${storageKey}_title`, title);
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [content, title, storageKey]);

  const renderMarkdown = useCallback((text: string) => {
    return text
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-white/90 mb-2 mt-4">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-white mb-3 mt-5">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-white mb-4 mt-6">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-white/90">$1</em>')
      .replace(/==(.*?)==/g, '<mark class="bg-yellow-500/30 text-yellow-100 px-1 rounded">$1</mark>')
      .replace(/`(.*?)`/g, '<code class="bg-white/10 text-green-300 px-2 py-1 rounded text-sm font-mono">$1</code>')
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-blue-500/50 pl-4 py-2 bg-blue-500/10 text-blue-200 italic my-2">$1</blockquote>')
      .replace(/^• (.*$)/gim, '<li class="text-white/80 ml-4 mb-1">• $1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="text-white/80 ml-4 mb-1">$&</li>')
      .replace(/\n/g, '<br>');
  }, []);

  const exportPDF = useCallback(async () => {
    // Check if PDF libraries are available
    if (!jsPDF || !html2canvas) {
      console.log('PDF libraries not available, using text export fallback');
      // Fallback to text export
      const blob = new Blob([`# ${title || "Research Notes"}\n\n${content}`], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(title || "research-notes").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    try {
      // Create a temporary container for the content
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '800px';
      tempContainer.style.backgroundColor = '#0b0b0b';
      tempContainer.style.color = '#ffffff';
      tempContainer.style.padding = '40px';
      tempContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      tempContainer.style.lineHeight = '1.6';
      
      // Add title
      const titleElement = document.createElement('h1');
      titleElement.textContent = title || "Research Notes";
      titleElement.style.fontSize = '24px';
      titleElement.style.fontWeight = 'bold';
      titleElement.style.marginBottom = '20px';
      titleElement.style.color = '#ffffff';
      tempContainer.appendChild(titleElement);
      
      // Add content
      const contentElement = document.createElement('div');
      contentElement.innerHTML = renderMarkdown(content);
      contentElement.style.fontSize = '14px';
      contentElement.style.color = '#e5e5e5';
      tempContainer.appendChild(contentElement);
      
      document.body.appendChild(tempContainer);
      
      // Generate PDF
      const canvas = await html2canvas(tempContainer, {
        backgroundColor: '#0b0b0b',
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Clean up
      document.body.removeChild(tempContainer);
      
      // Download PDF
      const fileName = `${(title || "research-notes").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to text export
    const blob = new Blob([`# ${title || "Research Notes"}\n\n${content}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "research-notes").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    }
  }, [title, content, renderMarkdown]);

  const saveLocally = useCallback(() => {
    try {
      localStorage.setItem(storageKey, content);
      localStorage.setItem(`${storageKey}_title`, title);
      // Show brief success feedback
      const event = new CustomEvent("research-saved", { detail: { title, contentLength: content.length } });
      window.dispatchEvent(event);
    } catch (error) {
      console.error("Failed to save research:", error);
    }
  }, [content, title, storageKey]);

  const shareResearchContent = useCallback(async () => {
    if (!navigator.share) {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`# ${title || "Research Notes"}\n\n${content}`);
        const event = new CustomEvent("research-shared", { detail: { method: "clipboard" } });
        window.dispatchEvent(event);
      } catch {
        console.error("Share not supported and clipboard failed");
      }
      return;
    }

    try {
      await navigator.share({
        title: title || "Research Notes",
        text: content,
        url: window.location.href,
      });
      const event = new CustomEvent("research-shared", { detail: { method: "native" } });
      window.dispatchEvent(event);
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Share failed:", error);
      }
    }
  }, [title, content]);

  // Formatting functions
  const insertFormatting = useCallback((format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    let newText = "";

    switch (format) {
      case "bold":
        newText = `**${selectedText || "bold text"}**`;
        break;
      case "italic":
        newText = `*${selectedText || "italic text"}*`;
        break;
      case "heading1":
        newText = `# ${selectedText || "Heading 1"}`;
        break;
      case "heading2":
        newText = `## ${selectedText || "Heading 2"}`;
        break;
      case "heading3":
        newText = `### ${selectedText || "Heading 3"}`;
        break;
      case "bullet":
        newText = `• ${selectedText || "Bullet point"}`;
        break;
      case "number":
        newText = `1. ${selectedText || "Numbered item"}`;
        break;
      case "highlight":
        newText = `==${selectedText || "highlighted text"}==`;
        break;
      case "quote":
        newText = `> ${selectedText || "Quote text"}`;
        break;
      case "code":
        newText = `\`${selectedText || "code"}\``;
        break;
      default:
        return;
    }

    const newContent = content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);

    // Focus back to textarea and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + newText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [content]);


  const togglePreview = useCallback(() => {
    setIsPreviewMode(!isPreviewMode);
    setIsStructuredMode(false); // Exit structured mode when switching to preview
  }, [isPreviewMode]);

  const toggleStructuredMode = useCallback(() => {
    setIsStructuredMode(!isStructuredMode);
    setIsPreviewMode(false); // Exit preview mode when switching to structured
  }, [isStructuredMode]);

  // Check if content has structured data
  const hasStructuredData = useMemo(() => {
    return content.includes('📊 VISUALIZATION DATA (JSON)') || 
           content.includes('📈 KEY METRICS') ||
           content.includes('🏢 MARKET ANALYSIS') ||
           content.includes('⚔️ COMPETITIVE LANDSCAPE') ||
           content.includes('💰 FUNDING & INVESTMENT DATA') ||
           content.includes('📊 AUTOMATED DATA ANALYSIS');
  }, [content]);

  const generateReport = useCallback(async () => {
    if (!content.trim()) {
      const event = new CustomEvent("research-report-error", { detail: "No content to generate report from" });
      window.dispatchEvent(event);
      return;
    }

    const timestamp = new Date().toLocaleString();
    const reportContent = `# Research Analysis Report
Generated: ${timestamp}
Research Title: ${title || "Untitled Research"}

## Executive Summary
${content.split('\n').slice(0, 3).join('\n') || "No summary available"}

## Full Research Notes
${content}

## Metadata
- Word Count: ${content.split(/\s+/).length}
- Character Count: ${content.length}
- Generated: ${timestamp}
- Source: ${window.location.href}
`;

    try {
      // Create a temporary container for the report
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '800px';
      tempContainer.style.backgroundColor = '#0b0b0b';
      tempContainer.style.color = '#ffffff';
      tempContainer.style.padding = '40px';
      tempContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      tempContainer.style.lineHeight = '1.6';
      
      // Add report content
      const reportElement = document.createElement('div');
      reportElement.innerHTML = renderMarkdown(reportContent);
      reportElement.style.fontSize = '14px';
      reportElement.style.color = '#e5e5e5';
      tempContainer.appendChild(reportElement);
      
      document.body.appendChild(tempContainer);
      
      // Generate PDF
      const canvas = await html2canvas(tempContainer, {
        backgroundColor: '#0b0b0b',
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Clean up
      document.body.removeChild(tempContainer);
      
      // Download PDF
      const fileName = `research-report-${(title || "analysis").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()}-${Date.now()}.pdf`;
      pdf.save(fileName);
      
      const event = new CustomEvent("research-report-generated", { detail: { title, wordCount: content.split(/\s+/).length } });
      window.dispatchEvent(event);
      
    } catch (error) {
      console.error('Error generating PDF report:', error);
      // Fallback to text export
      const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `research-report-${(title || "analysis").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    }
  }, [title, content, renderMarkdown]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open || !textareaRef.current) return;
      
      // Only handle shortcuts when textarea is focused
      if (document.activeElement !== textareaRef.current) return;
      
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            insertFormatting('bold');
            break;
          case 'i':
            e.preventDefault();
            insertFormatting('italic');
            break;
          case 'e':
            e.preventDefault();
            togglePreview();
            break;
          case 's':
            e.preventDefault();
            saveLocally();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, insertFormatting, togglePreview, saveLocally]);

  // Global event wiring (after all callbacks are defined)
  useEffect(() => {
    const openHandler = () => setOpen(true);
    const toggleHandler = () => setOpen((v) => !v);
    const newHandler = () => {
      setOpen(true);
      setTitle("");
      setContent("");
      try {
        localStorage.removeItem(storageKey);
        localStorage.removeItem(`${storageKey}_title`);
      } catch {}
      requestAnimationFrame(() => textareaRef.current?.focus());
    };
    const exportHandler = () => {
      if (!open) setOpen(true);
      exportPDF();
    };
    const saveHandler = () => {
      if (!open) setOpen(true);
      saveLocally();
    };
    const shareHandler = () => {
      if (!open) setOpen(true);
      shareResearchContent();
    };
    const reportHandler = () => {
      if (!open) setOpen(true);
      generateReport();
    };
    const addToNotepadHandler = (event: any) => {
      if (!open) setOpen(true);
      const newContent = event.detail?.content || '';
      
      // Process and structure the incoming content
      const processedContent = processAndStructureContent(newContent);
      setContent(prev => prev + processedContent);
      
      // Focus the textarea after adding content
      setTimeout(() => textareaRef.current?.focus(), 100);
    };

    window.addEventListener("open-research-notepad", openHandler as EventListener);
    window.addEventListener("toggle-research-notepad", toggleHandler as EventListener);
    window.addEventListener("new-research", newHandler as EventListener);
    window.addEventListener("export-research-notes", exportHandler as EventListener);
    window.addEventListener("save-research-work", saveHandler as EventListener);
    window.addEventListener("share-research", shareHandler as EventListener);
    window.addEventListener("generate-research-report", reportHandler as EventListener);
    window.addEventListener("add-to-research-notepad", addToNotepadHandler as EventListener);
    return () => {
      window.removeEventListener("open-research-notepad", openHandler as EventListener);
      window.removeEventListener("toggle-research-notepad", toggleHandler as EventListener);
      window.removeEventListener("new-research", newHandler as EventListener);
      window.removeEventListener("export-research-notes", exportHandler as EventListener);
      window.removeEventListener("save-research-work", saveHandler as EventListener);
      window.removeEventListener("share-research", shareHandler as EventListener);
      window.removeEventListener("generate-research-report", reportHandler as EventListener);
      window.removeEventListener("add-to-research-notepad", addToNotepadHandler as EventListener);
    };
  }, [storageKey, exportPDF, saveLocally, shareResearchContent, generateReport]);

  const header = useMemo(() => (
    <div className="border-b border-white/[0.08]">
      {/* Title Bar */}
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-white/70" />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled research"
            className="bg-transparent outline-none text-white/90 placeholder-white/40 text-sm px-1 rounded-md"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportPDF()}
            className="px-2 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-white/80 text-xs flex items-center gap-1"
            title="Export (.pdf)"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button
            onClick={() => {
              setTitle("");
              setContent("");
              try {
                localStorage.removeItem(storageKey);
                localStorage.removeItem(`${storageKey}_title`);
              } catch {}
              textareaRef.current?.focus();
            }}
            className="px-2 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-white/80 text-xs flex items-center gap-1"
            title="Clear all content"
          >
            <Trash className="w-3.5 h-3.5" /> Clear
          </button>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-md hover:bg-white/[0.08] text-white/70"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Formatting Toolbar */}
      <div className="flex items-center gap-1 p-2 border-t border-white/[0.05]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => insertFormatting("bold")}
            className="p-1.5 rounded hover:bg-white/[0.08] text-white/70 hover:text-white transition-colors"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting("italic")}
            className="p-1.5 rounded hover:bg-white/[0.08] text-white/70 hover:text-white transition-colors"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting("highlight")}
            className="p-1.5 rounded hover:bg-white/[0.08] text-white/70 hover:text-white transition-colors"
            title="Highlight"
          >
            <Highlighter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded hover:bg-white/[0.08] text-white/70 hover:text-white transition-colors"
            title="Close notepad"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <div className="w-px h-4 bg-white/[0.1] mx-1" />
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => insertFormatting("heading1")}
            className="p-1.5 rounded hover:bg-white/[0.08] text-white/70 hover:text-white transition-colors"
            title="Heading 1"
          >
            <Type className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting("heading2")}
            className="p-1.5 rounded hover:bg-white/[0.08] text-white/70 hover:text-white transition-colors text-sm"
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => insertFormatting("heading3")}
            className="p-1.5 rounded hover:bg-white/[0.08] text-white/70 hover:text-white transition-colors text-xs"
            title="Heading 3"
          >
            H3
          </button>
        </div>
        
        <div className="w-px h-4 bg-white/[0.1] mx-1" />
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => insertFormatting("bullet")}
            className="p-1.5 rounded hover:bg-white/[0.08] text-white/70 hover:text-white transition-colors"
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting("number")}
            className="p-1.5 rounded hover:bg-white/[0.08] text-white/70 hover:text-white transition-colors text-xs font-mono"
            title="Numbered List"
          >
            1.
          </button>
          <button
            onClick={() => insertFormatting("quote")}
            className="p-1.5 rounded hover:bg-white/[0.08] text-white/70 hover:text-white transition-colors text-xs"
            title="Quote"
          >
            "
          </button>
          <button
            onClick={() => insertFormatting("code")}
            className="p-1.5 rounded hover:bg-white/[0.08] text-white/70 hover:text-white transition-colors text-xs font-mono"
            title="Code"
          >
            &lt;/&gt;
          </button>
        </div>
        
        <div className="flex-1" />
        
        {hasStructuredData && (
          <button
            onClick={toggleStructuredMode}
            className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
              isStructuredMode 
                ? "bg-green-500/20 text-green-300 border border-green-500/30" 
                : "bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-white/80"
            }`}
            title="Toggle Structured View with D3.js Visualizations"
          >
            <BarChart3 className="w-3 h-3" />
            {isStructuredMode ? "Text" : "Charts"}
          </button>
        )}
        
        {!hasStructuredData && content && (content.includes(':') || content.includes('|') || content.includes('%')) && (
          <button
            onClick={() => {
              const processedContent = processAndStructureContent(content);
              setContent(processedContent);
            }}
            className="px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300"
            title="Process and Structure Data"
          >
            <Table className="w-3 h-3" />
            Structure
          </button>
        )}
        
        <button
          onClick={togglePreview}
          className={`px-2 py-1 rounded text-xs transition-colors ${
            isPreviewMode 
              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" 
              : "bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-white/80"
          }`}
          title="Toggle Preview"
        >
          {isPreviewMode ? "Edit" : "Preview"}
        </button>
      </div>
    </div>
  ), [title, exportPDF, insertFormatting, togglePreview, isPreviewMode, hasStructuredData, toggleStructuredMode, isStructuredMode, content, processAndStructureContent]);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ opacity: 0, x: -20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "fixed left-80 top-16 z-[60] w-[min(500px,calc(100vw-20rem))] h-[calc(100vh-4rem)]",
            "rounded-r-2xl bg-[#0b0b0b]/95 backdrop-blur-xl border-r border-t border-b border-white/[0.08] shadow-[8px_0_40px_rgba(0,0,0,0.6)]",
            "flex flex-col overflow-hidden",
            className
          )}
        >
          {header}
          <div className="flex-1">
            {isStructuredMode ? (
              <div className="w-full h-full overflow-y-auto">
                <StructuredContentRenderer content={content} />
              </div>
            ) : isPreviewMode ? (
              <div 
                ref={editorRef}
                className="w-full h-full p-4 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
              />
            ) : (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your research notes here... Use the toolbar above for formatting!"
                className="w-full h-full p-4 bg-transparent outline-none resize-none text-white/90 placeholder-white/30 text-sm leading-6 font-mono"
              />
            )}
          </div>
          <div className="p-2 border-t border-white/[0.08] text-[10px] text-white/40 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>Autosaved locally</span>
              {!isPreviewMode && !isStructuredMode && (
                <span className="text-white/30">•</span>
              )}
              {!isPreviewMode && !isStructuredMode && (
                <span>Use toolbar or Ctrl+B/I for formatting</span>
              )}
              {isStructuredMode && (
                <span className="text-green-400">•</span>
              )}
              {isStructuredMode && (
                <span className="text-green-400">Structured view with D3.js visualizations</span>
              )}
            </div>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

// Helper functions to trigger actions from anywhere
export function openResearchNotepad() {
  window.dispatchEvent(new Event("open-research-notepad"));
}

export function toggleResearchNotepad() {
  window.dispatchEvent(new Event("toggle-research-notepad"));
}

export function startNewResearch() {
  window.dispatchEvent(new Event("new-research"));
}

export function saveResearchWork() {
  window.dispatchEvent(new Event("save-research-work"));
}

export function exportResearchResults() {
  window.dispatchEvent(new Event("export-research-notes"));
}

export function shareResearch() {
  window.dispatchEvent(new Event("share-research"));
}

export function generateResearchReport() {
  window.dispatchEvent(new Event("generate-research-report"));
}

export function addContentToNotepad(content: string) {
  window.dispatchEvent(new CustomEvent("add-to-research-notepad", { 
    detail: { content } 
  }));
}
