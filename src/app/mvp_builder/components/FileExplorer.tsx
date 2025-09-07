import React, { useState } from 'react';
import { FileItem } from '../types';
import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react';

interface FileExplorerProps {
  files: FileItem[];
  selectedFile: FileItem | null;
  onFileSelect: (file: FileItem) => void;
}

export function FileExplorer({ files, selectedFile, onFileSelect }: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFile = (file: FileItem, depth = 0) => {
    const isExpanded = expandedFolders.has(file.path);
    const isSelected = selectedFile?.path === file.path;

    return (
      <div key={file.path}>
        <div
          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
            isSelected
              ? 'bg-indigo-500/20 text-indigo-200'
              : 'hover:bg-white/10 text-gray-200'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (file.type === 'folder') {
              toggleFolder(file.path);
            } else {
              onFileSelect(file);
            }
          }}
        >
          {file.type === 'folder' ? (
            <>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <Folder className="w-4 h-4" />
            </>
          ) : (
            <>
              <div className="w-4" /> {/* Spacer for alignment */}
              <File className="w-4 h-4" />
            </>
          )}
          <span className="text-sm">{file.name}</span>
        </div>
        
        {file.type === 'folder' && isExpanded && file.children && (
          <div>
            {file.children.map(child => renderFile(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {files.map(file => renderFile(file))}
    </div>
  );
}
