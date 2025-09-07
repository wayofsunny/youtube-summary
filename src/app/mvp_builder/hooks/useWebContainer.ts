import { useEffect, useState } from "react";
import { WebContainer } from '@webcontainer/api';

// Global WebContainer instance to prevent multiple instances
let globalWebContainer: WebContainer | null = null;
let globalWebContainerPromise: Promise<WebContainer> | null = null;

// Global reset function for debugging (can be called from browser console)
(window as any).resetWebContainer = () => {
    console.log('WebContainer: Resetting global instance...');
    globalWebContainer = null;
    globalWebContainerPromise = null;
    window.location.reload();
};

export function useWebContainer() {
    const [webcontainer, setWebcontainer] = useState<WebContainer | null>(globalWebContainer);
    const [isLoading, setIsLoading] = useState(!globalWebContainer);
    const [error, setError] = useState<string | null>(null);

    async function getWebContainer(): Promise<WebContainer> {
        // If we already have an instance, return it
        if (globalWebContainer) {
            console.log('WebContainer: Using existing global instance');
            return globalWebContainer;
        }

        // If there's already a boot process in progress, wait for it
        if (globalWebContainerPromise) {
            console.log('WebContainer: Waiting for existing boot process...');
            return globalWebContainerPromise;
        }

        // Start a new boot process
        console.log('WebContainer: Starting new boot process...');
        globalWebContainerPromise = WebContainer.boot();
        
        try {
            const instance = await globalWebContainerPromise;
            globalWebContainer = instance;
            console.log('WebContainer: Boot successful!', instance);
            return instance;
        } catch (err) {
            // Reset the promise on failure so we can retry
            globalWebContainerPromise = null;
            throw err;
        }
    }

    async function main() {
        try {
            setIsLoading(true);
            setError(null);
            
            // Check for cross-origin isolation
            if (!window.crossOriginIsolated) {
                throw new Error('WebContainer requires Cross-Origin-Isolated context. Please ensure the server is running with proper headers.');
            }
            
            const webcontainerInstance = await getWebContainer();
            setWebcontainer(webcontainerInstance);
            setIsLoading(false);
        } catch (err) {
            console.error('WebContainer: Boot failed:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to boot WebContainer';
            
            // Handle specific WebContainer errors
            if (errorMessage.includes('Unable to create more instances')) {
                setError('WebContainer instance already exists. Please refresh the page or close other tabs using WebContainer.');
            } else if (errorMessage.includes('Cross-Origin-Isolated')) {
                setError('WebContainer requires secure context. Please refresh the page after server restart.');
            } else if (errorMessage.includes('SharedArrayBuffer')) {
                setError('WebContainer requires SharedArrayBuffer support. Please refresh the page after server restart.');
            } else {
                setError(errorMessage);
            }
            
            console.error('WebContainer: Error details:', {
                message: errorMessage,
                stack: err instanceof Error ? err.stack : undefined,
                userAgent: navigator.userAgent,
                crossOriginIsolated: window.crossOriginIsolated
            });
            setIsLoading(false);
        }
    }
    
    useEffect(() => {
        // If we already have a global instance, use it immediately
        if (globalWebContainer) {
            setWebcontainer(globalWebContainer);
            setIsLoading(false);
        } else {
            main();
        }
    }, []);

    // Cleanup function to reset global state when component unmounts
    useEffect(() => {
        return () => {
            // Don't reset global state on unmount - let it persist across components
            // This allows the WebContainer to be reused
        };
    }, []);

    return { webcontainer, isLoading, error };
}