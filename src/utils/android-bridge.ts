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
          /Version\/[0-9.]+/.test(navigator.userAgent) ||
          /Android.*Mobile.*Chrome\/[.0-9]* (?!Mobile)/i.test(navigator.userAgent));
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
export const sendDebugLog = (category: string, message: string): void => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${category}] ${message}`);
  
  // Send to Android if available
  if (window.AndroidDebug?.log) {
    try {
      window.AndroidDebug.log(category, message);
    } catch (e) {
      console.error('Failed to send log to Android:', e);
    }
  } else if (window.AndroidLogger && typeof window.AndroidLogger.logDebug === 'function') {
    try {
      window.AndroidLogger.logDebug(category, message);
    } catch (e) {
      console.error('Failed to send log to Android:', e);
    }
  }
  
  // Optionally store logs in localStorage for debugging
  try {
    const logs = JSON.parse(localStorage.getItem('app_debug_logs') || '[]');
    logs.push({ timestamp, category, message });
    
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
 * Check network connectivity
 */
export const checkConnectivity = (): boolean => {
  return navigator.onLine;
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
  
  // Try primary method first (takePhoto)
  if (window.AndroidCamera?.takePhoto) {
    try {
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
 * This should be called early in the app initialization process
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
    sendDebugLog('Bridge', 'AndroidCamera interface is available');
    
    // Test if methods are callable (don't actually call them)
    if (typeof window.AndroidCamera.takePhoto === 'function') {
      sendDebugLog('Bridge', 'AndroidCamera.takePhoto method is available');
    } else {
      sendDebugLog('Bridge', 'AndroidCamera.takePhoto method is missing');
    }
    
    if (typeof window.AndroidCamera.openCamera === 'function') {
      sendDebugLog('Bridge', 'AndroidCamera.openCamera method is available');
    } else {
      sendDebugLog('Bridge', 'AndroidCamera.openCamera method is missing');
    }
    
    // Log available Android interfaces
    const methods = Object.getOwnPropertyNames(window.AndroidCamera)
      .filter(prop => typeof window.AndroidCamera[prop] === 'function');
    
    sendDebugLog('Bridge', `Available AndroidCamera methods: ${methods.join(', ') || 'none'}`);
  } else {
    sendDebugLog('Bridge', 'AndroidCamera interface is not available');
  }
  
  // Check for debug interface
  if (window.AndroidDebug) {
    sendDebugLog('Bridge', 'AndroidDebug interface available');
  }
  
  // Log successful initialization
  sendDebugLog('AndroidBridge', 'Bridge initialized successfully');
  
  // Set up the receiveImageFromAndroid handler if not already defined
  if (!window.receiveImageFromAndroid) {
    window.receiveImageFromAndroid = (requestId: string, base64Data: string, fileName: string, mimeType: string) => {
      sendDebugLog('Camera', `Received image from Android: ${requestId}, ${fileName}, ${mimeType}`);
      
      try {
        // Convert base64 to Blob/File
        const byteCharacters = atob(base64Data);
        const byteArrays = [];
        
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          
          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }
        
        const blob = new Blob(byteArrays, { type: mimeType });
        const file = new File([blob], fileName, { 
          type: mimeType,
          lastModified: Date.now()
        });
        
        // Call the stored callback
        const callback = window.androidBridge.captureRequests.get(Number(requestId));
        if (callback) {
          sendDebugLog('Camera', `Calling callback for request #${requestId} with file: ${fileName}`);
          callback(file);
          window.androidBridge.captureRequests.delete(Number(requestId));
        } else {
          sendDebugLog('CameraError', `No callback found for request #${requestId}`);
          
          // Try to find any pending request as a fallback
          if (window.androidBridge.captureRequests.size > 0) {
            // Get most recent request
            const lastRequestId = Math.max(...Array.from(window.androidBridge.captureRequests.keys()));
            const callback = window.androidBridge.captureRequests.get(lastRequestId);
            
            if (callback) {
              sendDebugLog('Camera', `Using most recent request #${lastRequestId} for file`);
              callback(file);
              window.androidBridge.captureRequests.delete(lastRequestId);
            }
          }
        }
      } catch (error) {
        console.error('Error processing image from Android:', error);
        sendDebugLog('CameraError', `Failed to process image: ${error.message}`);
        
        // Try to call the callback with null to signal error
        const callback = window.androidBridge.captureRequests.get(Number(requestId));
        if (callback) {
          callback(null);
          window.androidBridge.captureRequests.delete(Number(requestId));
        }
      }
    };
  }
  
  // Set up the receiveAndroidCameraError handler if not already defined
  if (!window.receiveAndroidCameraError) {
    window.receiveAndroidCameraError = (requestId: string, errorCode: string, errorMessage: string) => {
      console.error(`Android camera error: ${requestId}, ${errorCode}, ${errorMessage}`);
      sendDebugLog('CameraError', `Android error: ${errorCode} - ${errorMessage}`);
      
      // Call the stored callback with null to signal error
      const callback = window.androidBridge.captureRequests.get(Number(requestId));
      if (callback) {
        callback(null);
        window.androidBridge.captureRequests.delete(Number(requestId));
      } else {
        sendDebugLog('CameraError', `No callback found for error request #${requestId}`);
        
        // Try to find any pending request as a fallback
        if (window.androidBridge.captureRequests.size > 0) {
          // Get most recent request
          const lastRequestId = Math.max(...Array.from(window.androidBridge.captureRequests.keys()));
          const callback = window.androidBridge.captureRequests.get(lastRequestId);
          
          if (callback) {
            sendDebugLog('CameraError', `Using most recent request #${lastRequestId} for error`);
            callback(null);
            window.androidBridge.captureRequests.delete(lastRequestId);
          }
        }
      }
    };
  }
};

// Helper types for TypeScript
declare global {
  interface Window {
    AndroidDebug?: {
      log: (tag: string, message: string) => void;
    };
    AndroidLogger?: {
      logDebug: (category: string, message: string) => void;
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
    receiveImageFromAndroid?: (requestId: string, base64Data: string, fileName: string, mimeType: string) => void;
    receiveAndroidCameraError?: (requestId: string, errorCode: string, errorMessage: string) => void;
  }
}
