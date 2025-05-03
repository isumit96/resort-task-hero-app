
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
 * Check if the new openCamera function is available
 */
export const isOpenCameraAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return !!(
    window.AndroidCamera && 
    typeof window.AndroidCamera.openCamera === 'function'
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
 * Open the native camera directly using the new AndroidCamera.openCamera method
 * This is the preferred approach for direct camera integration with Android WebView
 */
export const openNativeCamera = (): boolean => {
  if (isOpenCameraAvailable()) {
    try {
      window.AndroidCamera.openCamera();
      sendDebugLog('Camera', 'Opening native camera with direct openCamera method');
      return true;
    } catch (e) {
      console.error('Error opening native camera:', e);
      sendDebugLog('CameraError', `Failed to open camera directly: ${e}`);
      return false;
    }
  }
  
  sendDebugLog('Camera', 'Direct openCamera method not available');
  return false;
};

/**
 * Take a photo using the Android native camera
 * @param requestId Optional request ID for tracking the response
 * @returns Promise that resolves to true if the camera was opened successfully
 */
export const takeNativePhoto = async (requestId?: string): Promise<boolean> => {
  // If no requestId is provided, generate one
  const actualRequestId = requestId || `photo_${Date.now()}`;
  
  // First try the simplified direct openCamera method which is preferred
  if (isOpenCameraAvailable()) {
    try {
      sendDebugLog('Camera', `Using preferred direct openCamera method`);
      window.AndroidCamera.openCamera();
      return true;
    } catch (e) {
      sendDebugLog('CameraError', `Direct openCamera failed, falling back to takePhoto: ${e}`);
      // Fall back to takePhoto if openCamera fails
    }
  }
  
  // Fall back to the older takePhoto method requiring a request ID
  if (window.AndroidCamera?.takePhoto) {
    try {
      // Call the Android native method
      sendDebugLog('Camera', `Taking photo with request ID: ${actualRequestId}`);
      window.AndroidCamera.takePhoto(actualRequestId);
      return true;
    } catch (e) {
      console.error('Error taking native photo:', e);
      sendDebugLog('CameraError', `Failed to take photo: ${e}`);
      return false;
    }
  }
  
  sendDebugLog('Camera', 'Native camera not available');
  return false;
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
  sendDebugLog('Bridge', 'Initializing Android bridge');
  
  // Initialize the bridge object if it doesn't exist
  if (!window.androidBridge) {
    window.androidBridge = {
      captureRequests: new Map(),
      nextRequestId: 1
    };
  }
  
  // Log available Android interfaces
  if (window.AndroidCamera) {
    const methods = Object.getOwnPropertyNames(window.AndroidCamera)
      .filter(prop => typeof window.AndroidCamera[prop] === 'function');
    
    sendDebugLog('Bridge', `Available AndroidCamera methods: ${methods.join(', ') || 'none'}`);
  }
  
  if (window.AndroidDebug) {
    sendDebugLog('Bridge', 'AndroidDebug interface available');
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
    AndroidCamera?: {
      takePhoto: (requestId: string) => void;
      captureVideo?: (requestId: string) => void;
      openCamera?: () => void;
    };
    androidBridge?: {
      captureRequests: Map<number, (file: File | null) => void>;
      nextRequestId: number;
    };
  }
}
