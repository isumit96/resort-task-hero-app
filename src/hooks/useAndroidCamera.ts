
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  isAndroidWebView, 
  isNativeCameraAvailable, 
  isOpenCameraAvailable,
  takeNativePhoto,
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
      
      sendDebugLog('Setup', `Android WebView detected. Native camera available: ${hasNativeCamera}`);
    }
    
    // Cleanup function
    return () => {
      // We don't remove the global handlers as they might be used by other components
    };
  }, [toast, isInAndroidWebView, hasNativeCamera]);

  /**
   * Capture photo using Android's native camera integration
   * Now supports both the takePhoto and openCamera methods
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
        const requestId = window.androidBridge!.nextRequestId++;
        
        // Set up timeout for operation
        const timeoutId = setTimeout(() => {
          if (window.androidBridge?.captureRequests.has(requestId)) {
            sendDebugLog('CameraError', `Timeout for request #${requestId} after 30 seconds`);
            window.androidBridge.captureRequests.delete(requestId);
            setIsCapturing(false);
            setLastCaptureError('Camera operation timed out');
            
            toast({
              title: 'Camera Timeout',
              description: 'The camera operation took too long and was cancelled',
              variant: 'destructive'
            });
            
            resolve(null);
          }
        }, 30000); // 30 second timeout - more reasonable than a full minute
        
        // Store the callback in the request map
        window.androidBridge!.captureRequests.set(requestId, (file: File | null) => {
          clearTimeout(timeoutId);
          setIsCapturing(false);
          sendDebugLog('Camera', `Camera operation complete for request #${requestId}`);
          
          if (file) {
            toast({
              title: 'Photo Captured',
              description: 'Photo successfully captured from camera'
            });
          }
          
          resolve(file);
        });
        
        // Try to use the new or old camera method
        const cameraOpened = takeNativePhoto(requestId.toString());
        
        if (!cameraOpened) {
          clearTimeout(timeoutId);
          window.androidBridge!.captureRequests.delete(requestId);
          setIsCapturing(false);
          setLastCaptureError('Native camera not available - falling back to file input');
          sendDebugLog('CameraError', 'Failed to open native camera - using fallback');
          resolve(null);
        }
      } catch (error) {
        console.error('Error calling Android camera:', error);
        sendDebugLog('CameraError', `Exception: ${error}`);
        setIsCapturing(false);
        setLastCaptureError('Failed to access native camera');
        
        toast({
          title: 'Camera Error',
          description: 'Failed to access the camera. Please try again.',
          variant: 'destructive'
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
    hasNativeCamera
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
