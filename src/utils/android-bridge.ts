
/**
 * Utility functions for the Android WebView JavaScript bridge.
 * These functions help with communication between the Android app and the web app.
 */

/**
 * Check if the current environment is an Android WebView
 */
export const isAndroidWebView = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  // Check for Android platform
  const isAndroid = /Android/.test(navigator.userAgent);
  const hasWebViewSignature = 
    /wv/.test(navigator.userAgent) || 
    /Version\/[0-9.]+/.test(navigator.userAgent) ||
    /Android.*Mobile.*Chrome\/[.0-9]* (?!Mobile)/i.test(navigator.userAgent);
    
  // Check for custom WebView marker
  const hasCustomMarker = navigator.userAgent.includes('AndroidAppWebView');
  
  // Check for WebView-specific objects
  const hasAndroidObject = typeof window !== 'undefined' && (
    !!window.AndroidCamera || 
    !!window.AndroidLogger
  );
  
  // If the Android bridge is present, we're definitely in WebView
  if (hasAndroidObject) {
    return true;
  }
  
  // If we're on Android and have any WebView signatures, consider it a WebView
  return isAndroid && (hasWebViewSignature || hasCustomMarker);
};

/**
 * Check if the native Android camera bridge is available
 */
export const isNativeCameraAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const androidCameraExists = !!window.AndroidCamera;
  const takePhotoMethodExists = androidCameraExists && typeof window.AndroidCamera.takePhoto === 'function';
  
  return androidCameraExists && takePhotoMethodExists;
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
 * Minimal version that only sends critical logs
 */
export const sendDebugLog = (tag: string, message: string): void => {
  // Only send logs to Android if the logger is available
  if (typeof window !== 'undefined' && window.AndroidLogger?.logDebug) {
    try {
      window.AndroidLogger.logDebug(tag, message);
    } catch (e) {
      // Silent fail
    }
  }
};

/**
 * Open the native camera directly using the new AndroidCamera.openCamera method
 */
export const openNativeCamera = (): boolean => {
  if (isOpenCameraAvailable()) {
    try {
      window.AndroidCamera.openCamera();
      sendDebugLog('Camera', 'Opening native camera with direct method');
      return true;
    } catch (e) {
      sendDebugLog('CameraError', `Failed to open native camera`);
      return false;
    }
  }
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
  
  sendDebugLog('Camera', `Taking photo with request ID: ${actualRequestId}`);
  
  // Check for AndroidCamera object
  const androidCameraExists = !!window.AndroidCamera;
  const takePhotoMethodExists = androidCameraExists && typeof window.AndroidCamera.takePhoto === 'function';
  
  // Try using Android native camera if available
  if (androidCameraExists && takePhotoMethodExists) {
    try {
      // Call the Android native method
      sendDebugLog('Camera', `Calling AndroidCamera.takePhoto with ID: ${actualRequestId}`);
      
      const cameraPromiseResult = window.AndroidCamera.takePhoto(actualRequestId);
      
      // Check if there was an immediate error
      if (cameraPromiseResult === false) {
        sendDebugLog('CameraError', 'Camera returned false - possible permission issue');
        return false;
      }
      
      sendDebugLog('Camera', 'Native camera method called successfully');
      return true;
    } catch (e) {
      sendDebugLog('CameraError', `takePhoto failed: ${e instanceof Error ? e.message : String(e)}`);
      
      // Create and dispatch an error event to be handled by the app
      const errorEvent = new CustomEvent('android-file-error', {
        detail: {
          errorType: 'CAMERA_ERROR',
          message: e instanceof Error ? e.message : 'Failed to access camera'
        }
      });
      document.dispatchEvent(errorEvent);
      
      return false;
    }
  }
  
  sendDebugLog('Camera', 'Native camera methods not available - will use fallback');
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
      sendDebugLog('CameraError', `captureVideo failed: ${e}`);
      return false;
    }
  }
  
  sendDebugLog('Camera', 'Native video recording not available');
  return false;
};

/**
 * Initialize the Android bridge
 */
export const initializeAndroidBridge = (): void => {
  if (typeof window === 'undefined') return;
  
  // Check if we're in an Android WebView
  const inWebView = isAndroidWebView();
  
  sendDebugLog('Bridge', `Initializing Android bridge (inWebView: ${inWebView})`);
  
  // Initialize the bridge object if it doesn't exist
  if (!window.androidBridge) {
    window.androidBridge = {
      captureRequests: new Map(),
      nextRequestId: 1
    };
  }
  
  // Set up global handlers for Android communication
  if (typeof window.receiveImageFromAndroid !== 'function') {
    window.receiveImageFromAndroid = (requestId, base64Data, fileName, mimeType) => {
      sendDebugLog('Camera', `Received image from Android: requestId=${requestId}, fileName=${fileName}`);
      
      try {
        if (!base64Data || base64Data.length === 0) {
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
        
        sendDebugLog('Camera', `Processed image: size=${file.size} bytes`);
        
        // Call the stored callback
        const callback = window.androidBridge?.captureRequests.get(Number(requestId));
        if (callback) {
          sendDebugLog('Camera', `Calling callback for request #${requestId}`);
          callback(file);
          window.androidBridge?.captureRequests.delete(Number(requestId));
        } else {
          sendDebugLog('CameraError', `No callback found for request #${requestId}`);
        }
      } catch (error) {
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
      sendDebugLog('CameraError', `Android error for #${requestId}: [${errorCode}] ${errorMessage}`);
      
      // Call the stored callback with null to signal error
      const callback = window.androidBridge?.captureRequests.get(Number(requestId));
      if (callback) {
        callback(null);
        window.androidBridge?.captureRequests.delete(Number(requestId));
        sendDebugLog('Camera', `Camera operation complete for request #${requestId}`);
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
  
  // Check for Android interfaces
  if (window.AndroidCamera) {
    const methods = [];
    if (typeof window.AndroidCamera.takePhoto === 'function') methods.push('takePhoto');
    if (typeof window.AndroidCamera.captureVideo === 'function') methods.push('captureVideo');
    if (typeof window.AndroidCamera.openCamera === 'function') methods.push('openCamera');
    if (typeof window.AndroidCamera.checkCameraPermission === 'function') methods.push('checkCameraPermission');
    if (typeof window.AndroidCamera.requestCameraPermission === 'function') methods.push('requestCameraPermission');
    
    sendDebugLog('Bridge', `Available AndroidCamera methods: ${methods.join(', ') || 'none'}`);
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
      takePhoto: (requestId: string) => boolean | Promise<boolean>;
      captureVideo?: (requestId: string) => void;
      openCamera?: () => void;
      checkCameraPermission?: () => boolean;
      requestCameraPermission?: () => Promise<boolean>;
    };
    receiveImageFromAndroid?: (requestId: string, base64Data: string, fileName: string, mimeType: string) => void;
    receiveAndroidCameraError?: (requestId: string, errorCode: string, errorMessage: string) => void;
    androidBridge?: {
      captureRequests: Map<number, (file: File | null) => void>;
      nextRequestId: number;
    };
  }
}
