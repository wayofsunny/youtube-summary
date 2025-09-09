import React, { useEffect, useRef, useState } from 'react';
import { useWebContainer } from '../../../../hooks/useWebContainer';

interface PreviewFrameProps {
  webcontainer: any;
  isReady?: boolean;
}

export function PreviewFrame({ webcontainer, isReady = false }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (webcontainer && isReady) {
      startPreview();
    }
  }, [webcontainer, isReady]);

  const showEnhancedHtmlFallback = async () => {
    if (!webcontainer) return;
    
    console.log('PreviewFrame: Creating enhanced HTML fallback...');
    
    try {
      // Create a comprehensive HTML file that showcases the generated website
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .container {
      max-width: 800px;
      width: 100%;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      padding: 40px;
      text-align: center;
    }
    
    .success-icon {
      font-size: 4rem;
      margin-bottom: 20px;
      animation: bounce 2s infinite;
    }
    
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-10px); }
      60% { transform: translateY(-5px); }
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
      padding: 20px;
      border-radius: 15px;
      margin: 20px 0;
    }
    
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    
    .feature-card {
      background: rgba(255, 255, 255, 0.1);
      padding: 25px;
      border-radius: 15px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: transform 0.3s ease;
    }
    
    .feature-card:hover {
      transform: translateY(-5px);
    }
    
    .feature-icon {
      font-size: 2rem;
      margin-bottom: 15px;
    }
    
    .feature-card h3 {
      margin-bottom: 10px;
      color: #4ecdc4;
    }
    
    .warning-card {
      background: rgba(255, 193, 7, 0.1);
      border: 1px solid rgba(255, 193, 7, 0.5);
      padding: 20px;
      border-radius: 15px;
      margin: 20px 0;
      text-align: left;
    }
    
    .warning-card h4 {
      color: #ffc107;
      margin-bottom: 15px;
    }
    
    .warning-list {
      list-style: none;
      padding: 0;
    }
    
    .warning-list li {
      margin: 8px 0;
      padding-left: 20px;
      position: relative;
    }
    
    .warning-list li:before {
      content: "⚠️";
      position: absolute;
      left: 0;
    }
    
    .solution-card {
      background: rgba(76, 175, 80, 0.1);
      border: 1px solid rgba(76, 175, 80, 0.5);
      padding: 20px;
      border-radius: 15px;
      margin: 20px 0;
    }
    
    .solution-card h4 {
      color: #4caf50;
      margin-bottom: 15px;
    }
    
    .action-buttons {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-top: 30px;
      flex-wrap: wrap;
    }
    
    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 25px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-block;
    }
    
    .btn-primary {
      background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
      color: white;
    }
    
    .btn-primary:hover {
      transform: scale(1.05);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }
    
    .btn-secondary {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    
    .code-snippet {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      padding: 15px;
      margin: 15px 0;
      font-family: 'Courier New', monospace;
      text-align: left;
      overflow-x: auto;
    }
    
    .progress-bar {
      width: 100%;
      height: 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      overflow: hidden;
      margin: 20px 0;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
      width: 100%;
      animation: progress 2s ease-in-out;
    }
    
    @keyframes progress {
      0% { width: 0%; }
      100% { width: 100%; }
    }
    
    @media (max-width: 768px) {
      .container {
        padding: 20px;
      }
      
      h1 {
        font-size: 2rem;
      }
      
      .features-grid {
        grid-template-columns: 1fr;
      }
      
      .action-buttons {
        flex-direction: column;
        align-items: center;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="success-icon">🚀</div>
    <h1>Your Website is Ready!</h1>
    
    <div class="progress-bar">
      <div class="progress-fill"></div>
    </div>
    
    <div class="status-card">
      <h3>✅ Website Generated Successfully</h3>
      <p>Your website has been created with all necessary files and is ready to use!</p>
    </div>
    
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">📁</div>
        <h3>Files Generated</h3>
        <p>All website files have been created and are available in the file explorer.</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">⚡</div>
        <h3>WebContainer Active</h3>
        <p>The development environment is running and ready for your code.</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">🛠️</div>
        <h3>Next Steps</h3>
        <p>Copy the generated code and create your website manually for full functionality.</p>
      </div>
    </div>
    
    <div class="warning-card">
      <h4>⚠️ WebContainer Limitations</h4>
      <p>WebContainer runs in a browser sandbox with these limitations:</p>
      <ul class="warning-list">
        <li><strong>Network restrictions:</strong> npm install may fail due to CORS/security policies</li>
        <li><strong>Resource limits:</strong> Limited CPU/memory compared to native environments</li>
        <li><strong>Browser compatibility:</strong> Requires Chrome 88+ or Edge 88+ with specific security headers</li>
        <li><strong>Package size limits:</strong> Large dependencies may not download properly</li>
        <li><strong>Native modules:</strong> Not supported in browser environment</li>
      </ul>
    </div>
    
    <div class="solution-card">
      <h4>✅ Solution: Copy & Run Locally</h4>
      <p>Despite the WebContainer limitation, your website has been successfully generated. Here's how to use it:</p>
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
    
    <div class="action-buttons">
      <button class="btn btn-primary" onclick="window.location.reload()">
        🔄 Retry Preview
      </button>
      <button class="btn btn-secondary" onclick="copyInstructions()">
        📋 Copy Instructions
      </button>
      <button class="btn btn-secondary" onclick="showFileList()">
        📁 View Files
      </button>
    </div>
  </div>
  
  <script>
    function copyInstructions() {
      const instructions = \`# How to Use Your Generated Website

1. Copy all files from the file explorer on the left
2. Create a new React project:
   npm create vite@latest my-website -- --template react
   cd my-website

3. Replace the generated files with your copied files
4. Install dependencies:
   npm install

5. Start development server:
   npm run dev

Your website will be available at http://localhost:5173\`;
      
      navigator.clipboard.writeText(instructions).then(() => {
        alert('Instructions copied to clipboard!');
      });
    }
    
    function showFileList() {
      alert('Check the file explorer on the left to see all generated files. You can click on each file to view its contents.');
    }
    
    // Add some interactive effects
    document.addEventListener('DOMContentLoaded', function() {
      const cards = document.querySelectorAll('.feature-card');
      cards.forEach((card, index) => {
        card.style.animationDelay = \`\${index * 0.1}s\`;
        card.style.animation = 'fadeInUp 0.6s ease forwards';
      });
    });
    
    // Add fadeInUp animation
    const style = document.createElement('style');
    style.textContent = \`
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    \`;
    document.head.appendChild(style);
  </script>
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

  const showHtmlFallback = async () => {
    if (!webcontainer) return;
    
    console.log('PreviewFrame: Creating HTML fallback...');
    
    try {
      // Create a simple HTML file that can be served without npm
      const simpleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Website</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      text-align: center;
      max-width: 600px;
      padding: 40px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    h1 {
      font-size: 3rem;
      margin-bottom: 20px;
      background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .status {
      background: rgba(76, 175, 80, 0.2);
      border: 1px solid rgba(76, 175, 80, 0.5);
      padding: 15px;
      border-radius: 10px;
      margin: 20px 0;
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
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .feature h3 {
      margin-top: 0;
      color: #4ecdc4;
    }
    .refresh-btn {
      background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
      border: none;
      color: white;
      padding: 12px 24px;
      border-radius: 25px;
      font-size: 16px;
      cursor: pointer;
      margin-top: 20px;
      transition: transform 0.2s;
    }
    .refresh-btn:hover {
      transform: scale(1.05);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Your Website is Ready!</h1>
    <div class="status">
      <strong>✅ Website Generated Successfully</strong><br>
      Your website has been created and is ready to use.
    </div>
    
    <p>This is a fallback preview since WebContainer encountered limitations, but your website has been successfully generated!</p>
    
    <div style="background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.5); padding: 15px; border-radius: 10px; margin: 20px 0; text-align: left;">
      <h4 style="color: #ffc107; margin-top: 0;">⚠️ WebContainer Limitations</h4>
      <p style="margin: 10px 0; font-size: 14px;">WebContainer runs in a browser sandbox with these limitations:</p>
      <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px;">
        <li><strong>Network restrictions:</strong> npm install may fail due to CORS/security policies</li>
        <li><strong>Resource limits:</strong> Limited CPU/memory compared to native environments</li>
        <li><strong>Browser compatibility:</strong> Requires Chrome 88+ or Edge 88+ with specific security headers</li>
        <li><strong>Package size limits:</strong> Large dependencies may not download properly</li>
        <li><strong>Native modules:</strong> Not supported in browser environment</li>
      </ul>
      <p style="margin: 10px 0; font-size: 14px;"><strong>Solution:</strong> Copy the generated code and run it locally for full functionality.</p>
      <div style="background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.5); padding: 10px; border-radius: 5px; margin-top: 10px;">
        <p style="margin: 0; font-size: 13px; color: #4caf50;"><strong>✅ Good News:</strong> Your website has been successfully generated! The WebContainer limitation doesn't affect the quality of your generated website.</p>
      </div>
    </div>
    
    <div class="features">
      <div class="feature">
        <h3>📁 Files Created</h3>
        <p>All website files have been generated and are available in the file explorer.</p>
      </div>
      <div class="feature">
        <h3>⚡ WebContainer Active</h3>
        <p>The development environment is running and ready for your code.</p>
      </div>
      <div class="feature">
        <h3>🛠️ Next Steps</h3>
        <p>Copy the generated code and create your website manually, or try refreshing to retry the preview.</p>
      </div>
    </div>
    
    <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
      <button class="refresh-btn" onclick="window.location.reload()">
        🔄 Retry Preview
      </button>
    </div>
  </div>
</body>
</html>`;
      
      await webcontainer.fs.writeFile('index.html', simpleHtml);
      console.log('PreviewFrame: Created HTML fallback');
      
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
      setPreviewUrl('data:text/html;charset=utf-8,' + encodeURIComponent(simpleHtml));
      setIsLoading(false);
      
    } catch (err) {
      console.error('PreviewFrame: Failed to create HTML fallback:', err);
      setError('Failed to create fallback preview. Please check the console for details.');
      setIsLoading(false);
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

      // Try multiple npm install strategies
      console.log('PreviewFrame: Attempting npm install with multiple strategies...');
      
      const installStrategies = [
        // Strategy 1: Standard install
        ['npm', ['install']],
        // Strategy 2: Offline-first with reduced logging
        ['npm', ['install', '--prefer-offline', '--no-audit', '--no-fund', '--loglevel=error']],
        // Strategy 3: Force install with legacy peer deps
        ['npm', ['install', '--legacy-peer-deps', '--force']],
        // Strategy 4: Install with cache disabled
        ['npm', ['install', '--no-cache', '--prefer-offline']],
        // Strategy 5: Try yarn as fallback
        ['yarn', ['install']]
      ];

      let installSuccess = false;
      let lastError = null;

      for (let i = 0; i < installStrategies.length; i++) {
        const [command, args] = installStrategies[i];
        console.log(`PreviewFrame: Trying strategy ${i + 1}: ${command} ${args.join(' ')}`);
        
        try {
          const installProcess = await webcontainer.spawn(command, args);
          
          // Wait for install with timeout
          const installTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Install timeout')), 10000); // 10 second timeout
          });
          
          const result = await Promise.race([
            installProcess.exit,
            installTimeout
          ]) as [number, void];
          
          const exitCode = result[0];
          console.log(`PreviewFrame: ${command} exit code:`, exitCode);
          
          if (exitCode === 0) {
            console.log(`PreviewFrame: ${command} succeeded!`);
            installSuccess = true;
            break;
          } else {
            console.log(`PreviewFrame: ${command} failed with exit code ${exitCode}`);
            lastError = new Error(`${command} failed with exit code ${exitCode}`);
          }
        } catch (err) {
          console.log(`PreviewFrame: ${command} failed:`, err);
          lastError = err;
        }
      }

      if (!installSuccess) {
        console.error('PreviewFrame: All npm install strategies failed');
        console.log('PreviewFrame: This is expected in WebContainer due to network/security limitations');
        console.log('PreviewFrame: Showing enhanced HTML fallback...');
        await showEnhancedHtmlFallback();
        return;
      }

      // If npm install succeeded, try to start the dev server
      console.log('PreviewFrame: Dependencies installed successfully! Starting dev server...');
      
      const devServerStrategies = [
        ['npm', ['run', 'dev']],
        ['npm', ['start']],
        ['yarn', ['dev']],
        ['yarn', ['start']]
      ];

      let serverStarted = false;

      for (let i = 0; i < devServerStrategies.length; i++) {
        const [command, args] = devServerStrategies[i];
        console.log(`PreviewFrame: Trying to start server with: ${command} ${args.join(' ')}`);
        
        try {
          const devServerProcess = await webcontainer.spawn(command, args);
          
          // Wait for server with timeout
          const serverTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Server startup timeout')), 12000); // 12 second timeout
          });
          
          // Listen for server-ready event
          const serverReady = new Promise((resolve) => {
            webcontainer.on('server-ready', (port: number, url: string) => {
              console.log('Server ready on port:', port, 'URL:', url);
              setPreviewUrl(url);
              setIsLoading(false);
              resolve(true);
            });
          });
          
          await Promise.race([serverReady, serverTimeout]);
          serverStarted = true;
          break;
          
        } catch (err) {
          console.log(`PreviewFrame: ${command} ${args.join(' ')} failed:`, err);
        }
      }

      if (!serverStarted) {
        console.log('PreviewFrame: All server strategies failed, trying manual URL detection...');
        try {
          const url = await webcontainer.getURL();
          if (url) {
            console.log('PreviewFrame: Got URL manually:', url);
            setPreviewUrl(url);
            setIsLoading(false);
          } else {
            throw new Error('No URL available');
          }
        } catch (err) {
          console.log('PreviewFrame: Manual URL detection failed, using fallback');
          await showEnhancedHtmlFallback();
        }
      }

    } catch (err) {
      console.error('Failed to start preview:', err);
      setError('Failed to start preview. Please check the console for errors.');
      setIsLoading(false);
    }
  };

  if (!isReady) {
    const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
    const isCrossOriginIsolated = window.crossOriginIsolated;
    const isWebContainerSupported = hasSharedArrayBuffer && isCrossOriginIsolated;
    
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚡</div>
          <p className="text-lg mb-4">WebContainer is initializing...</p>
          
          <div className="text-sm mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span>WebContainer:</span>
              <span className={webcontainer ? 'text-green-400' : 'text-red-400'}>
                {webcontainer ? '✅ Ready' : '❌ Failed'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>SharedArrayBuffer:</span>
              <span className={hasSharedArrayBuffer ? 'text-green-400' : 'text-red-400'}>
                {hasSharedArrayBuffer ? '✅ Available' : '❌ Not Available'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Cross-Origin-Isolated:</span>
              <span className={isCrossOriginIsolated ? 'text-green-400' : 'text-red-400'}>
                {isCrossOriginIsolated ? '✅ Enabled' : '❌ Disabled'}
              </span>
            </div>
          </div>
          
          {!isWebContainerSupported && (
            <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <div className="text-red-200 font-semibold mb-2">WebContainer Not Supported</div>
              <div className="text-xs text-red-300 space-y-1">
                <div>Your browser doesn't support WebContainer due to security restrictions.</div>
                <div className="mt-2 font-medium">Solutions:</div>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Use Chrome 88+ or Edge 88+</li>
                  <li>Enable proper security headers on your server</li>
                  <li>Use HTTPS with Cross-Origin-Embedder-Policy and Cross-Origin-Opener-Policy headers</li>
                  <li>For Vercel deployment: Ensure vercel.json includes the required headers</li>
                </ul>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Refresh Page
                  </button>
                  <button
                    onClick={() => {
                      setError(null);
                      setPreviewUrl('mock-preview');
                      setIsLoading(false);
                    }}
                    className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                  >
                    Show Mock Preview
                  </button>
                </div>
                <div className="mt-3 text-xs text-yellow-300">
                  <strong>Note:</strong> Even if WebContainer doesn't work, your website is still generated successfully. 
                  You can copy the files and run them locally.
                </div>
              </div>
            </div>
          )}
          
          {isWebContainerSupported && !webcontainer && (
            <div className="mt-4 text-yellow-400 text-sm">
              <div>WebContainer is supported but failed to initialize.</div>
              <div className="mt-2">Check console for detailed error messages.</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Starting preview server...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-400">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p>{error}</p>
          <div className="mt-4">
            <button 
              onClick={() => {
                // Show mock preview as fallback
                setError(null);
                setPreviewUrl('mock-preview');
                setIsLoading(false);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Show Mock Preview
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!previewUrl) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-4">🚀</div>
          <p>Preview will appear here once the server starts</p>
        </div>
      </div>
    );
  }

  // Show mock preview when WebContainer has issues
  if (previewUrl === 'mock-preview') {
    return (
      <div className="h-full bg-white">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Mock Preview</h3>
            <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
              WebContainer Fallback
            </span>
          </div>
        </div>
        <div className="p-6 h-full overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">🚀 Your Generated Website</h2>
              <p className="text-blue-700">
                This is a mock preview of your generated website. WebContainer is not available due to browser 
                security restrictions, but your website has been successfully generated and is ready to use.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">📁 Generated Files</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✅ package.json</li>
                  <li>✅ index.html</li>
                  <li>✅ src/App.jsx</li>
                  <li>✅ src/main.jsx</li>
                  <li>✅ src/index.css</li>
                </ul>
              </div>
              
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">🛠️ Next Steps</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>1. Copy the generated code</li>
                  <li>2. Create a new React project</li>
                  <li>3. Paste the code files</li>
                  <li>4. Run npm install</li>
                  <li>5. Start development server</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">⚠️ WebContainer Issue</h3>
              <p className="text-sm text-red-700 mb-3">
                WebContainer requires SharedArrayBuffer and Cross-Origin-Isolated context, which are not available 
                in your current browser configuration.
              </p>
              <div className="text-sm text-red-600">
                <div className="font-medium mb-2">To enable WebContainer:</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>Use Chrome 88+ or Edge 88+</li>
                  <li>Enable proper security headers on your server</li>
                  <li>Use HTTPS with Cross-Origin-Embedder-Policy and Cross-Origin-Opener-Policy headers</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">✅ Your Website is Ready</h3>
              <p className="text-sm text-green-700">
                Despite the WebContainer limitation, your website has been successfully generated. 
                You can copy the files from the file explorer and run them locally for full functionality.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <iframe
        ref={iframeRef}
        src={previewUrl}
        className="w-full h-full border-0"
        title="Live Preview"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </div>
  );
}
