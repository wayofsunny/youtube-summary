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

  // Start preview when WebContainer is ready and we have files
  useEffect(() => {
    if (webContainer && projectFiles && !previewUrl) {
      startPreview(projectFiles);
    }
  }, [webContainer, projectFiles, previewUrl]);

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

    try {
      // Step 1: Determine project type
      setCurrentStep(0);
      const templateResponse = await fetch('/api/mvp_builder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'template',
          prompt: prompt
        })
      });

      if (!templateResponse.ok) {
        throw new Error('Failed to determine project type');
      }

      const templateData = await templateResponse.json();
      
      // Step 2-5: Generate code using chat
      setCurrentStep(1);
      const chatResponse = await fetch('/api/mvp_builder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'chat',
          messages: [
            {
              role: 'user',
              content: `Generate a complete MVP application based on this description: ${prompt}. Use the following prompts: ${JSON.stringify(templateData.prompts)}`
            }
          ]
        })
      });

      if (!chatResponse.ok) {
        throw new Error('Failed to generate code');
      }

      const chatData = await chatResponse.json();
      
      // Simulate remaining steps
      for (let i = 2; i < steps.length; i++) {
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Use generated code or fallback to mock
      const generatedCode = chatData.response || generateMockCode(prompt);
      setGeneratedCode(generatedCode);
      
      // Generate project files for WebContainer
      const files = generateProjectFiles(prompt, generatedCode);
      setProjectFiles(files);
      
      // Start preview if WebContainer is ready
      if (webContainer) {
        startPreview(files);
      }
    } catch (error) {
      console.error('Error generating MVP:', error);
      // Fallback to mock code on error
      const mockCode = generateMockCode(prompt);
      setGeneratedCode(mockCode);
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
              dev: 'vite',
              build: 'vite build',
              lint: 'eslint .',
              preview: 'vite preview'
            },
            dependencies: {
              'lucide-react': '^0.344.0',
              'react': '^18.3.1',
              'react-dom': '^18.3.1',
              'framer-motion': '^10.16.4'
            },
            devDependencies: {
              '@eslint/js': '^9.9.1',
              '@types/react': '^18.3.5',
              '@types/react-dom': '^18.3.0',
              '@vitejs/plugin-react': '^4.3.1',
              'eslint': '^9.9.1',
              'eslint-plugin-react-hooks': '^5.1.0-rc.0',
              'eslint-plugin-react-refresh': '^0.4.9',
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
    host: true
  }
})`
        }
      }
    };
  };

  const startPreview = async (files: any) => {
    if (!webContainer) return;
    
    setIsPreviewLoading(true);
    
    try {
      // Mount files to WebContainer
      await webContainer.mount(files);
      
      // Install dependencies
      const installProcess = await webContainer.spawn('npm', ['install']);
      await installProcess.exit;
      
      // Start dev server
      const devProcess = await webContainer.spawn('npm', ['run', 'dev']);
      
      // Listen for server ready
      webContainer.on('server-ready', (port, url) => {
        console.log('Server ready at:', url);
        setPreviewUrl(url);
        setIsPreviewLoading(false);
      });
      
    } catch (error) {
      console.error('Error starting preview:', error);
      setIsPreviewLoading(false);
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
                </div>
                <button
                  onClick={() => setGeneratedCode('')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Square className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                <pre className="text-sm text-gray-300 overflow-x-auto">
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
                </div>
                {isPreviewLoading && (
                  <div className="flex items-center gap-2 text-blue-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-xs">Starting server...</span>
                  </div>
                )}
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
                      <p className="text-gray-600">
                        Installing dependencies and starting dev server
                      </p>
                    </div>
                  </div>
                ) : previewUrl ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-96 border-0"
                    title="Live Preview"
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
                        Your MVP will appear here once generated
                      </p>
                      <button
                        onClick={handleDownload}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Download Code
                      </button>
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
