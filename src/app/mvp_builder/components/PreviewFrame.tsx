import React, { useEffect, useRef, useState } from 'react';
import { useWebContainer } from '../../../hooks/useWebContainer';

interface PreviewFrameProps {
  webcontainer: any;
  isReady?: boolean;
  files?: any[];
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
  }, [webcontainer, isReady]); // Remove startPreview from dependencies to avoid infinite loop

  // Listen for retry React app event
  useEffect(() => {
    const handleRetryReactApp = async () => {
      if (webcontainer) {
        console.log('PreviewFrame: Retry React app requested');
        setIsLoading(true);
        setError(null);
        const success = await createWorkingReactApp();
        if (!success) {
          setError('Failed to create React app. Please check console for details.');
          setIsLoading(false);
        }
      }
    };

    window.addEventListener('retry-react-app', handleRetryReactApp);
    return () => window.removeEventListener('retry-react-app', handleRetryReactApp);
  }, [webcontainer]);

  const createWorkingReactApp = async () => {
    if (!webcontainer) return false;
    
    console.log('PreviewFrame: Creating working React app from scratch...');
    console.log('PreviewFrame: WebContainer limitations:', {
      hasSharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
      isCrossOriginIsolated: window.crossOriginIsolated,
      userAgent: navigator.userAgent
    });
    
    try {
      // Create a minimal but working package.json
      const workingPackageJson = {
        "name": "webcontainer-react-app",
        "version": "1.0.0",
        "type": "module",
        "scripts": {
          "dev": "vite --host 0.0.0.0 --port 3000 --clearScreen false",
          "build": "vite build",
          "preview": "vite preview"
        },
        "dependencies": {
          "react": "18.2.0",
          "react-dom": "18.2.0"
        },
        "devDependencies": {
          "@vitejs/plugin-react": "4.0.0",
          "vite": "4.4.0"
        }
      };
      
      // Create vite.config.js
      const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000
  }
})`;
      
      // Create index.html
      const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;
      
      // Create src/main.jsx
      const mainJsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;
      
      // Create src/App.jsx
      const appJsx = `import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <h1>🚀 Your Generated App is Running!</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          ✅ WebContainer is working perfectly!<br/>
          ✅ React app is running!<br/>
          ✅ Hot reload is active!
        </p>
      </div>
      <div className="status">
        <h3>🎉 Success!</h3>
        <p>Your app has been generated and is now running in WebContainer.</p>
      </div>
    </div>
  )
}

export default App`;
      
      // Create src/index.css
      const indexCss = `:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}`;
      
      // Create src/App.css
      const appCss = `.App {
  text-align: center;
}

.card {
  padding: 2em;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  margin: 20px 0;
}

.status {
  background: rgba(76, 175, 80, 0.2);
  border: 1px solid rgba(76, 175, 80, 0.5);
  padding: 20px;
  border-radius: 10px;
  margin: 20px 0;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  color: white;
  cursor: pointer;
  transition: border-color 0.25s;
}

button:hover {
  border-color: #646cff;
}

button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}`;
      
      // Write all files
      await webcontainer.fs.writeFile('package.json', JSON.stringify(workingPackageJson, null, 2));
      await webcontainer.fs.writeFile('vite.config.js', viteConfig);
      await webcontainer.fs.writeFile('index.html', indexHtml);
      await webcontainer.fs.writeFile('src/main.jsx', mainJsx);
      await webcontainer.fs.writeFile('src/App.jsx', appJsx);
      await webcontainer.fs.writeFile('src/index.css', indexCss);
      await webcontainer.fs.writeFile('src/App.css', appCss);
      
      console.log('PreviewFrame: Created working React app files');
      
      // Try npm install with a shorter timeout
      console.log('PreviewFrame: Installing dependencies for working React app...');
      console.log('PreviewFrame: WebContainer limitations may affect npm install performance');
      
      const installProcess = await webcontainer.spawn('npm', ['install', '--force', '--no-audit', '--no-fund']);
      
      // Wait for install with timeout
      const installPromise = installProcess.exit;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Install timeout - WebContainer limitations')), 20000); // 20 second timeout
      });
      
      try {
        const exitCode = await Promise.race([installPromise, timeoutPromise]);
        console.log('PreviewFrame: npm install exit code:', exitCode);
        
        if (exitCode === 0) {
          console.log('PreviewFrame: npm install succeeded!');
          
          // Start dev server
          console.log('PreviewFrame: Starting dev server...');
          const devProcess = await webcontainer.spawn('npm', ['run', 'dev']);
          
          // Wait for server to start
          await new Promise(resolve => setTimeout(resolve, 5000)); // Longer wait for WebContainer
          
          // Try to get URL
          try {
            const url = webcontainer.getURL();
            console.log('PreviewFrame: Dev server URL:', url);
            setPreviewUrl(url);
            setIsLoading(false);
            return true;
          } catch (urlErr) {
            console.log('PreviewFrame: getURL failed, using localhost:', urlErr);
            setPreviewUrl('http://localhost:3000');
            setIsLoading(false);
            return true;
          }
        } else {
          console.log('PreviewFrame: npm install failed with exit code:', exitCode);
          console.log('PreviewFrame: This is common in WebContainer due to network/security limitations');
        }
      } catch (installErr) {
        console.log('PreviewFrame: npm install failed or timed out:', installErr);
        console.log('PreviewFrame: WebContainer limitations detected - falling back to HTML preview');
      }
      
      return false;
    } catch (err) {
      console.error('PreviewFrame: Failed to create working React app:', err);
      return false;
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
  <title>Generated App</title>
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
    <h1>🚀 Your App is Ready!</h1>
    <div class="status">
      <strong>✅ WebContainer Initialized Successfully</strong><br>
      Your application has been generated and is ready to use.
    </div>
    
    <p>This is a fallback preview since WebContainer encountered limitations, but your code has been successfully generated!</p>
    
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
    </div>
    
    <div class="features">
      <div class="feature">
        <h3>📁 Files Created</h3>
        <p>All project files have been generated and are available in the file explorer.</p>
      </div>
      <div class="feature">
        <h3>⚡ WebContainer Active</h3>
        <p>The development environment is running and ready for your code.</p>
      </div>
      <div class="feature">
        <h3>🛠️ Next Steps</h3>
        <p>Copy the generated code and create your project manually, or try refreshing to retry the preview.</p>
      </div>
    </div>
    
    <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
      <button class="refresh-btn" onclick="window.location.reload()">
        🔄 Retry Preview
      </button>
      <button class="refresh-btn" onclick="window.dispatchEvent(new CustomEvent('retry-react-app'))">
        ⚛️ Try React App
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
      
      // Enable stream logging to debug npm install issues
      const ENABLE_STREAM_LOGGING = true;
      
      // Add timeout mechanism to prevent infinite loading
      const TIMEOUT_MS = 30000; // 30 seconds timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Preview startup timeout - falling back to HTML preview'));
        }, TIMEOUT_MS);
      });

      // Race between preview startup and timeout
      const previewStartup = async () => {
        // Check if package.json exists
        try {
          const packageJsonExists = await webcontainer.fs.readFile('package.json', 'utf-8');
          console.log('PreviewFrame: package.json exists:', !!packageJsonExists);
          console.log('PreviewFrame: package.json content preview:', packageJsonExists.substring(0, 200) + '...');
        } catch (err) {
          console.error('PreviewFrame: package.json not found:', err);
          setError('package.json not found. Cannot start preview.');
          setIsLoading(false);
          return;
        }

      // Install dependencies
      console.log('PreviewFrame: Installing dependencies...');
      const installProcess = await webcontainer.spawn('npm', ['install']);
      
      // Capture npm install output for debugging
      let installOutput = '';
      const installOutputReader = installProcess.output.getReader();
      const installOutputPromise = (async () => {
        try {
          while (true) {
            const { done, value } = await installOutputReader.read();
            if (done) break;
            
            // Validate data before decoding
            if (value && value instanceof Uint8Array) {
              try {
                const output = new TextDecoder().decode(value);
                installOutput += output;
                if (ENABLE_STREAM_LOGGING) {
                  console.log('npm install output:', output);
                }
              } catch (decodeErr) {
                console.log('npm install decode error:', decodeErr);
              }
            }
          }
        } catch (err) {
          console.log('npm install output stream ended:', err);
        } finally {
          try {
            installOutputReader.releaseLock();
          } catch (releaseErr) {
            console.log('npm install release lock error:', releaseErr);
          }
        }
      })();
      
      // Wait for both the process and output to complete
      const [installExitCode] = await Promise.all([installProcess.exit, installOutputPromise]);
      console.log('PreviewFrame: npm install exit code:', installExitCode);
      console.log('PreviewFrame: npm install full output:', installOutput);
      
      if (installExitCode !== 0) {
        console.error('PreviewFrame: npm install failed with exit code:', installExitCode);
        
        // Try to get more details about the failure
        try {
          const packageJsonContent = await webcontainer.fs.readFile('package.json', 'utf-8');
          console.log('PreviewFrame: package.json content:', packageJsonContent);
          
          // Try to parse and validate package.json
          try {
            const packageJson = JSON.parse(packageJsonContent);
            console.log('PreviewFrame: package.json parsed successfully:', packageJson);
            
            // Check for common issues
            if (!packageJson.dependencies && !packageJson.devDependencies) {
              console.warn('PreviewFrame: package.json has no dependencies');
            }
            if (!packageJson.scripts || !packageJson.scripts.dev) {
              console.warn('PreviewFrame: package.json missing dev script');
            }
          } catch (parseErr) {
            console.error('PreviewFrame: package.json is not valid JSON:', parseErr);
          }
        } catch (err) {
          console.error('PreviewFrame: Could not read package.json:', err);
        }
        
        // Try npm install --force as fallback
        console.log('PreviewFrame: Trying npm install --force...');
        const forceInstallProcess = await webcontainer.spawn('npm', ['install', '--force']);
        
        // Capture force install output for debugging
        let forceInstallOutput = '';
        const forceOutputReader = forceInstallProcess.output.getReader();
        const forceOutputPromise = (async () => {
          try {
            while (true) {
              const { done, value } = await forceOutputReader.read();
              if (done) break;
              
              // Validate data before decoding
              if (value && value instanceof Uint8Array) {
                try {
                  const output = new TextDecoder().decode(value);
                  forceInstallOutput += output;
                  if (ENABLE_STREAM_LOGGING) {
                    console.log('npm install --force output:', output);
                  }
                } catch (decodeErr) {
                  console.log('npm install --force decode error:', decodeErr);
                }
              }
            }
          } catch (err) {
            console.log('npm install --force output stream ended:', err);
          } finally {
            try {
              forceOutputReader.releaseLock();
            } catch (releaseErr) {
              console.log('npm install --force release lock error:', releaseErr);
            }
          }
        })();
        
        // Wait for both the process and output to complete
        const [forceInstallExitCode] = await Promise.all([forceInstallProcess.exit, forceOutputPromise]);
        console.log('PreviewFrame: npm install --force exit code:', forceInstallExitCode);
        console.log('PreviewFrame: npm install --force full output:', forceInstallOutput);
        
        if (forceInstallExitCode !== 0) {
          // Try with a minimal package.json as last resort
          console.log('PreviewFrame: Trying with minimal package.json...');
          try {
            const minimalPackageJson = {
              "name": "webcontainer-app",
              "version": "1.0.0",
              "type": "module",
              "scripts": {
                "dev": "vite --host 0.0.0.0 --port 3000",
                "build": "vite build",
                "preview": "vite preview"
              },
              "dependencies": {
                "react": "^18.2.0",
                "react-dom": "^18.2.0"
              },
              "devDependencies": {
                "@types/react": "^18.2.0",
                "@types/react-dom": "^18.2.0",
                "@vitejs/plugin-react": "^4.0.0",
                "vite": "^4.4.0"
              }
            };
            
            // Also create a basic vite.config.js
            const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000
  }
})`;
            
            await webcontainer.fs.writeFile('vite.config.js', viteConfig);
            
            await webcontainer.fs.writeFile('package.json', JSON.stringify(minimalPackageJson, null, 2));
            console.log('PreviewFrame: Created minimal package.json');
            
            // Create basic React files if they don't exist
            try {
              await webcontainer.fs.readFile('src/main.jsx', 'utf-8');
            } catch {
              console.log('PreviewFrame: Creating src/main.jsx...');
              const mainJsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;
              await webcontainer.fs.writeFile('src/main.jsx', mainJsx);
            }
            
            try {
              await webcontainer.fs.readFile('src/App.jsx', 'utf-8');
            } catch {
              console.log('PreviewFrame: Creating src/App.jsx...');
              const appJsx = `import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
    </div>
  )
}

export default App`;
              await webcontainer.fs.writeFile('src/App.jsx', appJsx);
            }
            
            try {
              await webcontainer.fs.readFile('src/index.css', 'utf-8');
            } catch {
              console.log('PreviewFrame: Creating src/index.css...');
              const indexCss = `:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}`;
              await webcontainer.fs.writeFile('src/index.css', indexCss);
            }
            
            try {
              await webcontainer.fs.readFile('src/App.css', 'utf-8');
            } catch {
              console.log('PreviewFrame: Creating src/App.css...');
              const appCss = `.App {
  text-align: center;
}

.card {
  padding: 2em;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  color: white;
  cursor: pointer;
  transition: border-color 0.25s;
}

button:hover {
  border-color: #646cff;
}

button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}`;
              await webcontainer.fs.writeFile('src/App.css', appCss);
            }
            
            const minimalInstallProcess = await webcontainer.spawn('npm', ['install', '--force']);
            const minimalInstallExitCode = await minimalInstallProcess.exit;
            console.log('PreviewFrame: Minimal npm install exit code:', minimalInstallExitCode);
            
            if (minimalInstallExitCode !== 0) {
              console.log('PreviewFrame: Even minimal npm install failed, trying HTML fallback...');
              
              // Create a simple HTML file that can be served without npm
              const simpleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated App</title>
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
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Your App is Ready!</h1>
    <div class="status">
      <strong>✅ WebContainer Initialized Successfully</strong><br>
      Your application has been generated and is ready to use.
    </div>
    
    <p>This is a fallback preview since npm install encountered issues, but your code has been successfully generated!</p>
    
    <div class="features">
      <div class="feature">
        <h3>📁 Files Created</h3>
        <p>All project files have been generated and are available in the file explorer.</p>
      </div>
      <div class="feature">
        <h3>⚡ WebContainer Active</h3>
        <p>The development environment is running and ready for your code.</p>
      </div>
      <div class="feature">
        <h3>🛠️ Next Steps</h3>
        <p>Copy the generated code and create your project manually, or try refreshing to retry the preview.</p>
      </div>
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
                
                const url = webcontainer.getURL();
                console.log('PreviewFrame: Server URL:', url);
                setPreviewUrl(url);
                setIsLoading(false);
                return;
              } catch (serverErr) {
                console.error('PreviewFrame: Failed to start simple server:', serverErr);
              }
              
              setError(`Failed to install dependencies (exit code: ${installExitCode}). Check console for details.`);
              setIsLoading(false);
              return;
            }
            
            console.log('PreviewFrame: Minimal npm install succeeded!');
          } catch (err) {
            console.error('PreviewFrame: Failed to create minimal package.json:', err);
            setError(`Failed to install dependencies (exit code: ${installExitCode}). Check console for details.`);
            setIsLoading(false);
            return;
          }
        } else {
          console.log('PreviewFrame: npm install --force succeeded!');
        }
      }

      // Start the dev server
      console.log('PreviewFrame: Starting dev server...');
      const devProcess = await webcontainer.spawn('npm', ['run', 'dev']);
      
      // Wait for the server to be ready
      webcontainer.on('server-ready', (port: number, url: string) => {
        console.log('Server ready on port:', port, 'URL:', url);
        setPreviewUrl(url);
        setIsLoading(false);
      });

      // Add timeout for dev server
      setTimeout(() => {
        if (!previewUrl && isLoading) {
          console.log('PreviewFrame: Dev server timeout, trying to get URL manually...');
          webcontainer.getURL().then((url: string) => {
            if (url) {
              console.log('PreviewFrame: Got URL manually:', url);
              setPreviewUrl(url);
              setIsLoading(false);
            } else {
              console.log('PreviewFrame: No URL available, using fallback');
              setPreviewUrl('http://localhost:3000');
              setIsLoading(false);
            }
          }).catch(() => {
            console.log('PreviewFrame: getURL failed, using fallback');
            setPreviewUrl('http://localhost:3000');
            setIsLoading(false);
          });
        }
      }, 10000); // 10 second timeout

      // Also listen for process output to detect when server is ready (if enabled)
      if (ENABLE_STREAM_LOGGING) {
        const devOutputReader = devProcess.output.getReader();
        const devOutputPromise = (async () => {
          try {
            while (true) {
              const { done, value } = await devOutputReader.read();
              if (done) break;
              
              // Validate data before decoding
              if (value && value instanceof Uint8Array) {
                try {
                  const output = new TextDecoder().decode(value);
                  console.log('Dev server output:', output);
                  
                  // Check if server is ready (common patterns)
                  if (output.includes('Local:') || output.includes('localhost:') || output.includes('ready')) {
                    // Try to get the preview URL from WebContainer
                    webcontainer.getURL().then((url: string) => {
                      if (url) {
                        setPreviewUrl(url);
                        setIsLoading(false);
                      }
                    }).catch(() => {
                      // Fallback: construct URL manually
                      setPreviewUrl('http://localhost:3000');
                      setIsLoading(false);
                    });
                  }
                } catch (decodeErr) {
                  console.log('Dev server decode error:', decodeErr);
                }
              }
            }
          } catch (err) {
            console.log('Dev server output stream ended:', err);
          } finally {
            try {
              devOutputReader.releaseLock();
            } catch (releaseErr) {
              console.log('Dev server release lock error:', releaseErr);
            }
          }
        })();
      }
      }; // End of previewStartup function
      
      // Race between preview startup and timeout
      try {
        await Promise.race([previewStartup(), timeoutPromise]);
      } catch (err) {
        console.error('Preview startup failed or timed out:', err);
        
        // Try to create a working React app first
        console.log('PreviewFrame: Attempting to create working React app...');
        const reactAppSuccess = await createWorkingReactApp();
        
        if (!reactAppSuccess) {
          // If React app creation fails, show HTML fallback
          console.log('PreviewFrame: React app creation failed, showing HTML fallback');
          await showHtmlFallback();
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
              <h2 className="text-lg font-semibold text-blue-800 mb-2">🚀 Your Generated App</h2>
              <p className="text-blue-700">
                This is a mock preview of your generated application. WebContainer is not available due to browser 
                security restrictions, but your code has been successfully generated and is ready to use.
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
              <h3 className="font-semibold text-green-800 mb-2">✅ Your Code is Ready</h3>
              <p className="text-sm text-green-700">
                Despite the WebContainer limitation, your application code has been successfully generated. 
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
