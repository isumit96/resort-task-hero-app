
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  isAndroidWebView, 
  isNativeCameraAvailable, 
  isOpenCameraAvailable,
  takeNativePhoto,
  openNativeCamera,
  sendDebugLog,
  initializeAndroidBridge
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
      
      // Handler for receiving camera files from Android native code
      if (!window.receiveImageFromAndroid) {
        window.receiveImageFromAndroid = (requestId: string, base64Data: string, fileName: string, mimeType: string) => {
          sendDebugLog('Camera', `Received image from Android: request #${requestId}, file size ${Math.round(base64Data.length * 0.75 / 1024)}KB`);
          
          try {
            // Create file from base64 data
            const byteString = atob(base64Data);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            
            const blob = new Blob([ab], { type: mimeType });
            const file = new File([blob], fileName || 'camera-photo.jpg', { type: mimeType });
            
            // Get the callback for this specific request
            const callback = window.androidBridge.captureRequests.get(parseInt(requestId));
            
            if (callback) {
              // Clear the capture request
              window.androidBridge.captureRequests.delete(parseInt(requestId));
              sendDebugLog('Camera', 'Successfully processed image, calling callback');
              callback(file);
              
              toast({
                title: "Photo received",
                description: "Successfully received photo from camera",
              });
            } else {
              console.error(`No callback found for camera request #${requestId}`);
              sendDebugLog('CameraError', `No callback found for request #${requestId}`);
              
              // For direct camera calls (openCamera), we might not have a request ID
              // So let's check if we have any pending callbacks
              if (window.androidBridge.captureRequests.size > 0) {
                // Get the most recent request
                const lastRequestId = Math.max(...Array.from(window.androidBridge.captureRequests.keys()));
                const callback = window.androidBridge.captureRequests.get(lastRequestId);
                
                if (callback) {
                  window.androidBridge.captureRequests.delete(lastRequestId);
                  sendDebugLog('Camera', `Using most recent request #${lastRequestId} for direct camera call`);
                  callback(file);
                }
              }
            }
          } catch (error) {
            console.error('Error processing image from Android:', error);
            sendDebugLog('CameraError', `Processing error: ${error}`);
            setLastCaptureError('Failed to process image from camera');
            
            // Try to resolve the request as failed
            const callback = window.androidBridge.captureRequests.get(parseInt(requestId));
            if (callback) {
              window.androidBridge.captureRequests.delete(parseInt(requestId));
              callback(null);
            }
          }
        };
      }
      
      // Handler for receiving camera errors from Android native code
      if (!window.receiveAndroidCameraError) {
        window.receiveAndroidCameraError = (requestId: string, errorCode: string, errorMessage: string) => {
          console.error(`Android camera error for request #${requestId}: [${errorCode}] ${errorMessage}`);
          sendDebugLog('CameraError', `Android error for #${requestId}: [${errorCode}] ${errorMessage}`);
          
          setLastCaptureError(errorMessage || 'Camera operation failed');
          
          // Get the callback for this specific request
          const callback = window.androidBridge.captureRequests.get(parseInt(requestId));
          
          if (callback) {
            // Clear the request
            window.androidBridge.captureRequests.delete(parseInt(requestId));
            callback(null);
            
            // Show toast notification
            toast({
              title: 'Camera Error',
              description: errorMessage || `Error code: ${errorCode}`,
              variant: 'destructive'
            });
          }
        };
      }
      
      sendDebugLog('Setup', `Android WebView detected. Native camera available: ${hasNativeCamera}, Direct camera available: ${hasDirectCamera}`);
    }
    
    // Cleanup function
    return () => {
      // We don't remove the global handlers as they might be used by other components
    };
  }, [toast, isInAndroidWebView, hasNativeCamera, hasDirectCamera]);

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
    
    sendDebugLog('Camera', 'Using Android native camera bridge');
    setIsCapturing(true);
    setLastCaptureError(null);
    
    return new Promise((resolve) => {
      try {
        // Generate a request ID for this specific camera operation
        const requestId = window.androidBridge.nextRequestId++;
        
        // Store the callback in the request map
        window.androidBridge.captureRequests.set(requestId, (file: File | null) => {
          setIsCapturing(false);
          sendDebugLog('Camera', `Camera operation complete for request #${requestId}`);
          resolve(file);
        });
        
        // Try to use the new preferred direct camera method first
        if (isOpenCameraAvailable()) {
          try {
            sendDebugLog('Camera', 'Using preferred direct openCamera method');
            window.AndroidCamera.openCamera();
          } catch (e) {
            sendDebugLog('CameraError', `Direct openCamera failed, falling back: ${e}`);
            
            // Fall back to the older takePhoto method if openCamera fails
            const cameraOpened = takeNativePhoto(requestId.toString());
            
            if (!cameraOpened) {
              window.androidBridge.captureRequests.delete(requestId);
              setIsCapturing(false);
              setLastCaptureError('Native camera not available');
              sendDebugLog('CameraError', 'Failed to open native camera');
              resolve(null);
            }
          }
        } else {
          // Use the older takePhoto method if openCamera is not available
          const cameraOpened = takeNativePhoto(requestId.toString());
          
          if (!cameraOpened) {
            window.androidBridge.captureRequests.delete(requestId);
            setIsCapturing(false);
            setLastCaptureError('Native camera not available');
            sendDebugLog('CameraError', 'Failed to open native camera');
            resolve(null);
          }
        }
      } catch (error) {
        console.error('Error calling Android camera:', error);
        sendDebugLog('CameraError', `Exception: ${error}`);
        setIsCapturing(false);
        setLastCaptureError('Failed to access native camera');
        resolve(null);
      }
      
      // Safety timeout to prevent hanging promises
      setTimeout(() => {
        setIsCapturing(false);
        if (window.androidBridge.captureRequests.has(window.androidBridge.nextRequestId - 1)) {
          console.warn('Camera request timed out');
          sendDebugLog('CameraError', 'Camera request timed out after 30 seconds');
          window.androidBridge.captureRequests.delete(window.androidBridge.nextRequestId - 1);
          setLastCaptureError('Camera request timed out');
          resolve(null);
          
          toast({
            title: 'Camera Timeout',
            description: 'The camera operation took too long and was cancelled',
            variant: 'destructive'
          });
        }
      }, 30000); // 30 second timeout (reduced from 60 seconds)
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
