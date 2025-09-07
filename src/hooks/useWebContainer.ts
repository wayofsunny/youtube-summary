import { useEffect, useState, useRef } from "react";
import { WebContainer } from '@webcontainer/api';

// Global WebContainer manager - bulletproof singleton
class WebContainerManager {
    private static instance: WebContainerManager;
    private webContainer: WebContainer | null = null;
    private bootPromise: Promise<WebContainer> | null = null;
    private isBooting = false;
    private isDisabled = false;
    private subscribers: Set<(webContainer: WebContainer | null, error: string | null, isLoading: boolean) => void> = new Set();
    private bootAttempts = 0;
    private maxBootAttempts = 1; // Only allow one boot attempt

    private constructor() {
        // Listen for WebContainer errors and disable it
        this.setupErrorHandlers();
        
        // Global reset function for debugging
        (window as any).resetWebContainer = () => {
            console.log('WebContainer: Resetting global instance...');
            this.reset();
            window.location.reload();
        };
    }

    static getInstance(): WebContainerManager {
        if (!WebContainerManager.instance) {
            WebContainerManager.instance = new WebContainerManager();
        }
        return WebContainerManager.instance;
    }

    private setupErrorHandlers() {
        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            if (this.isWebContainerError(event.message)) {
                console.log('WebContainer: Detected error, disabling WebContainer');
                this.disableWebContainer();
            }
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            if (this.isWebContainerError(event.reason?.message)) {
                console.log('WebContainer: Detected promise rejection, disabling WebContainer');
                this.disableWebContainer();
            }
        });
    }

    private isWebContainerError(message: string): boolean {
        return Boolean(message && (
            message.includes('ReadableStreamDefaultController') ||
            message.includes('Only a single WebContainer instance can be booted') ||
            message.includes('WebContainer')
        ));
    }

    private disableWebContainer() {
        this.isDisabled = true;
        this.webContainer = null;
        this.bootPromise = null;
        this.isBooting = false;
        this.notifySubscribers();
    }

    private reset() {
        this.webContainer = null;
        this.bootPromise = null;
        this.isBooting = false;
        this.isDisabled = false;
        this.bootAttempts = 0;
        this.notifySubscribers();
    }

    async getWebContainer(): Promise<WebContainer> {
        // If disabled, throw error immediately
        if (this.isDisabled) {
            throw new Error('WebContainer disabled due to internal errors. Using fallback mode.');
        }

        // If we already have an instance, return it immediately
        if (this.webContainer) {
            console.log('WebContainer: Using existing instance');
            return this.webContainer;
        }

        // If we've already attempted to boot, don't try again
        if (this.bootAttempts >= this.maxBootAttempts) {
            throw new Error('WebContainer boot failed. Maximum attempts reached.');
        }

        // If there's already a boot process in progress, wait for it
        if (this.bootPromise) {
            console.log('WebContainer: Waiting for existing boot process...');
            const promise = this.bootPromise as Promise<WebContainer>;
            return promise;
        }

        // Start a new boot process (only if we haven't tried before)
        if (!this.isBooting) {
            this.isBooting = true;
            this.bootAttempts++;
            console.log('WebContainer: Starting boot process (attempt', this.bootAttempts, ')');
            
            this.bootPromise = this.bootWebContainer();
            return this.bootPromise as Promise<WebContainer>;
        }

        // This should never happen, but TypeScript needs it
        return Promise.reject(new Error('WebContainer boot process is in an invalid state'));
    }

    private async bootWebContainer(): Promise<WebContainer> {
        try {
            // Check browser compatibility first
            this.checkBrowserCompatibility();
            
            const instance = await WebContainer.boot();
            this.webContainer = instance;
            this.isBooting = false;
            console.log('WebContainer: Boot successful!');
            this.notifySubscribers();
            return instance;
        } catch (err) {
            this.isBooting = false;
            this.bootPromise = null;
            
            const errorMessage = err instanceof Error ? err.message : 'Failed to boot WebContainer';
            console.error('WebContainer: Boot failed:', errorMessage);
            
            // Handle specific error types
            if (errorMessage.includes('Only a single WebContainer instance can be booted')) {
                console.log('WebContainer: Singleton error detected, disabling WebContainer');
                this.disableWebContainer();
            } else if (errorMessage.includes('SharedArrayBuffer')) {
                console.log('WebContainer: SharedArrayBuffer not available');
                this.disableWebContainer();
            } else if (errorMessage.includes('Cross-Origin-Isolated')) {
                console.log('WebContainer: Cross-Origin-Isolated restrictions detected');
                this.disableWebContainer();
            }
            
            this.notifySubscribers(errorMessage);
            throw err;
        }
    }

    private checkBrowserCompatibility() {
        // Check for required browser features
        if (typeof SharedArrayBuffer === 'undefined') {
            throw new Error('SharedArrayBuffer is not available. This browser does not support WebContainer.');
        }
        
        // Note: Cross-Origin-Isolated might be false but WebContainer can still work
        // We'll log it but not throw an error
        console.log('WebContainer: Browser compatibility check');
        console.log('WebContainer: SharedArrayBuffer available:', typeof SharedArrayBuffer !== 'undefined');
        console.log('WebContainer: Cross-Origin-Isolated:', window.crossOriginIsolated);
        
        if (!window.crossOriginIsolated) {
            console.warn('WebContainer: Cross-Origin-Isolated is false. This may cause issues with WebContainer.');
        }
    }

    subscribe(callback: (webContainer: WebContainer | null, error: string | null, isLoading: boolean) => void): () => void {
        this.subscribers.add(callback);
        
        // Immediately call with current state
        const isLoading = this.isBooting && !this.webContainer;
        const error = this.isDisabled ? 'WebContainer disabled due to internal errors' : null;
        callback(this.webContainer, error, isLoading);
        
        // Return unsubscribe function
        return () => {
            this.subscribers.delete(callback);
        };
    }

    private notifySubscribers(error: string | null = null) {
        const isLoading = this.isBooting && !this.webContainer;
        this.subscribers.forEach(callback => {
            callback(this.webContainer, error, isLoading);
        });
    }

    getCurrentWebContainer(): WebContainer | null {
        return this.webContainer;
    }

    isWebContainerDisabled(): boolean {
        return this.isDisabled;
    }

    isWebContainerBooting(): boolean {
        return this.isBooting;
    }
}

export function useWebContainer() {
    const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const hasInitialized = useRef(false);

    useEffect(() => {
        // Prevent multiple initializations
        if (hasInitialized.current) {
            return;
        }
        hasInitialized.current = true;

        const manager = WebContainerManager.getInstance();
        
        // Subscribe to WebContainer state changes
        const unsubscribe = manager.subscribe((webContainer, error, isLoading) => {
            setWebcontainer(webContainer);
            setError(error);
            setIsLoading(isLoading);
        });

        // Try to get WebContainer if not already available and not disabled
        if (!manager.getCurrentWebContainer() && !manager.isWebContainerDisabled() && !manager.isWebContainerBooting()) {
            setIsLoading(true);
            manager.getWebContainer().catch((err) => {
                console.error('WebContainer: Failed to get instance:', err);
                setError(err instanceof Error ? err.message : 'Failed to get WebContainer');
                setIsLoading(false);
            });
        }

        return unsubscribe;
    }, []);

    return { webcontainer, isLoading, error };
}