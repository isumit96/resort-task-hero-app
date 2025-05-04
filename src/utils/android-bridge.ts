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
  
  // Enhanced checks for WebView-specific objects - MOST IMPORTANT CHECK
  const hasAndroidObject = typeof window !== 'undefined' && (
    !!window.AndroidCamera || 
    !!window.AndroidLogger
  );
  
  console.log('Android WebView detection details:', { 
    isAndroid, 
    hasWebViewSignature, 
    hasCustomMarker,
    hasAndroidObject,
    userAgent: navigator.userAgent
  });
  
  // If the Android bridge is present, we're definitely in WebView - PRIORITIZE THIS CHECK
  if (hasAndroidObject) {
    console.log('✅ Android WebView confirmed: Android bridge objects present');
    sendDebugLog('Bridge', 'Detected Android WebView via bridge objects');
    return true;
  }
  
  // If we're on Android and have any WebView signatures, consider it a WebView
  const inWebView = isAndroid && (hasWebViewSignature || hasCustomMarker);
  console.log('Final Android WebView detection result:', inWebView);
  
  return inWebView;
};

/**
 * Check if the native Android camera bridge is available
 * Added robust checking with detailed console logging
 */
export const isNativeCameraAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // More thorough checking for Android camera availability
  const androidCameraExists = !!window.AndroidCamera;
  const takePhotoMethodExists = androidCameraExists && typeof window.AndroidCamera.takePhoto === 'function';
  
  // Result of availability check
  const available = androidCameraExists && takePhotoMethodExists;
  
  console.log('Native camera availability check:', {
    windowExists: typeof window !== 'undefined',
    androidCameraExists,
    takePhotoMethodExists,
    functionType: window.AndroidCamera ? typeof window.AndroidCamera.takePhoto : 'undefined',
    available
  });
  
  if (available) {
    console.log('✅ Native camera IS available for takePhoto method');
    sendDebugLog('Camera', 'Native camera bridge available and will be used');
  } else {
    console.log('❌ Native camera not available for takePhoto method - will use file input fallback');
    if (androidCameraExists) {
      console.log('Android camera object exists, but takePhoto method is missing or not a function');
      sendDebugLog('Camera', 'AndroidCamera exists but takePhoto method is unavailable');
    } else {
      sendDebugLog('Camera', 'Android camera object not available - using file input fallback');
    }
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
  
  if (typeof window !== 'undefined' && window.AndroidLogger?.logDebug) {
    try {
      window.AndroidLogger.logDebug(tag, message);
      console.log(`Log sent to Android: [${tag}] ${message}`);
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
  
  console.log('🔶 Taking native photo with request ID:', actualRequestId);
  sendDebugLog('Camera', `Taking photo with request ID: ${actualRequestId}`);
  
  // Detailed check for AndroidCamera object
  const androidCameraExists = !!window.AndroidCamera;
  const takePhotoMethodExists = androidCameraExists && typeof window.AndroidCamera.takePhoto === 'function';
  
  console.log('🔍 AndroidCamera object status:', {
    exists: androidCameraExists,
    takePhotoMethod: takePhotoMethodExists,
    functionType: window.AndroidCamera ? typeof window.AndroidCamera.takePhoto : 'undefined'
  });
  
  // Try using Android native camera if available
  if (androidCameraExists && takePhotoMethodExists) {
    try {
      // Call the Android native method - this should trigger the camera in the Android app
      sendDebugLog('Camera', `Calling AndroidCamera.takePhoto with ID: ${actualRequestId}`);
      
      console.log('📸 BEFORE calling native takePhoto method');
      window.AndroidCamera.takePhoto(actualRequestId);
      console.log('✅ AFTER calling native takePhoto method - camera intent should be launched now');
      
      sendDebugLog('Camera', 'Native camera method called successfully');
      return true;
    } catch (e) {
      console.error('❌ Error taking native photo with takePhoto:', e);
      sendDebugLog('CameraError', `takePhoto failed: ${e instanceof Error ? e.message : String(e)}`);
      return false;
    }
  }
  
  sendDebugLog('Camera', 'Native camera methods not available - will use fallback');
  console.log('❌ Native camera methods not available, fallback to file input needed');
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
  
  console.log('⚙️ Initializing Android bridge, in WebView:', inWebView);
  sendDebugLog('Bridge', `Initializing Android bridge (inWebView: ${inWebView})`);
  
  // Always try to initialize bridge components even if not in WebView
  console.log('⚙️ Creating android bridge handlers');
  sendDebugLog('Bridge', 'Setting up Android bridge handlers');
  
  // Initialize the bridge object if it doesn't exist
  if (!window.androidBridge) {
    console.log('⚙️ Creating android bridge object');
    window.androidBridge = {
      captureRequests: new Map(),
      nextRequestId: 1
    };
  }
  
  // Set up global handlers for Android communication - CRITICAL PART
  if (typeof window.receiveImageFromAndroid !== 'function') {
    console.log('⚙️ Setting up receiveImageFromAndroid handler');
    window.receiveImageFromAndroid = (requestId, base64Data, fileName, mimeType) => {
      console.log(`📥 Received image from Android: ${requestId}, ${fileName}, ${mimeType}, data length: ${base64Data ? base64Data.length : 0}`);
      sendDebugLog('Camera', `Received image from Android: requestId=${requestId}, fileName=${fileName}, mimeType=${mimeType}`);
      
      try {
        if (!base64Data || base64Data.length === 0) {
          console.error('Received empty base64 data from Android');
          sendDebugLog('CameraError', 'Received empty image data from Android');
          
          const callback = window.androidBridge?.captureRequests.get(Number(requestId));
          if (callback) {
            callback(null);
            window.androidBridge?.captureRequests.delete(Number(requestId));
          }
          return;
        }
        
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
        const file = new File([blob], fileName || `image_${Date.now()}.jpg`, { 
          type: mimeType || 'image/jpeg',
          lastModified: Date.now()
        });
        
        console.log(`Created File object: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
        sendDebugLog('Camera', `Processed image: size=${file.size} bytes`);
        
        // Call the stored callback
        const callback = window.androidBridge?.captureRequests.get(Number(requestId));
        if (callback) {
          sendDebugLog('Camera', `Calling callback for request #${requestId} with file: ${file.name}`);
          console.log(`Calling callback for request #${requestId}`);
          callback(file);
          window.androidBridge?.captureRequests.delete(Number(requestId));
        } else {
          sendDebugLog('CameraError', `No callback found for request #${requestId}`);
          console.error(`No callback found for request ID: ${requestId}`);
        }
      } catch (error) {
        console.error('Error processing image from Android:', error);
        sendDebugLog('CameraError', `Failed to process image: ${error instanceof Error ? error.message : String(error)}`);
        
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
      console.error(`❌ Android camera error: ${requestId}, ${errorCode}, ${errorMessage}`);
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
  
  // Detailed checks for Android interfaces
  if (window.AndroidCamera) {
    sendDebugLog('Bridge', 'AndroidCamera interface available');
    
    const methods = [];
    if (typeof window.AndroidCamera.takePhoto === 'function') methods.push('takePhoto');
    if (typeof window.AndroidCamera.captureVideo === 'function') methods.push('captureVideo');
    if (typeof window.AndroidCamera.openCamera === 'function') methods.push('openCamera');
    
    console.log('📱 Available AndroidCamera methods:', methods);
    sendDebugLog('Bridge', `Available AndroidCamera methods: ${methods.join(', ') || 'none'}`);
    
    // Add explicit check to verify the takePhoto method actually works
    if (methods.includes('takePhoto')) {
      console.log('✅ AndroidCamera.takePhoto method is properly defined');
    } else {
      console.log('❌ AndroidCamera.takePhoto method is missing or not a function');
    }
  } else {
    console.log('❌ AndroidCamera interface not found');
    sendDebugLog('Bridge', 'AndroidCamera interface not found - will use fallback methods');
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
