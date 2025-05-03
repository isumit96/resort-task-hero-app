
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  isAndroidWebView, 
  isNativeCameraAvailable, 
  isOpenCameraAvailable,
  takeNativePhoto,
  openNativeCamera,
  sendDebugLog,
  initializeAndroidBridge,
  checkConnectivity
} from '@/utils/android-bridge';

/**
 * Hook to handle Android WebView camera interaction with improved debugging
 * and native communication bridge.
 */
export function useAndroidCamera() {
  const { toast } = useToast();
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastCaptureError, setLastCaptureError] = useState<string | null>(null);
  
  // Detect if we're in an Android WebView
  const isInAndroidWebView = isAndroidWebView();
  
  // Check for native camera availability
  const hasNativeCamera = isNativeCameraAvailable() || isOpenCameraAvailable();
  
  // Direct method availability
  const hasDirectCamera = isOpenCameraAvailable();

  // Setup global handlers for Android communication if they don't exist
  useEffect(() => {
    if (typeof window !== 'undefined' && isInAndroidWebView) {
      // Initialize the Android bridge
      initializeAndroidBridge();
      
      // Create or ensure the global bridge object for Android communication
      if (!window.androidBridge) {
        window.androidBridge = {
          captureRequests: new Map(),
          nextRequestId: 1
        };
      }
      
      sendDebugLog('Setup', `Android WebView detected. Native camera available: ${hasNativeCamera}, Direct camera available: ${hasDirectCamera}`);
    }
    
    // Cleanup function
    return () => {
      // We don't remove the global handlers as they might be used by other components
    };
  }, [isInAndroidWebView, hasNativeCamera, hasDirectCamera]);

  /**
   * Capture photo using Android's native camera integration
   * Prioritizes the direct openCamera method when available
   */
  const capturePhotoWithAndroid = async (): Promise<File | null> => {
    if (!isInAndroidWebView) {
      sendDebugLog('Camera', 'Not in Android WebView, using standard file input');
      // Let the normal file input handle it
      return null;
    }
    
    // Check connectivity first
    if (!checkConnectivity()) {
      const errorMsg = 'No internet connection. Please check your connectivity and try again.';
      setLastCaptureError(errorMsg);
      toast({
        title: 'Connectivity Error',
        description: errorMsg,
        variant: 'destructive'
      });
      return null;
    }
    
    sendDebugLog('Camera', 'Using Android native camera bridge');
    setIsCapturing(true);
    setLastCaptureError(null);
    
    return new Promise((resolve) => {
      try {
        // Generate a request ID for this specific camera operation
        const requestId = window.androidBridge.nextRequestId++;
        
        // Add timeout to prevent hanging promises
        const timeoutId = setTimeout(() => {
          if (window.androidBridge.captureRequests.has(requestId)) {
            sendDebugLog('CameraError', `Timeout for request #${requestId} after 30 seconds`);
            
            const callback = window.androidBridge.captureRequests.get(requestId);
            if (callback) {
              callback(null);
            }
            
            window.androidBridge.captureRequests.delete(requestId);
            setIsCapturing(false);
            setLastCaptureError('Camera request timed out');
            
            toast({
              title: 'Camera Timeout',
              description: 'The camera operation took too long and was cancelled',
              variant: 'destructive'
            });
            
            resolve(null);
          }
        }, 30000); // 30 second timeout
        
        // Store the callback in the request map with timeout cleanup
        window.androidBridge.captureRequests.set(requestId, (file: File | null) => {
          clearTimeout(timeoutId);
          setIsCapturing(false);
          sendDebugLog('Camera', `Camera operation complete for request #${requestId}`);
          
          if (file) {
            sendDebugLog('Camera', `Received file: ${file.name} (${Math.round(file.size/1024)}KB)`);
            
            // Check for empty files
            if (!file.size || file.size === 0) {
              const errorMsg = "Camera returned an empty image. Please try again.";
              setLastCaptureError(errorMsg);
              sendDebugLog('CameraError', `Empty file received: ${file.name}`);
              
              toast({
                title: "Camera error",
                description: errorMsg,
                variant: "destructive"
              });
              
              resolve(null);
              return;
            }
            
            toast({
              title: "Photo received",
              description: "Successfully received photo from camera"
            });
          } else {
            setLastCaptureError('Failed to capture photo');
          }
          
          resolve(file);
        });
        
        // Try to use the preferred methods in order
        if (hasDirectCamera) {
          // Use openCamera as first choice when available
          try {
            sendDebugLog('Camera', 'Using preferred direct openCamera method');
            window.AndroidCamera.openCamera();
          } catch (e) {
            sendDebugLog('CameraError', `Direct openCamera failed: ${e}`);
            
            // Fall back to takePhoto if openCamera fails
            const cameraOpened = takeNativePhoto(requestId.toString());
            
            if (!cameraOpened) {
              clearTimeout(timeoutId);
              window.androidBridge.captureRequests.delete(requestId);
              setIsCapturing(false);
              setLastCaptureError('Native camera not available');
              sendDebugLog('CameraError', 'Failed to open native camera');
              
              toast({
                title: "Camera Error",
                description: "Failed to access the camera. Please try again.",
                variant: "destructive"
              });
              
              resolve(null);
            }
          }
        } else {
          // Use takePhoto if openCamera is not available
          const cameraOpened = takeNativePhoto(requestId.toString());
          
          if (!cameraOpened) {
            clearTimeout(timeoutId);
            window.androidBridge.captureRequests.delete(requestId);
            setIsCapturing(false);
            setLastCaptureError('Native camera not available');
            sendDebugLog('CameraError', 'Failed to open native camera');
            
            toast({
              title: "Camera Error",
              description: "Failed to access the camera. Please try again.",
              variant: "destructive"
            });
            
            resolve(null);
          }
        }
      } catch (error) {
        console.error('Error calling Android camera:', error);
        sendDebugLog('CameraError', `Exception: ${error}`);
        setIsCapturing(false);
        setLastCaptureError('Failed to access native camera');
        
        toast({
          title: "Camera Error",
          description: "An error occurred while accessing the camera",
          variant: "destructive"
        });
        
        resolve(null);
      }
    });
  };

  // Return the enhanced hook functionality
  return {
    isCapturing,
    capturePhotoWithAndroid,
    lastCaptureError,
    clearError: () => setLastCaptureError(null),
    isAndroidWebView: isInAndroidWebView,
    hasNativeCamera,
    hasDirectCamera
  };
}

// Define global window properties for TypeScript
declare global {
  interface Window {
    androidBridge?: {
      captureRequests: Map<number, (file: File | null) => void>;
      nextRequestId: number;
    };
    receiveImageFromAndroid?: (requestId: string, base64Data: string, fileName: string, mimeType: string) => void;
    receiveAndroidCameraError?: (requestId: string, errorCode: string, errorMessage: string) => void;
  }
}
