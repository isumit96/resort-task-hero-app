/**
 * Utility functions for the Android WebView JavaScript bridge.
 * These functions help with communication between the Android app and the web app.
 */

/**
 * Check if the current environment is an Android WebView
 * Enhanced detection logic for better compatibility
 */
export const isAndroidWebView = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  return /Android/.test(navigator.userAgent) && 
         (/wv/.test(navigator.userAgent) || 
          /Version\/[0-9.]+/.test(navigator.userAgent) ||
          /Android.*Mobile.*Chrome\/[.0-9]* (?!Mobile)/i.test(navigator.userAgent));
};

/**
 * Check if the native Android camera bridge is available
 * Added robust checking with console logging
 */
export const isNativeCameraAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const available = !!(
    window.AndroidCamera && 
    typeof window.AndroidCamera.takePhoto === 'function'
  );
  
  if (!available) {
    console.log('Native camera interface not available for takePhoto method');
  }
  
  return available;
};

/**
 * Check if the new openCamera function is available
 * Added robust checking with console logging
 */
export const isOpenCameraAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const available = !!(
    window.AndroidCamera && 
    typeof window.AndroidCamera.openCamera === 'function'
  );
  
  if (!available) {
    console.log('Native camera interface not available for openCamera method');
  }
  
  return available;
};

/**
 * Send a debug log to the Android app if running in a WebView
 * Enhanced logging for better debugging
 */
export const sendDebugLog = (tag: string, message: string): void => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${tag}] ${message}`);
  
  if (isAndroidWebView() && window.AndroidDebug?.log) {
    try {
      window.AndroidDebug.log(tag, message);
    } catch (e) {
      console.error('Failed to send log to Android:', e);
    }
  }
  
  // Optionally store logs in localStorage for debugging
  try {
    const logs = JSON.parse(localStorage.getItem('app_debug_logs') || '[]');
    logs.push({ timestamp, tag, message });
    
    // Keep only last 100 logs
    if (logs.length > 100) {
      logs.shift();
    }
    
    localStorage.setItem('app_debug_logs', JSON.stringify(logs));
  } catch (e) {
    // Ignore localStorage errors
  }
};

/**
 * Open the native camera directly using the new AndroidCamera.openCamera method
 * This is a direct approach without request IDs or callbacks
 */
export const openNativeCamera = (): boolean => {
  if (isOpenCameraAvailable()) {
    try {
      window.AndroidCamera.openCamera();
      sendDebugLog('Camera', 'Opening native camera with direct method');
      return true;
    } catch (e) {
      console.error('Error opening native camera:', e);
      sendDebugLog('CameraError', `Failed to open native camera: ${e}`);
      return false;
    }
  }
  return false;
};

/**
 * Take a photo using the Android native camera
 * Enhanced with better error handling and fallbacks
 * @param requestId Optional request ID for tracking the response
 * @returns Promise that resolves to true if the camera was opened successfully
 */
export const takeNativePhoto = async (requestId?: string): Promise<boolean> => {
  // If no requestId is provided, generate one
  const actualRequestId = requestId || `photo_${Date.now()}`;
  
  // Try primary method first
  if (window.AndroidCamera?.takePhoto) {
    try {
      // Call the Android native method
      sendDebugLog('Camera', `Taking photo with request ID: ${actualRequestId}`);
      window.AndroidCamera.takePhoto(actualRequestId);
      return true;
    } catch (e) {
      console.error('Error taking native photo with takePhoto:', e);
      sendDebugLog('CameraError', `takePhoto failed: ${e}`);
      
      // Try fallback to openCamera if takePhoto fails
      if (isOpenCameraAvailable()) {
        try {
          sendDebugLog('Camera', 'Falling back to openCamera method');
          window.AndroidCamera.openCamera();
          return true;
        } catch (fallbackError) {
          console.error('Error with openCamera fallback:', fallbackError);
          sendDebugLog('CameraError', `openCamera fallback failed: ${fallbackError}`);
        }
      }
    }
  } 
  // Try secondary method if primary isn't available
  else if (isOpenCameraAvailable()) {
    try {
      sendDebugLog('Camera', 'Using openCamera method');
      window.AndroidCamera.openCamera();
      return true;
    } catch (e) {
      console.error('Error opening native camera:', e);
      sendDebugLog('CameraError', `openCamera failed: ${e}`);
    }
  }
  
  sendDebugLog('Camera', 'Native camera methods not available');
  return false;
};

/**
 * Initialize the Android bridge
 * Enhanced with better detection and logging
 */
export const initializeAndroidBridge = (): void => {
  if (typeof window === 'undefined') return;
  
  // Only initialize in Android WebView
  if (!isAndroidWebView()) {
    console.log('Not in Android WebView, skipping bridge initialization');
    return;
  }
  
  console.log('Initializing Android bridge');
  sendDebugLog('Bridge', 'Initializing Android bridge');
  
  // Initialize the bridge object if it doesn't exist
  if (!window.androidBridge) {
    window.androidBridge = {
      captureRequests: new Map(),
      nextRequestId: 1
    };
  }
  
  // Test availability of Android interfaces
  if (window.AndroidCamera) {
    console.log('AndroidCamera interface is available');
    
    const methods = Object.getOwnPropertyNames(window.AndroidCamera)
      .filter(prop => typeof window.AndroidCamera[prop] === 'function');
    
    sendDebugLog('Bridge', `Available AndroidCamera methods: ${methods.join(', ') || 'none'}`);
    
    // Test specific methods
    if (typeof window.AndroidCamera.takePhoto === 'function') {
      console.log('AndroidCamera.takePhoto method is available');
    } else {
      console.warn('AndroidCamera.takePhoto method is missing');
    }
    
    if (typeof window.AndroidCamera.openCamera === 'function') {
      console.log('AndroidCamera.openCamera method is available');
    } else {
      console.warn('AndroidCamera.openCamera method is missing');
    }
  } else {
    console.warn('AndroidCamera interface is not available');
    sendDebugLog('Bridge', 'AndroidCamera interface not found - will use fallback methods');
  }
  
  if (window.AndroidDebug) {
    sendDebugLog('Bridge', 'AndroidDebug interface available');
  }
  
  // Log successful initialization
  sendDebugLog('AndroidBridge', 'Bridge initialized successfully');
};

/**
 * Check network connectivity before upload attempts
 */
export const checkConnectivity = (): boolean => {
  const online = navigator.onLine;
  if (!online) {
    sendDebugLog('Network', 'No internet connection detected');
  }
  return online;
};

// Helper types for TypeScript
declare global {
  interface Window {
    AndroidDebug?: {
      log: (tag: string, message: string) => void;
    };
    AndroidCamera?: {
      takePhoto: (requestId: string) => void;
      captureVideo?: (requestId: string) => void;
      openCamera?: () => void;
    };
    AndroidLogger?: {
      logDebug: (category: string, message: string) => void;
    };
  }
}
