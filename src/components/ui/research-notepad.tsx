"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Trash, StickyNote, Share, FileText, Save } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Load persisted state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setContent(saved);
      const savedTitle = localStorage.getItem(`${storageKey}_title`);
      if (savedTitle) setTitle(savedTitle);
    } catch {}
  }, [storageKey]);

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

  const exportText = useCallback(() => {
    const blob = new Blob([`# ${title || "Research Notes"}\n\n${content}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "research-notes").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [title, content]);

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

  const generateReport = useCallback(() => {
    if (!content.trim()) {
      const event = new CustomEvent("research-report-error", { detail: "No content to generate report from" });
      window.dispatchEvent(event);
      return;
    }

    const timestamp = new Date().toLocaleString();
    const report = `# Research Analysis Report
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

    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `research-report-${(title || "analysis").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const event = new CustomEvent("research-report-generated", { detail: { title, wordCount: content.split(/\s+/).length } });
    window.dispatchEvent(event);
  }, [title, content]);

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
      exportText();
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

    window.addEventListener("open-research-notepad", openHandler as EventListener);
    window.addEventListener("toggle-research-notepad", toggleHandler as EventListener);
    window.addEventListener("new-research", newHandler as EventListener);
    window.addEventListener("export-research-notes", exportHandler as EventListener);
    window.addEventListener("save-research-work", saveHandler as EventListener);
    window.addEventListener("share-research", shareHandler as EventListener);
    window.addEventListener("generate-research-report", reportHandler as EventListener);
    return () => {
      window.removeEventListener("open-research-notepad", openHandler as EventListener);
      window.removeEventListener("toggle-research-notepad", toggleHandler as EventListener);
      window.removeEventListener("new-research", newHandler as EventListener);
      window.removeEventListener("export-research-notes", exportHandler as EventListener);
      window.removeEventListener("save-research-work", saveHandler as EventListener);
      window.removeEventListener("share-research", shareHandler as EventListener);
      window.removeEventListener("generate-research-report", reportHandler as EventListener);
    };
  }, [storageKey, exportText, saveLocally, shareResearchContent, generateReport]);

  const header = useMemo(() => (
    <div className="flex items-center justify-between gap-2 p-3 border-b border-white/[0.08]">
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
          onClick={() => exportText()}
          className="px-2 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-white/80 text-xs flex items-center gap-1"
          title="Export (.txt)"
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
          title="Clear"
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
  ), [title, exportText]);

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
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your research notes here..."
              className="w-full h-full p-4 bg-transparent outline-none resize-none text-white/90 placeholder-white/30 text-sm leading-6"
            />
          </div>
          <div className="p-2 border-t border-white/[0.08] text-[10px] text-white/40 flex items-center justify-between">
            <span>Autosaved locally</span>
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