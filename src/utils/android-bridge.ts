
/**
 * Utility functions for the Android WebView JavaScript bridge.
 * These functions help with communication between the Android app and the web app.
 */

/**
 * Check if the current environment is an Android WebView
 */
export const isAndroidWebView = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  return /Android/.test(navigator.userAgent) && 
         (/wv/.test(navigator.userAgent) || 
          /Version\/[0-9.]+/.test(navigator.userAgent));
};

/**
 * Check if the native Android camera bridge is available
 */
export const isNativeCameraAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return !!(
    window.AndroidCamera && 
    typeof window.AndroidCamera.takePhoto === 'function'
  );
};

/**
 * Send a debug log to the Android app if running in a WebView
 */
export const sendDebugLog = (tag: string, message: string): void => {
  if (isAndroidWebView() && window.AndroidDebug?.log) {
    window.AndroidDebug.log(tag, message);
  } else {
    console.log(`[${tag}] ${message}`);
  }
};

/**
 * Initialize the Android bridge
 * This should be called early in the app initialization process
 */
export const initializeAndroidBridge = (): void => {
  if (typeof window === 'undefined') return;
  
  // Only initialize in Android WebView
  if (!isAndroidWebView()) return;
  
  console.log('Initializing Android bridge');
  
  // Initialize the bridge object if it doesn't exist
  if (!window.androidBridge) {
    window.androidBridge = {
      captureRequests: new Map(),
      nextRequestId: 1
    };
  }
  
  // Log successful initialization
  sendDebugLog('AndroidBridge', 'Bridge initialized successfully');
};

// Helper types for TypeScript
declare global {
  interface Window {
    AndroidDebug?: {
      log: (tag: string, message: string) => void;
    };
  }
}
