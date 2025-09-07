import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StepsList } from '../components/StepsList';
import { FileExplorer } from '../components/FileExplorer';
import { TabView } from '../components/TabView';
import { CodeEditor } from '../components/CodeEditor';
import { PreviewFrame } from '../components/PreviewFrame';
import { Step, FileItem, StepType } from '../types';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { parseXml } from '../steps';
import { useWebContainer } from '../../../hooks/useWebContainer';
import { Loader } from '../components/Loader';

export function Builder() {
  const location = useLocation();
  const navigate = useNavigate();
  const { prompt } = location.state as { prompt: string };
  
  // Redirect if no prompt
  useEffect(() => {
    if (!prompt) {
      navigate('/');
    }
  }, [prompt, navigate]);

  // State management
  const [userPrompt, setUserPrompt] = useState("");
  const [llmMessages, setLlmMessages] = useState<{role: "user" | "assistant", content: string;}[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const webcontainer = useWebContainer();

  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  
  const [steps, setSteps] = useState<Step[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);

  // Optimized file processing with useCallback to prevent unnecessary re-renders
  const processStepsToFiles = useCallback((currentSteps: Step[], currentFiles: FileItem[]): FileItem[] => {
    const pendingSteps = currentSteps.filter(step => step.status === "pending" && step.type === StepType.CreateFile);
    
    if (pendingSteps.length === 0) {
      return currentFiles;
    }

    let updatedFiles = [...currentFiles];

    pendingSteps.forEach(step => {
      if (step.path && step.code) {
        const pathParts = step.path.split("/").filter(Boolean);
        updatedFiles = addFileToStructure(updatedFiles, pathParts, step.code);
      }
    });

    return updatedFiles;
  }, []);

  // Helper function to add file to nested structure
  const addFileToStructure = useCallback((files: FileItem[], pathParts: string[], content: string): FileItem[] => {
    if (pathParts.length === 0) return files;

    const [currentPart, ...remainingParts] = pathParts;
    const isLastPart = remainingParts.length === 0;

    let existingItem = files.find(item => item.name === currentPart);

    if (isLastPart) {
      // This is a file
      if (existingItem) {
        existingItem.content = content;
      } else {
        files.push({
          name: currentPart,
          type: 'file',
          path: pathParts.join('/'),
          content: content
        });
      }
    } else {
      // This is a folder
      if (!existingItem) {
        existingItem = {
          name: currentPart,
          type: 'folder',
          path: pathParts.slice(0, -remainingParts.length).join('/'),
          children: []
        };
        files.push(existingItem);
      }
      
      if (existingItem.children) {
        existingItem.children = addFileToStructure(existingItem.children, remainingParts, content);
      }
    }

    return files;
  }, []);

  // Process steps when they change
  useEffect(() => {
    const updatedFiles = processStepsToFiles(steps, files);
    
    if (JSON.stringify(updatedFiles) !== JSON.stringify(files)) {
      setFiles(updatedFiles);
      
      // Mark processed steps as completed
      setSteps(prevSteps => 
        prevSteps.map(step => 
          step.status === "pending" && step.type === StepType.CreateFile
            ? { ...step, status: "completed" as const }
            : step
        )
      );
    }
  }, [steps, files, processStepsToFiles]);

  // Memoized WebContainer mount structure creation
  const mountStructure = useMemo(() => {
    const createMountStructure = (files: FileItem[]): Record<string, any> => {
      const mountStructure: Record<string, any> = {};
  
      const processFile = (file: FileItem): any => {  
        if (file.type === 'folder') {
          // For folders, create a directory entry
          return {
            directory: file.children ? 
              Object.fromEntries(
                file.children.map(child => [child.name, processFile(child)])
              ) 
              : {}
          };
        } else if (file.type === 'file') {
          // For files, create a file entry with contents
          return {
            file: {
              contents: file.content || ''
            }
          };
        }
        return {};
      };
  
      // Process each top-level file/folder
      files.forEach(file => {
        mountStructure[file.name] = processFile(file);
      });
  
      return mountStructure;
    };
  
    return createMountStructure(files);
  }, [files]);

  // Mount files to WebContainer when structure changes
  useEffect(() => {
    if (webcontainer && Object.keys(mountStructure).length > 0) {
      console.log('Mounting structure to WebContainer:', mountStructure);
      webcontainer.mount(mountStructure).catch((error: any) => {
        console.error('Failed to mount files to WebContainer:', error);
        setError('Failed to mount project files. Please try again.');
      });
    }
  }, [webcontainer, mountStructure]);

  // Optimized initialization function with error handling
  const initializeProject = useCallback(async () => {
    if (!prompt) return;
    
    try {
      setIsInitializing(true);
      setError(null);
      
      // Step 1: Get template
      const templateResponse = await axios.post(`${BACKEND_URL}/template`, {
        prompt: prompt.trim()
      });
      
      setTemplateSet(true);
      const { prompts, uiPrompts } = templateResponse.data;

      // Step 2: Parse initial steps from template
      const initialSteps = parseXml(uiPrompts[0]).map((step: Step) => ({
        ...step,
        status: "pending" as const
      }));
      setSteps(initialSteps);

      // Step 3: Generate additional steps
      setLoading(true);
      const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
        messages: [...prompts, prompt].map(content => ({
          role: "user" as const,
          content
        }))
      });

      // Step 4: Parse and add generated steps
      const generatedSteps = parseXml(stepsResponse.data.response).map((step: Step) => ({
        ...step,
        status: "pending" as const
      }));
      
      setSteps(prevSteps => [...prevSteps, ...generatedSteps]);

      // Step 5: Update LLM messages
      const userMessages = [...prompts, prompt].map(content => ({
        role: "user" as const,
        content
      }));
      
      setLlmMessages([
        ...userMessages,
        { role: "assistant" as const, content: stepsResponse.data.response }
      ]);

    } catch (error) {
      console.error('Initialization error:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize project');
    } finally {
      setLoading(false);
      setIsInitializing(false);
    }
  }, [prompt]);

  // Initialize project on mount
  useEffect(() => {
    initializeProject();
  }, [initializeProject]);

  // Handle follow-up prompts
  const handleFollowUpPrompt = useCallback(async () => {
    if (!userPrompt.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const newMessage = {
        role: "user" as const,
        content: userPrompt.trim()
      };

      const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
        messages: [...llmMessages, newMessage]
      });

      // Parse and add new steps
      const newSteps = parseXml(stepsResponse.data.response).map((step: Step) => ({
        ...step,
        status: "pending" as const
      }));
      
      setSteps(prevSteps => [...prevSteps, ...newSteps]);
      setLlmMessages(prev => [...prev, newMessage, {
        role: "assistant" as const,
        content: stepsResponse.data.response
      }]);
      
      setUserPrompt(""); // Clear input
      
    } catch (error) {
      console.error('Follow-up prompt error:', error);
      setError(error instanceof Error ? error.message : 'Failed to process follow-up prompt');
    } finally {
      setLoading(false);
    }
  }, [userPrompt, llmMessages]);

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader />
          <p className="text-gray-300 mt-4">Initializing your project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-100">Website Builder</h1>
            <p className="text-sm text-gray-400 mt-1">Prompt: {prompt}</p>
          </div>
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}
        </div>
      </header>
      
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-4 gap-6 p-6">
          {/* Steps List */}
          <div className="col-span-1 space-y-6 overflow-auto">
            <div>
              <div className="max-h-[75vh] overflow-scroll">
                <StepsList
                  steps={steps}
                  currentStep={currentStep}
                  onStepClick={setCurrentStep}
                />
              </div>
              
              {/* Follow-up Prompt Section */}
              <div className="mt-4">
                {loading && <Loader />}
                {!loading && templateSet && (
                  <div className="space-y-2">
                    <textarea 
                      value={userPrompt} 
                      onChange={(e) => setUserPrompt(e.target.value)}
                      placeholder="Add more features or make changes..."
                      className="w-full p-3 bg-gray-800 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-500 text-sm"
                      rows={3}
                    />
                    <button 
                      onClick={handleFollowUpPrompt}
                      disabled={!userPrompt.trim() || loading}
                      className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send Follow-up
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* File Explorer */}
          <div className="col-span-1">
            <FileExplorer 
              files={files} 
              onFileSelect={setSelectedFile}
            />
          </div>
          
          {/* Code/Preview Panel */}
          <div className="col-span-2 bg-gray-900 rounded-lg shadow-lg p-4 h-[calc(100vh-8rem)]">
            <TabView activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="h-[calc(100%-4rem)]">
              {activeTab === 'code' ? (
                <CodeEditor file={selectedFile} />
              ) : (
                <PreviewFrame webContainer={webcontainer} files={files} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}