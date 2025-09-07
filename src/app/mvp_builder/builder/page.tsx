"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Play, Square, Download, RefreshCw, Code, Eye, FileText } from 'lucide-react';
import { useWebContainer } from '@/hooks/useWebContainer';
import { WebContainer } from '@webcontainer/api';

export default function BuilderPage() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [projectFiles, setProjectFiles] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isWebContainerReady, setIsWebContainerReady] = useState(false);
  const router = useRouter();
  const webContainer = useWebContainer();

  useEffect(() => {
    // Get prompt from sessionStorage
    const savedPrompt = sessionStorage.getItem('mvp_prompt');
    if (savedPrompt) {
      setPrompt(savedPrompt);
    } else {
      // Redirect to home if no prompt
      router.push('/mvp_builder');
    }
  }, [router]);

  // Track WebContainer readiness
  useEffect(() => {
    if (webContainer) {
      setIsWebContainerReady(true);
      console.log('WebContainer is ready');
    }
  }, [webContainer]);

  // Start preview when WebContainer is ready and we have files
  useEffect(() => {
    if (webContainer && projectFiles && !previewUrl && !isPreviewLoading) {
      startPreview(projectFiles);
    }
  }, [webContainer, projectFiles, previewUrl, isPreviewLoading]);

  const steps = [
    { id: 1, title: 'Analyzing Requirements', description: 'Understanding your application needs' },
    { id: 2, title: 'Generating Architecture', description: 'Creating the project structure' },
    { id: 3, title: 'Building Components', description: 'Developing UI components' },
    { id: 4, title: 'Adding Functionality', description: 'Implementing core features' },
    { id: 5, title: 'Finalizing Code', description: 'Optimizing and testing' }
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setCurrentStep(0);
    setError(null);
    setGenerationProgress(0);
    let templateData = null;
    let generatedCode = '';

    try {
      // Step 1: Determine project type with retry logic
      setCurrentStep(0);
      let templateResponse;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          templateResponse = await fetch('/api/mvp_builder', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'template',
              prompt: prompt
            })
          });

          if (templateResponse.ok) {
            templateData = await templateResponse.json();
            setGenerationProgress(20);
            break;
          } else {
            throw new Error(`HTTP ${templateResponse.status}: ${templateResponse.statusText}`);
          }
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error(`Failed to determine project type after ${maxRetries} attempts: ${error}`);
          }
          console.warn(`Template request failed, retrying... (${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      // Step 2-5: Generate code using chat with retry logic
      setCurrentStep(1);
      let chatResponse;
      retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          chatResponse = await fetch('/api/mvp_builder', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'chat',
              messages: [
                {
                  role: 'user',
                  content: `Generate a complete MVP application based on this description: ${prompt}. Use the following prompts: ${JSON.stringify(templateData?.prompts || [])}`
                }
              ]
            })
          });

          if (chatResponse.ok) {
            const chatData = await chatResponse.json();
            generatedCode = chatData.response;
            setGenerationProgress(60);
            break;
          } else {
            throw new Error(`HTTP ${chatResponse.status}: ${chatResponse.statusText}`);
          }
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            console.warn(`Code generation failed after ${maxRetries} attempts, using fallback`);
            generatedCode = generateMockCode(prompt);
            break;
          }
          console.warn(`Code generation failed, retrying... (${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
      
      // Simulate remaining steps with progress feedback
      for (let i = 2; i < steps.length; i++) {
        setCurrentStep(i);
        setGenerationProgress(60 + (i - 1) * 10);
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
      }

      // Use generated code or fallback to mock
      if (!generatedCode) {
        generatedCode = generateMockCode(prompt);
      }
      setGeneratedCode(generatedCode);
      setGenerationProgress(90);
      
      // Generate project files for WebContainer
      const files = generateProjectFiles(prompt, generatedCode);
      setProjectFiles(files);
      setGenerationProgress(100);
      
      // Start preview if WebContainer is ready
      if (webContainer) {
        startPreview(files);
      }
    } catch (error) {
      console.error('Error generating MVP:', error);
      
      // Enhanced fallback with user notification
      const mockCode = generateMockCode(prompt);
      setGeneratedCode(mockCode);
      
      // Set error state for UI display
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Generation encountered issues: ${errorMessage}. Using fallback template.`);
      
      // Generate project files even with fallback
      const files = generateProjectFiles(prompt, mockCode);
      setProjectFiles(files);
      setGenerationProgress(100);
      
      // Start preview if WebContainer is ready
      if (webContainer) {
        startPreview(files);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMockCode = (prompt: string) => {
    return `// Generated MVP for: ${prompt}

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize app
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            Your MVP Application
          </h1>
          
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Welcome to your generated application!
            </h2>
            
            <p className="text-gray-600 mb-6">
              This is a basic structure for your MVP. The AI has generated the foundation
              based on your requirements: <strong>${prompt}</strong>
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  Features Included
                </h3>
                <ul className="space-y-2 text-blue-800">
                  <li>• Responsive design</li>
                  <li>• Modern UI components</li>
                  <li>• State management</li>
                  <li>• Animation support</li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-3">
                  Next Steps
                </h3>
                <ul className="space-y-2 text-green-800">
                  <li>• Customize styling</li>
                  <li>• Add your business logic</li>
                  <li>• Integrate APIs</li>
                  <li>• Deploy to production</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 flex gap-4">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                Get Started
              </button>
              <button className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}`;
  };

  const generateProjectFiles = (prompt: string, code: string) => {
    const appName = prompt.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20);
    
    return {
      'package.json': {
        file: {
          contents: JSON.stringify({
            name: appName,
            private: true,
            version: '0.0.0',
            type: 'module',
            scripts: {
              dev: 'vite --host 0.0.0.0 --port 3000',
              build: 'vite build',
              lint: 'eslint . --ext js,jsx,ts,tsx',
              preview: 'vite preview --host 0.0.0.0 --port 4173'
            },
            dependencies: {
              'lucide-react': '^0.344.0',
              'react': '^18.3.1',
              'react-dom': '^18.3.1',
              'framer-motion': '^10.16.4',
              'clsx': '^2.0.0',
              'tailwind-merge': '^2.0.0'
            },
            devDependencies: {
              '@eslint/js': '^9.9.1',
              '@types/react': '^18.3.5',
              '@types/react-dom': '^18.3.0',
              '@vitejs/plugin-react': '^4.3.1',
              'autoprefixer': '^10.4.16',
              'eslint': '^9.9.1',
              'eslint-plugin-react-hooks': '^5.1.0-rc.0',
              'eslint-plugin-react-refresh': '^0.4.9',
              'postcss': '^8.4.31',
              'tailwindcss': '^3.3.5',
              'vite': '^5.4.10'
            }
          }, null, 2)
        }
      },
      'index.html': {
        file: {
          contents: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${prompt}</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`
        }
      },
      'src': {
        directory: {
          'main.jsx': {
            file: {
              contents: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
            }
          },
          'App.jsx': {
            file: {
              contents: code
            }
          }
        }
      },
      'vite.config.js': {
        file: {
          contents: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: {
      port: 3001
    }
  },
  preview: {
    port: 4173,
    host: '0.0.0.0'
  }
})`
        }
      },
      'tailwind.config.js': {
        file: {
          contents: `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}`
        }
      },
      'postcss.config.js': {
        file: {
          contents: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`
        }
      },
      '.eslintrc.cjs': {
        file: {
          contents: `module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}`
        }
      }
    };
  };

  const startPreview = async (files: any) => {
    if (!webContainer) {
      console.error('WebContainer not available');
      setIsPreviewLoading(false);
      return;
    }
    
    setIsPreviewLoading(true);
    
    try {
      // Mount files to WebContainer
      await webContainer.mount(files);
      console.log('Files mounted successfully');
      
      // Install dependencies with timeout
      const installProcess = await webContainer.spawn('npm', ['install'], {
        output: true
      });
      
      // Listen to install output for debugging
      installProcess.output.pipeTo(new WritableStream({
        write(data) {
          console.log('Install output:', data);
        }
      }));
      
      const installExitCode = await installProcess.exit;
      if (installExitCode !== 0) {
        throw new Error(`npm install failed with exit code ${installExitCode}`);
      }
      console.log('Dependencies installed successfully');
      
      // Start dev server
      const devProcess = await webContainer.spawn('npm', ['run', 'dev'], {
        output: true
      });
      
      // Listen to dev server output
      devProcess.output.pipeTo(new WritableStream({
        write(data) {
          console.log('Dev server output:', data);
        }
      }));
      
      // Listen for server ready with timeout
      const serverReadyPromise = new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Server startup timeout'));
        }, 30000); // 30 second timeout
        
        webContainer.on('server-ready', (port, url) => {
          clearTimeout(timeout);
          console.log('Server ready at:', url);
          resolve(url);
        });
      });
      
      const url = await serverReadyPromise;
      setPreviewUrl(url);
      setIsPreviewLoading(false);
      
    } catch (error) {
      console.error('Error starting preview:', error);
      setIsPreviewLoading(false);
      
      // Show user-friendly error message
      alert(`Failed to start preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mvp-app.jsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#030303]">
      {/* Header */}
      <div className="bg-white/[0.02] border-b border-white/[0.05] backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/mvp_builder')}
                className="flex items-center gap-2 text-white/60 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/[0.05]"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <div>
                <h1 className="text-xl font-semibold text-white">MVP Builder</h1>
                <p className="text-sm text-white/60 truncate max-w-md">{prompt}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isPreviewMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/[0.05] text-white/80 hover:bg-white/[0.1] border border-white/[0.1]'
                }`}
              >
                {isPreviewMode ? <Code className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {isPreviewMode ? 'Code' : 'Preview'}
              </button>
              
              {generatedCode && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-green-500/25"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {!generatedCode && !isGenerating && (
          <div className="text-center">
            <div className="bg-white/[0.02] backdrop-blur-lg border border-white/[0.05] rounded-2xl p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Ready to Generate Your MVP?
              </h2>
              <p className="text-white/60 mb-6">
                Click the button below to start generating your application based on your requirements.
              </p>
              <button
                onClick={handleGenerate}
                className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 mx-auto shadow-2xl hover:shadow-blue-500/25"
              >
                <Play className="w-5 h-5" />
                Generate MVP
              </button>
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800 rounded-lg p-8">
              <h2 className="text-2xl font-semibold text-white mb-6 text-center">
                Generating Your MVP
              </h2>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Progress</span>
                  <span>{generationProgress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                      index === currentStep
                        ? 'bg-blue-600/20 border border-blue-500/30'
                        : index < currentStep
                        ? 'bg-green-600/20 border border-green-500/30'
                        : 'bg-gray-700/50 border border-gray-600/30'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index === currentStep
                          ? 'bg-blue-600 text-white'
                          : index < currentStep
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-600 text-gray-400'
                      }`}
                    >
                      {index < currentStep ? (
                        <div className="w-4 h-4 bg-white rounded-full" />
                      ) : index === currentStep ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{step.title}</h3>
                      <p className="text-sm text-gray-400">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* WebContainer Status */}
              <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${isWebContainerReady ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-gray-300">
                    WebContainer: {isWebContainerReady ? 'Ready' : 'Initializing...'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-black font-bold">!</span>
                </div>
                <div>
                  <h3 className="text-yellow-400 font-medium mb-1">Notice</h3>
                  <p className="text-yellow-200 text-sm">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {generatedCode && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Code Editor */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="bg-gray-700 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Generated Code</span>
                  <span className="text-xs text-gray-500">({generatedCode.length} characters)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedCode)}
                    className="text-gray-400 hover:text-white transition-colors text-xs px-2 py-1 rounded bg-gray-600/50 hover:bg-gray-600"
                    title="Copy code"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => setGeneratedCode('')}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Clear code"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 max-h-96 overflow-auto">
                <pre className="text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap">
                  <code>{generatedCode}</code>
                </pre>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="bg-gray-700 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Live Preview</span>
                  {previewUrl && (
                    <span className="text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded">
                      Live
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isPreviewLoading && (
                    <div className="flex items-center gap-2 text-blue-400">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span className="text-xs">Starting server...</span>
                    </div>
                  )}
                  {previewUrl && (
                    <button
                      onClick={() => window.open(previewUrl, '_blank')}
                      className="text-gray-400 hover:text-white transition-colors text-xs px-2 py-1 rounded bg-gray-600/50 hover:bg-gray-600"
                      title="Open in new tab"
                    >
                      Open
                    </button>
                  )}
                </div>
              </div>
              <div className="bg-white min-h-96 relative">
                {isPreviewLoading ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Starting Preview...
                      </h3>
                      <p className="text-gray-600 mb-2">
                        Installing dependencies and starting dev server
                      </p>
                      <div className="text-xs text-gray-500">
                        WebContainer: {isWebContainerReady ? 'Ready' : 'Initializing...'}
                      </div>
                    </div>
                  </div>
                ) : previewUrl ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-96 border-0"
                    title="Live Preview"
                    onError={() => console.error('Preview iframe failed to load')}
                  />
                ) : (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Play className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Preview Ready
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Your MVP will appear here once the server starts
                      </p>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={handleDownload}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Download Code
                        </button>
                        {!isWebContainerReady && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                            Waiting for WebContainer...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
