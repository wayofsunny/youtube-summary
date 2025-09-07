"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, Variants } from 'framer-motion';
import { Wand2, ArrowRight, Code, Palette, Zap, Circle, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { BACKEND_URL } from './config';
import { parseXml } from './steps';
import { useWebContainer } from '../../hooks/useWebContainer';
import { Step, FileItem, StepType } from './types';
import { StepsList } from './components/StepsList';
import { FileExplorer } from './components/FileExplorer';
import { CodeEditor } from './components/CodeEditor';
import { PreviewFrame } from './components/PreviewFrame';
import { TabView } from './components/TabView';

function ElegantShape({
    className,
    delay = 0,
    width = 400,
    height = 100,
    rotate = 0,
    gradient = "from-white/[0.08]",
}: {
    className?: string;
    delay?: number;
    width?: number;
    height?: number;
    rotate?: number;
    gradient?: string;
}) {
    return (
        <motion.div
            initial={{
                opacity: 0,
                y: -150,
                rotate: rotate - 15,
            }}
            animate={{
                opacity: 1,
                y: 0,
                rotate: rotate,
            }}
            transition={{
                duration: 2.4,
                delay,
                ease: [0.23, 0.86, 0.39, 0.96],
                opacity: { duration: 1.2 },
            }}
            className={cn("absolute", className)}
        >
            <motion.div
                animate={{
                    y: [0, 15, 0],
                }}
                transition={{
                    duration: 12,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                }}
                style={{
                    width,
                    height,
                }}
                className="relative"
            >
                <div
                    className={cn(
                        "absolute inset-0 rounded-full",
                        "bg-gradient-to-r to-transparent",
                        gradient,
                        "backdrop-blur-[2px] border-2 border-white/[0.15]",
                        "shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]",
                        "after:absolute after:inset-0 after:rounded-full",
                        "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]"
                    )}
                />
            </motion.div>
        </motion.div>
    );
}

export default function MVPBuilderPage() {
  // Home.tsx state (prompt input)
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  
  // Builder.tsx state (builder interface)
  const [showBuilder, setShowBuilder] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const [llmMessages, setLlmMessages] = useState<{role: "user" | "assistant", content: string;}[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const isInitializingRef = useRef(false);
  const globalStepIdRef = useRef(1);
  
  const { webcontainer, isLoading: webcontainerLoading, error: webcontainerError } = useWebContainer();
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  

  // Helper function to find first file with content
  const findFirstFileWithContent = useCallback((files: FileItem[]): FileItem | null => {
    for (const file of files) {
      if (file.type === 'file' && file.content) {
        return file;
      }
      if (file.type === 'folder' && file.children) {
        const found = findFirstFileWithContent(file.children);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const fadeUpVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            duration: 1,
            delay: 0.5 + i * 0.2,
            ease: [0.25, 0.4, 0.25, 1],
        },
    }),
  };

  // Builder.tsx functionality - File processing with useCallback to prevent unnecessary re-renders
  const processStepsToFiles = useCallback((currentSteps: Step[], currentFiles: FileItem[]): FileItem[] => {
    console.log('processStepsToFiles called with:', { currentSteps, currentFiles });
    
    const pendingSteps = currentSteps.filter(step => step.status === "pending" && (
      step.type === StepType.CreateFile || 
      step.type === StepType.CreateFolder ||
      step.type === StepType.EditFile ||
      step.type === StepType.DeleteFile
    ));
    console.log('Pending steps:', pendingSteps);
    
    if (pendingSteps.length === 0) {
      return currentFiles;
    }

    let updatedFiles = [...currentFiles];

    pendingSteps.forEach(step => {
      console.log('Processing step:', step);
      
      if (step.type === StepType.CreateFile && step.path && step.code) {
        const pathParts = step.path.split("/").filter(Boolean);
        console.log('Creating file:', pathParts, 'Code:', step.code);
        updatedFiles = addFileToStructure(updatedFiles, pathParts, step.code);
      } else if (step.type === StepType.CreateFolder && step.path) {
        const pathParts = step.path.split("/").filter(Boolean);
        console.log('Creating folder:', pathParts);
        updatedFiles = addFileToStructure(updatedFiles, pathParts, '');
      } else if (step.type === StepType.EditFile && step.path && step.code) {
        const pathParts = step.path.split("/").filter(Boolean);
        console.log('Editing file:', pathParts, 'Code:', step.code);
        updatedFiles = addFileToStructure(updatedFiles, pathParts, step.code);
      } else if (step.type === StepType.DeleteFile && step.path) {
        console.log('Deleting file:', step.path);
        // TODO: Implement file deletion logic
      } else {
        console.log('Step missing required data:', { 
          type: step.type, 
          path: step.path, 
          hasCode: !!step.code 
        });
      }
    });

    console.log('Final updated files:', updatedFiles);
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
    if (!showBuilder || steps.length === 0) return;
    
    console.log('Processing steps to files:', steps);
    
    const updatedFiles = processStepsToFiles(steps, files);
    
    console.log('Updated files:', updatedFiles);
    console.log('Files have content:', updatedFiles.map(f => ({ name: f.name, hasContent: !!f.content })));
    
    if (JSON.stringify(updatedFiles) !== JSON.stringify(files)) {
      setFiles(updatedFiles);
    }
  }, [steps, processStepsToFiles, showBuilder]); // Removed 'files' from dependencies to prevent infinite loop

  // Mark file creation steps as completed after files are processed
  useEffect(() => {
    if (files.length > 0) {
      console.log('Files processed, marking steps as completed. Files:', files);
      setSteps(prevSteps => 
        prevSteps.map(step => 
          step.status === "pending" && (
            step.type === StepType.CreateFile || 
            step.type === StepType.CreateFolder ||
            step.type === StepType.EditFile ||
            step.type === StepType.DeleteFile
          )
            ? { ...step, status: "completed" as const }
            : step
        )
      );
      
      // Auto-select first file with content if no file is selected
      if (!selectedFile) {
        const firstFileWithContent = findFirstFileWithContent(files);
        if (firstFileWithContent) {
          console.log('Auto-selecting first file with content:', firstFileWithContent);
          setSelectedFile(firstFileWithContent);
        }
      }
    }
  }, [files, selectedFile]);

  // Mark RunScript steps as completed immediately (they don't create files)
  useEffect(() => {
    setSteps(prevSteps => {
      const hasRunScriptSteps = prevSteps.some(step => 
        step.status === "pending" && step.type === StepType.RunScript
      );
      
      if (!hasRunScriptSteps) {
        return prevSteps; // No changes needed
      }
      
      return prevSteps.map(step => 
        step.status === "pending" && step.type === StepType.RunScript
          ? { ...step, status: "completed" as const }
          : step
      );
    });
  }, [steps.length]); // Only depend on steps.length to avoid infinite loop

  // Debug selected file
  useEffect(() => {
    console.log('Selected file changed:', selectedFile);
  }, [selectedFile]);

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
    if (webcontainer && Object.keys(mountStructure).length > 0 && showBuilder) {
      console.log('Mounting structure to WebContainer:', mountStructure);
      console.log('Mount structure keys:', Object.keys(mountStructure));
      console.log('Mount structure preview:', JSON.stringify(mountStructure, null, 2).substring(0, 500) + '...');
      
      webcontainer.mount(mountStructure)
        .then(() => {
          console.log('Successfully mounted files to WebContainer');
          // List files to verify mounting
          webcontainer.fs.readdir('/').then(files => {
            console.log('Root directory files after mount:', files);
          }).catch(err => {
            console.error('Error listing root directory:', err);
          });
        })
        .catch((error: any) => {
          console.error('Failed to mount files to WebContainer:', error);
          setError(`Failed to mount project files: ${error.message || 'Unknown error'}`);
        });
    }
  }, [webcontainer, mountStructure, showBuilder]);

  // Builder.tsx functionality - Initialize project
  const initializeProject = useCallback(async (initialPrompt: string) => {
    if (!initialPrompt) return;
    
    // Prevent multiple initializations using ref for immediate check
    if (isInitializingRef.current) {
      console.log('Already initializing, skipping...');
      return;
    }
    
    try {
      isInitializingRef.current = true;
      setIsInitializing(true);
      setError(null);
      
      console.log('=== INITIALIZE PROJECT CALLED ===');
      console.log('Initializing project with prompt:', initialPrompt);
      console.log('Backend URL:', BACKEND_URL);
      
      // Test API connectivity (removed - causing 405 errors)
      // The API only accepts POST requests, not GET
      
      
      // Clear existing steps and files
      setSteps([]);
      setFiles([]);
      setSelectedFile(null);
      globalStepIdRef.current = 1; // Reset global step ID counter
      
      // Step 1: Get template
      console.log('Making API call to:', `${BACKEND_URL}/api/mvp_builder`);
      console.log('Request payload:', { type: 'template', prompt: initialPrompt.trim() });
      
      const templateResponse = await axios.post(`${BACKEND_URL}/api/mvp_builder`, {
        type: 'template',
        prompt: initialPrompt.trim()
      });
      
      console.log('Template response status:', templateResponse.status);
      console.log('Template response data:', templateResponse.data);
      console.log('UI Prompts content:', templateResponse.data.uiPrompts?.map((p: string, i: number) => `Prompt ${i}: ${p.substring(0, 200)}...`));
      
      setTemplateSet(true);
      
      // Check if response has the expected structure
      if (!templateResponse.data || !templateResponse.data.uiPrompts) {
        console.error('Invalid response structure:', templateResponse.data);
        throw new Error('Invalid response from backend');
      }
      
      console.log('Response structure is valid, extracting data...');
      const { prompts, uiPrompts } = templateResponse.data;
      console.log('Extracted prompts:', prompts);
      console.log('Extracted uiPrompts:', uiPrompts);

      // Step 2: Parse initial steps from template
      console.log('UI Prompts received:', uiPrompts);
      console.log('UI Prompts length:', uiPrompts.length);
      console.log('=== STARTING STEP GENERATION ===');
      
      // Process all UI prompts (template + custom code)
      console.log('Starting to process UI prompts...');
      let allSteps: Step[] = [];
      
      // Helper function to parse XML and assign unique IDs
      const parseXmlWithUniqueIds = (xml: string) => {
        const rawSteps = parseXml(xml);
        console.log(`Parsing ${rawSteps.length} raw steps, starting from global ID: ${globalStepIdRef.current}`);
        return rawSteps.map((step: Step, index: number) => {
          const newId = globalStepIdRef.current++;
          console.log(`Assigning ID ${newId} to step: ${step.title}`);
          return {
            ...step,
            id: newId,
            status: "pending" as const
          };
        });
      };
      uiPrompts.forEach((uiPrompt: string, index: number) => {
        console.log(`Processing UI Prompt ${index}:`, uiPrompt.substring(0, 200) + '...');
        try {
          const parsedSteps = parseXmlWithUniqueIds(uiPrompt);
          console.log(`Generated steps with IDs:`, parsedSteps.map((s: Step) => s.id));
          allSteps = [...allSteps, ...parsedSteps];
          console.log(`UI Prompt ${index} parsed into ${parsedSteps.length} steps`);
          console.log(`All steps so far:`, allSteps.map((s: Step) => s.id));
        } catch (parseError) {
          console.error(`Error parsing UI Prompt ${index}:`, parseError);
          console.error('Problematic prompt:', uiPrompt);
        }
      });
      
      console.log('All initial steps parsed:', allSteps);
      console.log('Total steps count:', allSteps.length);
      
      // Ensure all steps have unique IDs
      const uniqueSteps = allSteps.filter((step, index, self) => 
        index === self.findIndex(s => s.id === step.id)
      );
      
      if (uniqueSteps.length !== allSteps.length) {
        console.warn(`Removed ${allSteps.length - uniqueSteps.length} duplicate steps`);
      }
      
      console.log('Final unique steps:', uniqueSteps.map(s => ({ id: s.id, title: s.title, type: s.type, path: s.path, hasCode: !!s.code })));
      setSteps(uniqueSteps);

      // Step 3: Generate additional steps
      setLoading(true);
      const stepsResponse = await axios.post(`${BACKEND_URL}/api/mvp_builder`, {
        type: 'chat',
        messages: [...prompts, initialPrompt].map(content => ({
          role: "user" as const,
          content
        }))
      });

      // Step 4: Parse and add generated steps
      console.log('Steps response:', stepsResponse.data.response);
      const generatedSteps = parseXml(stepsResponse.data.response).map((step: Step, index: number) => {
        const newId = globalStepIdRef.current++;
        console.log(`Assigning ID ${newId} to additional step: ${step.title}`);
        return {
          ...step,
          id: newId,
          status: "pending" as const
        };
      });
      console.log('Generated steps parsed:', generatedSteps);
      
      setSteps(prevSteps => {
        const allSteps = [...prevSteps, ...generatedSteps];
        const uniqueSteps = allSteps.filter((step, index, self) => 
          index === self.findIndex(s => s.id === step.id)
        );
        
        if (uniqueSteps.length !== allSteps.length) {
          console.warn(`Removed ${allSteps.length - uniqueSteps.length} duplicate additional steps`);
        }
        
        return uniqueSteps;
      });

      // Step 5: Update LLM messages
      const userMessages = [...prompts, initialPrompt].map(content => ({
        role: "user" as const,
        content
      }));
      
      setLlmMessages([
        ...userMessages,
        { role: "assistant" as const, content: stepsResponse.data.response }
      ]);

    } catch (error) {
      console.error('Initialization error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url
        });
        setError(`API Error: ${error.response?.status} - ${error.response?.statusText || error.message}`);
      } else {
        setError(error instanceof Error ? error.message : 'Failed to initialize project');
      }
    } finally {
      setLoading(false);
      setIsInitializing(false);
      isInitializingRef.current = false;
    }
  }, []);

  // Handle file content updates
  const handleFileChange = useCallback((file: FileItem, content: string) => {
    setFiles(prevFiles => {
      const updateFile = (files: FileItem[]): FileItem[] => {
        return files.map(f => {
          if (f.path === file.path) {
            return { ...f, content };
          }
          if (f.children) {
            return { ...f, children: updateFile(f.children) };
          }
          return f;
        });
      };
      return updateFile(prevFiles);
    });
  }, []);

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

      const stepsResponse = await axios.post(`${BACKEND_URL}/api/mvp_builder`, {
        type: 'chat',
        messages: [...llmMessages, newMessage]
      });

      // Parse and add new steps
      setSteps(prevSteps => {
        const newSteps = parseXml(stepsResponse.data.response).map((step: Step, index: number) => {
          const newId = globalStepIdRef.current++;
          console.log(`Assigning ID ${newId} to follow-up step: ${step.title}`);
          return {
            ...step,
            id: newId,
            status: "pending" as const
          };
        });
        const allSteps = [...prevSteps, ...newSteps];
        const uniqueSteps = allSteps.filter((step, index, self) => 
          index === self.findIndex(s => s.id === step.id)
        );
        
        if (uniqueSteps.length !== allSteps.length) {
          console.warn(`Removed ${allSteps.length - uniqueSteps.length} duplicate follow-up steps`);
        }
        
        return uniqueSteps;
      });
      setLlmMessages(prev => [...prev, newMessage, {
        role: "assistant" as const,
        content: stepsResponse.data.response
      }]);
      
      setUserPrompt(""); // Clear input
      
    } catch (error) {
      console.error('Follow-up prompt error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url
        });
        setError(`API Error: ${error.response?.status} - ${error.response?.statusText || error.message}`);
      } else {
        setError(error instanceof Error ? error.message : 'Failed to process follow-up prompt');
      }
    } finally {
      setLoading(false);
    }
  }, [userPrompt, llmMessages]);

  const validatePrompt = (prompt: string): { isValid: boolean; message?: string } => {
    if (!prompt.trim()) {
      return { isValid: false, message: 'Please describe your application idea' };
    }
    
    if (prompt.trim().length < 10) {
      return { isValid: false, message: 'Please provide a more detailed description (at least 10 characters)' };
    }
    
    if (prompt.trim().length > 1000) {
      return { isValid: false, message: 'Description is too long (maximum 1000 characters)' };
    }
    
    // Check for potentially problematic content
    const suspiciousPatterns = [
      /script\s*:/i,
      /javascript\s*:/i,
      /<script/i,
      /eval\s*\(/i,
      /function\s*\(/i
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(prompt))) {
      return { isValid: false, message: 'Please provide a valid application description without code' };
    }
    
    return { isValid: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate prompt
    const validation = validatePrompt(prompt);
    if (!validation.isValid) {
      setError(validation.message || 'Invalid input');
      return;
    }
    
      setIsLoading(true);
    setIsValidating(true);
    setValidationProgress(0);
    
    try {
      // Simulate validation progress
      const progressSteps = [
        { progress: 20, message: 'Validating input...' },
        { progress: 40, message: 'Preparing environment...' },
        { progress: 60, message: 'Setting up project structure...' },
        { progress: 80, message: 'Initializing AI models...' },
        { progress: 100, message: 'Ready to generate!' }
      ];
      
      for (const step of progressSteps) {
        setValidationProgress(step.progress);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Initialize the builder with the prompt
      await initializeProject(prompt.trim());
      
      // Show the builder interface
      setShowBuilder(true);
      
      } catch (error) {
        console.error('Error starting MVP builder:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(`Failed to start MVP builder: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      setIsValidating(false);
      setValidationProgress(0);
    }
  };

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-[#030303] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <h3 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-purple-100 mb-3">
            Initializing Your Project...
          </h3>
          <p className="text-gray-300">Setting up the builder environment</p>
        </div>
      </div>
    );
  }

  // Show Builder interface if showBuilder is true
  if (showBuilder) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-[#030303]">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />
        
        <div className="relative z-10 flex flex-col min-h-screen">
          <header className="bg-white/5 backdrop-blur-lg border-b border-white/10 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-purple-100 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  Website Builder
                </h1>
                <p className="text-sm text-gray-300 mt-2">Prompt: {prompt}</p>
              </div>
              {error && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}
              <button
                onClick={() => {
                  setShowBuilder(false);
                  setPrompt('');
                  setSteps([]);
                  setFiles([]);
                  setError(null);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                Start New Project
              </button>
            </div>
          </header>
        
          <div className="flex-1 overflow-hidden">
            <div className="h-full grid grid-cols-4 gap-6 p-8">
              {/* Steps List */}
              <div className="col-span-1 space-y-6 overflow-auto">
                <div>
                  <div className="max-h-[75vh] overflow-scroll">
                    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                      <h3 className="text-white font-semibold mb-4 text-lg">Steps ({steps.length})</h3>
                      <StepsList 
                        steps={steps} 
                        currentStep={currentStep}
                        onStepClick={(step) => {
                          console.log('Step clicked:', step);
                        }}
                      />
                    </div>
                  </div>
                
                  {/* Follow-up Prompt Section */}
                  <div className="mt-6">
                    {loading && (
                      <div className="flex items-center justify-center p-4">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    {!loading && templateSet && (
                      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 space-y-4">
                        <h4 className="text-white font-medium">Add More Features</h4>
                        <textarea 
                          value={userPrompt} 
                          onChange={(e) => setUserPrompt(e.target.value)}
                          placeholder="Add more features or make changes..."
                          className="w-full p-4 bg-white/5 text-gray-100 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none placeholder-gray-400 text-sm"
                          rows={3}
                        />
                        <button 
                          onClick={handleFollowUpPrompt}
                          disabled={!userPrompt.trim() || loading}
                          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 h-full">
                  <h3 className="text-white font-semibold mb-4 text-lg">Files ({files.length})</h3>
                  <FileExplorer 
                    files={files}
                    selectedFile={selectedFile}
                    onFileSelect={setSelectedFile}
                  />
                </div>
              </div>
            
              {/* Code/Preview Panel */}
              <div className="col-span-2 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 h-[calc(100vh-8rem)]">
                <TabView 
                  activeTab={activeTab} 
                  onTabChange={setActiveTab}
                >
                  {activeTab === 'code' ? (
                    <div className="bg-white/5 rounded-lg h-full border border-white/10">
                      <CodeEditor 
                        selectedFile={selectedFile}
                        onFileChange={handleFileChange}
                      />
                    </div>
                  ) : (
                    <div className="bg-white/10 rounded-lg h-full border border-white/10">
                      <PreviewFrame 
                        webcontainer={webcontainer}
                        isReady={!!webcontainer && files.length > 0}
                      />
                      {/* Debug info */}
                      <div className="absolute top-2 right-2 text-xs text-gray-400 bg-black/50 p-2 rounded">
                        <div>WebContainer: {webcontainer ? '✅' : (webcontainerLoading ? '⏳' : '❌')}</div>
                        <div>Files: {files.length}</div>
                        <div>Mount Structure: {Object.keys(mountStructure).length}</div>
                        {webcontainerError && (
                          <div className="text-red-400">
                            <div>Error: {webcontainerError}</div>
                            <div className="text-xs mt-1 text-gray-300">
                              {webcontainerError.includes('Cross-Origin-Isolated') && 
                                "Make sure the development server is running with proper headers."}
                              {webcontainerError.includes('SharedArrayBuffer') && 
                                "Browser security restrictions. Try Chrome/Edge."}
                            </div>
                            <button 
                              onClick={() => window.location.reload()} 
                              className="mt-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                            >
                              Refresh Page
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </TabView>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show Home interface (prompt input)
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#030303]">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />

      <div className="absolute inset-0 overflow-hidden">
        <ElegantShape
          delay={0.3}
          width={600}
          height={140}
          rotate={12}
          gradient="from-indigo-500/[0.15]"
          className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
        />

        <ElegantShape
          delay={0.5}
          width={500}
          height={120}
          rotate={-15}
          gradient="from-rose-500/[0.15]"
          className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
        />

        <ElegantShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient="from-violet-500/[0.15]"
          className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
        />

        <ElegantShape
          delay={0.6}
          width={200}
          height={60}
          rotate={20}
          gradient="from-amber-500/[0.15]"
          className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8">
              <Circle className="h-2 w-2 fill-blue-500/80" />
              <span className="text-sm text-white/60 tracking-wide">
                AI-Powered MVP Builder
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold mb-6 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
                Build Your
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-white/90 to-purple-300">
                MVP in Minutes
              </span>
            </h1>

            <p className="text-lg text-white/40 mb-12 leading-relaxed font-light tracking-wide max-w-2xl mx-auto">
              Describe your idea and watch as AI generates a complete, functional web application with live preview.
            </p>
          </motion.div>

          <motion.div
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-3 gap-6 mb-12"
          >
            <div className="text-center p-6 bg-white/[0.02] rounded-xl border border-white/[0.05]">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Code className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Full-Stack Code</h3>
              <p className="text-white/60 text-sm">Complete React application with modern UI components</p>
            </div>

            <div className="text-center p-6 bg-white/[0.02] rounded-xl border border-white/[0.05]">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Live Preview</h3>
              <p className="text-white/60 text-sm">See your app running in real-time with WebContainer</p>
            </div>

            <div className="text-center p-6 bg-white/[0.02] rounded-xl border border-white/[0.05]">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">AI-Powered</h3>
              <p className="text-white/60 text-sm">Intelligent code generation with best practices</p>
            </div>
          </motion.div>

          <motion.div
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="max-w-3xl mx-auto"
          >
            {/* Error Display */}
            {error && (
              <div className="mb-6">
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-white font-bold">!</span>
                    </div>
                    <div>
                      <h3 className="text-red-400 font-medium mb-1">Error</h3>
                      <p className="text-red-200 text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative bg-white/[0.03] backdrop-blur-lg border border-white/[0.08] rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Wand2 className="w-6 h-6 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">
                      Describe Your Application
                    </h2>
                  </div>
                  
                  <div className="relative">
                  <textarea
                    value={prompt}
                      onChange={(e) => {
                        setPrompt(e.target.value);
                        setError(null); // Clear error when user types
                      }}
                    placeholder="e.g., Create a todo app with drag-and-drop functionality, user authentication, and real-time updates..."
                      className={`w-full h-40 p-4 bg-white/[0.05] text-white border rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none placeholder-white/40 transition-all duration-300 ${
                        error ? 'border-red-500/50' : 'border-white/[0.1]'
                      }`}
                    disabled={isLoading}
                      maxLength={1000}
                    />
                    
                    {/* Character Counter */}
                    <div className="absolute bottom-2 right-2 text-xs text-white/40">
                      {prompt.length}/1000
                    </div>
                  </div>
                  
                  {/* Validation Progress */}
                  {isValidating && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-white/60 mb-2">
                        <span>Preparing...</span>
                        <span>{validationProgress}%</span>
                      </div>
                      <div className="w-full bg-white/[0.1] rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${validationProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 mt-6">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Code className="w-4 h-4" />
                      <span>React + TypeScript</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Zap className="w-4 h-4" />
                      <span>Live Preview</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Sparkles className="w-4 h-4" />
                      <span>AI Generated</span>
                    </div>
                  </div>
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex justify-center"
              >
                <button
                  type="submit"
                  disabled={!prompt.trim() || isLoading || prompt.trim().length < 10}
                  className={`group relative px-12 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 disabled:cursor-not-allowed shadow-2xl ${
                    !prompt.trim() || prompt.trim().length < 10
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : isLoading
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:shadow-blue-500/25'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {isValidating ? 'Preparing...' : 'Starting Builder...'}
                      </>
                    ) : !prompt.trim() ? (
                      <>
                        <Wand2 className="w-5 h-5" />
                        Enter Your Idea
                      </>
                    ) : prompt.trim().length < 10 ? (
                      <>
                        <Wand2 className="w-5 h-5" />
                        More Details Needed
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5" />
                        Generate MVP
                      </>
                    )}
                  </span>
                </button>
              </motion.div>
            </form>
          </motion.div>

          <motion.div
            custom={3}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mt-16"
          >
            <h3 className="text-xl font-semibold text-white mb-8 text-center">
              Example Ideas
            </h3>
            <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {[
                {
                  title: "Social Media Dashboard",
                  description: "Analytics dashboard with post scheduling, engagement metrics, and content calendar",
                  category: "Analytics"
                },
                {
                  title: "E-commerce Platform", 
                  description: "Online store with inventory management, payment processing, and order tracking",
                  category: "E-commerce"
                },
                {
                  title: "Project Management Tool",
                  description: "Team collaboration platform with task tracking, deadlines, and progress monitoring",
                  category: "Productivity"
                },
                {
                  title: "Fitness Tracking App",
                  description: "Workout planner with progress charts, goal setting, and health metrics",
                  category: "Health & Fitness"
                }
              ].map((example, index) => (
                <motion.button
                  key={example.title}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setPrompt(example.description);
                    setError(null);
                  }}
                  disabled={isLoading}
                  className="p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl text-left text-white/80 hover:text-white transition-all duration-300 border border-white/[0.05] hover:border-white/[0.1] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">{example.title}</span>
                        <span className="text-xs text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded">
                          {example.category}
                        </span>
                      </div>
                      <span className="text-sm text-white/70">{example.description}</span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
            
            {/* Additional Help Text */}
            <div className="mt-8 text-center">
              <p className="text-white/40 text-sm max-w-2xl mx-auto">
                Click on any example above to get started, or describe your own unique application idea. 
                Be as specific as possible about features, functionality, and user experience.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/80 pointer-events-none" />
    </div>
  );
}
