# WebContainer Troubleshooting Guide

## Issue: WebContainer Preview Not Working

If you're experiencing issues with the MVP Builder preview not working, you're likely encountering WebContainer browser compatibility issues.

### Common Error Messages

```
WebContainer: Boot failed: SharedArrayBuffer is not available. This browser does not support WebContainer.
WebContainer: Failed to get instance: Error: SharedArrayBuffer is not available. This browser does not support WebContainer.
```

### Root Cause

WebContainer requires specific browser features and security headers that are not available in all browser configurations:

1. **SharedArrayBuffer**: Required for WebContainer's sandboxed environment
2. **Cross-Origin-Isolated**: Required for secure cross-origin communication
3. **Proper Security Headers**: Server must send specific headers

### Solutions

#### 1. Browser Requirements
- **Chrome 88+** or **Edge 88+** (recommended)
- Firefox and Safari are not fully supported
- Must be running over HTTPS (not HTTP)

#### 2. Server Configuration
The application is configured with the required headers in `next.config.ts`:

```typescript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Cross-Origin-Opener-Policy',
          value: 'same-origin',
        },
        {
          key: 'Cross-Origin-Embedder-Policy',
          value: 'credentialless',
        },
      ],
    },
  ];
}
```

#### 3. Development Server
When running locally, ensure you're using HTTPS:

```bash
# For Next.js development
npm run dev
# Then access via https://localhost:3000 (not http://)
```

#### 4. Fallback Options

If WebContainer still doesn't work, the application provides several fallback options:

1. **Mock Preview**: Shows a static preview of your generated application
2. **File Explorer**: View and copy all generated code files
3. **Manual Setup**: Copy the generated code and run it locally

### How the Application Handles WebContainer Issues

The MVP Builder has been updated with robust error handling:

1. **Browser Compatibility Check**: Automatically detects if WebContainer is supported
2. **Clear Error Messages**: Shows exactly what's missing (SharedArrayBuffer, Cross-Origin-Isolated, etc.)
3. **Fallback Preview**: Provides a mock preview when WebContainer fails
4. **Helpful Instructions**: Guides users on how to enable WebContainer or use alternatives

### Testing WebContainer Support

You can check if your browser supports WebContainer by opening the browser console and running:

```javascript
console.log('SharedArrayBuffer available:', typeof SharedArrayBuffer !== 'undefined');
console.log('Cross-Origin-Isolated:', window.crossOriginIsolated);
```

Both should return `true` for WebContainer to work.

### Alternative: Manual Development

If WebContainer continues to have issues, you can:

1. Use the File Explorer to view all generated files
2. Copy the code from each file
3. Create a new React project locally
4. Paste the generated code
5. Run `npm install` and `npm run dev`

The code generation works independently of WebContainer, so you'll still get a fully functional application.
