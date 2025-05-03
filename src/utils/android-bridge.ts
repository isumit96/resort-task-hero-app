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
  
  // More comprehensive detection of Android WebView
  const isAndroid = /Android/.test(navigator.userAgent);
  const hasWebViewSignature = 
    /wv/.test(navigator.userAgent) || 
    /Version\/[0-9.]+/.test(navigator.userAgent) ||
    /Android.*Mobile.*Chrome\/[.0-9]* (?!Mobile)/i.test(navigator.userAgent);
    
  // Additional check for our custom WebView marker
  const hasCustomMarker = navigator.userAgent.includes('AndroidAppWebView');
  
  console.log('Android detection:', { 
    isAndroid, 
    hasWebViewSignature, 
    hasCustomMarker,
    userAgent: navigator.userAgent
  });
  
  return isAndroid && (hasWebViewSignature || hasCustomMarker);
};

/**
 * Check if the native Android camera bridge is available
 * Added robust checking with console logging
 */
export const isNativeCameraAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // More thorough checking for Android camera availability
  const available = !!(
    window.AndroidCamera && 
    typeof window.AndroidCamera.takePhoto === 'function'
  );
  
  console.log('Native camera availability check:', {
    windowExists: typeof window !== 'undefined',
    androidCameraExists: !!window.AndroidCamera,
    takePhotoMethodExists: window.AndroidCamera ? typeof window.AndroidCamera.takePhoto : 'undefined'
  });
  
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
  
  if (isAndroidWebView() && window.AndroidLogger?.logDebug) {
    try {
      window.AndroidLogger.logDebug(tag, message);
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
  
  console.log('Taking native photo with request ID:', actualRequestId);
  console.log('AndroidCamera object status:', {
    exists: !!window.AndroidCamera,
    takePhotoMethod: window.AndroidCamera ? typeof window.AndroidCamera.takePhoto : 'undefined'
  });
  
  // Try using Android native camera if available
  if (window.AndroidCamera?.takePhoto) {
    try {
      // Call the Android native method
      sendDebugLog('Camera', `Taking photo with request ID: ${actualRequestId}`);
      window.AndroidCamera.takePhoto(actualRequestId);
      return true;
    } catch (e) {
      console.error('Error taking native photo with takePhoto:', e);
      sendDebugLog('CameraError', `takePhoto failed: ${e}`);
      return false;
    }
  }
  
  sendDebugLog('Camera', 'Native camera methods not available');
  return false;
};

/**
 * Record a video using the Android native camera
 * @param requestId Optional request ID for tracking the response
 * @returns Promise that resolves to true if the camera was opened successfully
 */
export const takeNativeVideo = async (requestId?: string): Promise<boolean> => {
  // If no requestId is provided, generate one
  const actualRequestId = requestId || `video_${Date.now()}`;
  
  // Try using Android native video recording if available
  if (window.AndroidCamera?.captureVideo) {
    try {
      sendDebugLog('Camera', `Recording video with request ID: ${actualRequestId}`);
      window.AndroidCamera.captureVideo(actualRequestId);
      return true;
    } catch (e) {
      console.error('Error recording native video:', e);
      sendDebugLog('CameraError', `captureVideo failed: ${e}`);
      return false;
    }
  }
  
  sendDebugLog('Camera', 'Native video recording not available');
  return false;
};

/**
 * Initialize the Android bridge
 * Enhanced with better detection and logging
 */
export const initializeAndroidBridge = (): void => {
  if (typeof window === 'undefined') return;
  
  // Check if we're in an Android WebView
  const inWebView = isAndroidWebView();
  
  console.log('Initializing Android bridge, in WebView:', inWebView);
  sendDebugLog('Bridge', `Initializing Android bridge (inWebView: ${inWebView})`);
  
  // Only initialize in Android WebView
  if (!inWebView) {
    console.log('Not in Android WebView, skipping bridge initialization');
    return;
  }
  
  console.log('Initializing Android bridge');
  sendDebugLog('Bridge', 'Initializing Android bridge');
  
  // Initialize the bridge object if it doesn't exist
  if (!window.androidBridge) {
    console.log('Creating android bridge object');
    window.androidBridge = {
      captureRequests: new Map(),
      nextRequestId: 1
    };
  }
  
  // Set up global handlers for Android communication
  if (typeof window.receiveImageFromAndroid !== 'function') {
    console.log('Setting up receiveImageFromAndroid handler');
    window.receiveImageFromAndroid = (requestId, base64Data, fileName, mimeType) => {
      console.log(`Received image from Android: ${requestId}, ${fileName}, ${mimeType}`);
      sendDebugLog('Camera', `Received image from Android: ${fileName} (${mimeType})`);
      
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
        const callback = window.androidBridge?.captureRequests.get(Number(requestId));
        if (callback) {
          sendDebugLog('Camera', `Calling callback for request #${requestId} with file: ${fileName}`);
          callback(file);
          window.androidBridge?.captureRequests.delete(Number(requestId));
        } else {
          sendDebugLog('CameraError', `No callback found for request #${requestId}`);
        }
      } catch (error) {
        console.error('Error processing image from Android:', error);
        sendDebugLog('CameraError', `Failed to process image: ${error.message}`);
        
        // Try to call the callback with null to signal error
        const callback = window.androidBridge?.captureRequests.get(Number(requestId));
        if (callback) {
          callback(null);
          window.androidBridge?.captureRequests.delete(Number(requestId));
        }
      }
    };
  }
  
  if (typeof window.receiveAndroidCameraError !== 'function') {
    window.receiveAndroidCameraError = (requestId, errorCode, errorMessage) => {
      console.error(`Android camera error: ${requestId}, ${errorCode}, ${errorMessage}`);
      sendDebugLog('CameraError', `Android error: ${errorCode} - ${errorMessage}`);
      
      // Call the stored callback with null to signal error
      const callback = window.androidBridge?.captureRequests.get(Number(requestId));
      if (callback) {
        callback(null);
        window.androidBridge?.captureRequests.delete(Number(requestId));
      } else {
        sendDebugLog('CameraError', `No callback found for error request #${requestId}`);
      }
      
      // Create and dispatch a custom event for error handling
      const errorEvent = new CustomEvent('android-file-error', { 
        detail: { 
          errorType: errorCode, 
          message: errorMessage 
        }
      });
      document.dispatchEvent(errorEvent);
    };
  }
  
  // Test availability of Android interfaces
  if (window.AndroidCamera) {
    sendDebugLog('Bridge', 'AndroidCamera interface available');
    
    const methods = [];
    if (typeof window.AndroidCamera.takePhoto === 'function') methods.push('takePhoto');
    if (typeof window.AndroidCamera.captureVideo === 'function') methods.push('captureVideo');
    if (typeof window.AndroidCamera.openCamera === 'function') methods.push('openCamera');
    
    sendDebugLog('Bridge', `Available AndroidCamera methods: ${methods.join(', ') || 'none'}`);
  } else {
    sendDebugLog('Bridge', 'AndroidCamera interface not found - will use fallback methods');
  }
  
  if (window.AndroidLogger) {
    sendDebugLog('Bridge', 'AndroidLogger interface available');
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
    AndroidLogger?: {
      logDebug: (tag: string, message: string) => void;
    };
    AndroidCamera?: {
      takePhoto: (requestId: string) => void;
      captureVideo?: (requestId: string) => void;
      openCamera?: () => void;
    };
    receiveImageFromAndroid?: (requestId: string, base64Data: string, fileName: string, mimeType: string) => void;
    receiveAndroidCameraError?: (requestId: string, errorCode: string, errorMessage: string) => void;
    androidBridge?: {
      captureRequests: Map<number, (file: File | null) => void>;
      nextRequestId: number;
    };
  }
}
