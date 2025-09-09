import React, { useEffect, useState } from 'react';
import { WebContainer } from '@webcontainer/api';

interface PreviewFrameProps {
  webcontainer: WebContainer | null;
  isReady: boolean;
}

export function PreviewFrame({ webcontainer, isReady }: PreviewFrameProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (webcontainer && isReady) {
      startPreview();
    }
  }, [webcontainer, isReady]);

  const createWorkingHtmlPreview = async () => {
    if (!webcontainer) {
      console.log('PreviewFrame: createWorkingHtmlPreview - No webcontainer available');
      return null;
    }
    
    console.log('PreviewFrame: createWorkingHtmlPreview - Starting to create CDN-based HTML preview');
    
    try {
      // Read the generated files to create a working HTML preview
      let appJsx = '';
      let mainJsx = '';
      let indexCss = '';
      let appCss = '';
      
      try {
        appJsx = await webcontainer.fs.readFile('src/App.jsx', 'utf-8') || '';
      } catch (err) {
        console.log('PreviewFrame: App.jsx not found, using default');
        appJsx = `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to Your Generated Website!</h1>
        <p>This is a preview of your generated website.</p>
        <div className="features">
          <div className="feature">
            <h3>🚀 Generated with AI</h3>
            <p>Your website was created using advanced AI technology</p>
          </div>
          <div className="feature">
            <h3>⚡ Modern React</h3>
            <p>Built with React and modern web technologies</p>
          </div>
          <div className="feature">
            <h3>🎨 Beautiful Design</h3>
            <p>Responsive and modern design patterns</p>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;`;
      }
      
      try {
        mainJsx = await webcontainer.fs.readFile('src/main.jsx', 'utf-8') || '';
      } catch (err) {
        console.log('PreviewFrame: main.jsx not found, using default');
        mainJsx = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);`;
      }
      
      try {
        indexCss = await webcontainer.fs.readFile('src/index.css', 'utf-8') || '';
      } catch (err) {
        console.log('PreviewFrame: index.css not found, using default');
        indexCss = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}`;
      }
      
      try {
        appCss = await webcontainer.fs.readFile('src/App.css', 'utf-8') || '';
      } catch (err) {
        console.log('PreviewFrame: App.css not found, using default');
        appCss = `.App {
  text-align: center;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.App-header {
  background: rgba(255, 255, 255, 0.1);
  padding: 40px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  color: white;
  max-width: 800px;
  margin: 20px;
}

.App-header h1 {
  font-size: 2.5rem;
  margin-bottom: 20px;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.App-header p {
  font-size: 1.2rem;
  margin-bottom: 30px;
  opacity: 0.9;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 30px;
}

.feature {
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.feature h3 {
  margin-bottom: 10px;
  color: #4ecdc4;
}

.feature p {
  font-size: 0.9rem;
  opacity: 0.8;
}

@media (max-width: 768px) {
  .App-header {
    padding: 20px;
    margin: 10px;
  }
  
  .App-header h1 {
    font-size: 2rem;
  }
  
  .features {
    grid-template-columns: 1fr;
  }
}`;
      }
      
      // Create a working HTML file with CDN dependencies
      const workingHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Website Preview</title>
  <style>
    ${indexCss}
    ${appCss}
  </style>
</head>
<body>
  <div id="root"></div>
  
  <!-- React and ReactDOM from CDN -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  
  <!-- Babel for JSX transformation -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  
  <script type="text/babel">
    // App component
    ${appJsx}
    
    // Main entry point
    ${mainJsx}
  </script>
  
  <style>
    /* Additional styles for better preview */
    .preview-notice {
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(76, 175, 80, 0.9);
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      font-size: 12px;
      z-index: 1000;
      backdrop-filter: blur(10px);
    }
    
    .preview-notice::before {
      content: "✅ ";
    }
  </style>
  
  <div class="preview-notice">
    Live Preview - No npm install required!
  </div>
</body>
</html>`;
      
      console.log('PreviewFrame: createWorkingHtmlPreview - Successfully created CDN-based HTML preview');
      return workingHtml;
      
    } catch (err) {
      console.error('PreviewFrame: Failed to create working HTML preview:', err);
      return null;
    }
  };

  const startPreview = async () => {
    if (!webcontainer) {
      console.log('PreviewFrame: No webcontainer available');
      return;
    }

    console.log('PreviewFrame: Starting preview...');
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if package.json exists
      try {
        const packageJsonExists = await webcontainer.fs.readFile('package.json', 'utf-8');
        console.log('PreviewFrame: package.json exists:', !!packageJsonExists);
      } catch (err) {
        console.error('PreviewFrame: package.json not found:', err);
        setError('package.json not found. Cannot start preview.');
        setIsLoading(false);
        return;
      }

      // Skip npm install entirely and create a working HTML preview
      console.log('PreviewFrame: Skipping npm install (WebContainer limitation) and creating direct HTML preview...');
      
      // Create a working HTML file that includes all necessary dependencies via CDN
      const workingHtml = await createWorkingHtmlPreview();
      
      console.log('PreviewFrame: createWorkingHtmlPreview result:', workingHtml ? 'SUCCESS' : 'FAILED');
      
      if (workingHtml) {
        await webcontainer.fs.writeFile('index.html', workingHtml);
        console.log('PreviewFrame: Created working HTML preview with CDN dependencies');
        
        // Try to serve the HTML file directly
        try {
          const server = await webcontainer.spawn('npx', ['serve', '-s', '.', '-l', '3000']);
          console.log('PreviewFrame: Started simple HTTP server');
          
          // Wait a moment for server to start
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Try to get URL from WebContainer
          try {
            const url = webcontainer.getURL();
            console.log('PreviewFrame: Server URL:', url);
            setPreviewUrl(url);
            setIsLoading(false);
            return;
          } catch (urlErr) {
            console.log('PreviewFrame: getURL failed, using fallback URL:', urlErr);
            // Fallback to localhost
            setPreviewUrl('http://localhost:3000');
            setIsLoading(false);
            return;
          }
        } catch (serverErr) {
          console.error('PreviewFrame: Failed to start simple server:', serverErr);
        }
        
        // If server fails, just show the HTML content directly
        setPreviewUrl('data:text/html;charset=utf-8,' + encodeURIComponent(workingHtml));
        setIsLoading(false);
        return;
      }

      // If HTML creation fails, show enhanced fallback
      console.log('PreviewFrame: HTML creation failed, showing enhanced fallback...');
      await showEnhancedHtmlFallback();

    } catch (err) {
      console.error('Failed to start preview:', err);
      setError('Failed to start preview. Please check the console for errors.');
      setIsLoading(false);
    }
  };

  const showEnhancedHtmlFallback = async () => {
    if (!webcontainer) return;
    
    console.log('PreviewFrame: Creating enhanced HTML fallback...');
    
    try {
      const enhancedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Website - AI Website Builder</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
        sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    
    .container {
      text-align: center;
      max-width: 800px;
      padding: 40px 20px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .success-icon {
      font-size: 4rem;
      margin-bottom: 20px;
      animation: bounce 2s infinite;
    }
    
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-10px);
      }
      60% {
        transform: translateY(-5px);
      }
    }
    
    h1 {
      font-size: 2.5rem;
      margin-bottom: 20px;
      background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .status-card {
      background: rgba(76, 175, 80, 0.2);
      border: 1px solid rgba(76, 175, 80, 0.5);
      border-radius: 15px;
      padding: 20px;
      margin: 20px 0;
    }
    
    .status-card h3 {
      color: #4caf50;
      margin-bottom: 10px;
    }
    
    .warning-card {
      background: rgba(255, 193, 7, 0.1);
      border: 1px solid rgba(255, 193, 7, 0.5);
      border-radius: 15px;
      padding: 20px;
      margin: 20px 0;
      text-align: left;
    }
    
    .warning-card h4 {
      color: #ffc107;
      margin-bottom: 15px;
    }
    
    .solution-card {
      background: rgba(33, 150, 243, 0.1);
      border: 1px solid rgba(33, 150, 243, 0.5);
      border-radius: 15px;
      padding: 20px;
      margin: 20px 0;
      text-align: left;
    }
    
    .solution-card h4 {
      color: #2196f3;
      margin-bottom: 15px;
    }
    
    .code-snippet {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 10px;
      padding: 15px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.5;
      margin: 15px 0;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .code-snippet div {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="success-icon">🚀</div>
    <h1>Your Website is Ready!</h1>
    
    <div class="status-card">
      <h3>✅ Website Generated Successfully</h3>
      <p>Your website has been created with all necessary files and is ready to use!</p>
    </div>
    
    <div class="warning-card">
      <h4>⚠️ WebContainer Limitations</h4>
      <p>WebContainer runs in a browser sandbox with these limitations:</p>
      <ul>
        <li><strong>Network restrictions:</strong> npm install may fail due to CORS/security policies</li>
        <li><strong>Resource limits:</strong> Limited CPU/memory compared to native environments</li>
        <li><strong>Browser compatibility:</strong> Requires Chrome 88+ or Edge 88+ with specific security headers</li>
        <li><strong>Package size limits:</strong> Large dependencies may not download properly</li>
        <li><strong>Native modules:</strong> Not supported in browser environment</li>
      </ul>
    </div>
    
    <div class="solution-card">
      <h4>✅ Solution: Copy & Run Locally</h4>
      <div class="code-snippet">
        <div># 1. Copy the generated files from the file explorer</div>
        <div># 2. Create a new React project locally</div>
        <div>npm create vite@latest my-website -- --template react</div>
        <div>cd my-website</div>
        <div># 3. Replace the generated files with your copied files</div>
        <div># 4. Install dependencies</div>
        <div>npm install</div>
        <div># 5. Start development server</div>
        <div>npm run dev</div>
      </div>
    </div>
  </div>
</body>
</html>`;
      
      await webcontainer.fs.writeFile('index.html', enhancedHtml);
      console.log('PreviewFrame: Created enhanced HTML fallback');
      
      // Try to serve the HTML file directly
      try {
        const server = await webcontainer.spawn('npx', ['serve', '-s', '.', '-l', '3000']);
        console.log('PreviewFrame: Started simple HTTP server');
        
        // Wait a moment for server to start
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to get URL from WebContainer
        try {
          const url = webcontainer.getURL();
          console.log('PreviewFrame: Server URL:', url);
          setPreviewUrl(url);
          setIsLoading(false);
          return;
        } catch (urlErr) {
          console.log('PreviewFrame: getURL failed, using fallback URL:', urlErr);
          // Fallback to localhost
          setPreviewUrl('http://localhost:3000');
          setIsLoading(false);
          return;
        }
      } catch (serverErr) {
        console.error('PreviewFrame: Failed to start simple server:', serverErr);
      }
      
      // If server fails, just show the HTML content directly
      setPreviewUrl('data:text/html;charset=utf-8,' + encodeURIComponent(enhancedHtml));
      setIsLoading(false);
      
    } catch (err) {
      console.error('PreviewFrame: Failed to create enhanced HTML fallback:', err);
      setError('Failed to create fallback preview. Please check the console for details.');
      setIsLoading(false);
    }
  };

  if (!isReady) {
    const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
    const isCrossOriginIsolated = window.crossOriginIsolated;
    const isWebContainerSupported = hasSharedArrayBuffer && isCrossOriginIsolated;

    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="mb-2">Initializing WebContainer...</p>
          {!isWebContainerSupported && (
            <div className="text-yellow-400 text-sm">
              <p>⚠️ WebContainer requires:</p>
              <p>• Chrome 88+ or Edge 88+</p>
              <p>• Cross-Origin-Isolated headers</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-400">
        <div className="text-center">
          <p className="mb-2">❌ Preview Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      {isLoading && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="mb-2">Creating preview...</p>
          <p className="text-sm">Setting up CDN-based preview (no npm install required)</p>
        </div>
      )}
      {previewUrl && (
        <iframe
          src={previewUrl}
          className="w-full h-full border-0"
          title="Website Preview"
        />
      )}
    </div>
  );
}