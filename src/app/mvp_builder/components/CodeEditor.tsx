import React, { useState, useEffect } from 'react';
import { FileItem } from '../types';

interface CodeEditorProps {
  selectedFile: FileItem | null;
  onFileChange?: (file: FileItem, content: string) => void;
}

export function CodeEditor({ selectedFile, onFileChange }: CodeEditorProps) {
  const [content, setContent] = useState('');

  useEffect(() => {
    if (selectedFile?.content) {
      setContent(selectedFile.content);
    } else {
      setContent('');
    }
  }, [selectedFile]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    if (selectedFile && onFileChange) {
      onFileChange(selectedFile, newContent);
    }
  };

  if (!selectedFile) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-4">📄</div>
          <p>Select a file to edit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 p-3 border-b border-white/10">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm text-gray-300">{selectedFile.name}</span>
      </div>
      
      <div className="flex-1">
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="w-full h-full p-4 bg-transparent text-gray-100 font-mono text-sm resize-none focus:outline-none"
          placeholder="File content will appear here..."
          spellCheck={false}
        />
      </div>
    </div>
  );
}
