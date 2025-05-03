
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to handle Android WebView camera interaction with improved debugging
 * and native communication bridge.
 */
export function useAndroidCamera() {
  const { toast } = useToast();
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastCaptureError, setLastCaptureError] = useState<string | null>(null);
  
  // Detect Android WebView specifically
  const isAndroidWebView = /Android/.test(navigator.userAgent) && 
                          (/wv/.test(navigator.userAgent) || 
                           /Version\/[0-9.]+/.test(navigator.userAgent));

  // Setup global handlers for Android communication if they don't exist
  useEffect(() => {
    if (typeof window !== 'undefined' && isAndroidWebView) {
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
          console.log(`Received image from Android native bridge: request #${requestId}, file size ${Math.round(base64Data.length * 0.75 / 1024)}KB`);
          
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
              callback(file);
            } else {
              console.error(`No callback found for camera request #${requestId}`);
            }
          } catch (error) {
            console.error('Error processing image from Android:', error);
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
    }
    
    // Cleanup function
    return () => {
      // We don't remove the global handlers as they might be used by other components
    };
  }, [toast, isAndroidWebView]);

  /**
   * Capture photo using Android's native camera integration
   */
  const capturePhotoWithAndroid = async (): Promise<File | null> => {
    if (!isAndroidWebView) {
      console.log('Not in Android WebView, using standard file input');
      // Let the normal file input handle it
      return null;
    }
    
    console.log('Using Android native camera bridge');
    setIsCapturing(true);
    setLastCaptureError(null);
    
    return new Promise((resolve) => {
      try {
        // Generate a request ID for this specific camera operation
        const requestId = window.androidBridge.nextRequestId++;
        
        // Store the callback in the request map
        window.androidBridge.captureRequests.set(requestId, (file: File | null) => {
          setIsCapturing(false);
          resolve(file);
        });
        
        // Call the Android function to open camera
        // This assumes the Android side has injected 'AndroidCamera' into the window object
        if (window.AndroidCamera && typeof window.AndroidCamera.takePhoto === 'function') {
          console.log(`Calling Android native camera with request #${requestId}`);
          window.AndroidCamera.takePhoto(requestId.toString());
        } else {
          console.error('AndroidCamera.takePhoto not available');
          window.androidBridge.captureRequests.delete(requestId);
          setIsCapturing(false);
          setLastCaptureError('Native camera not available');
          resolve(null);
        }
      } catch (error) {
        console.error('Error calling Android camera:', error);
        setIsCapturing(false);
        setLastCaptureError('Failed to access native camera');
        resolve(null);
      }
      
      // Safety timeout to prevent hanging promises
      setTimeout(() => {
        setIsCapturing(false);
        if (window.androidBridge.captureRequests.has(window.androidBridge.nextRequestId - 1)) {
          console.warn('Camera request timed out');
          window.androidBridge.captureRequests.delete(window.androidBridge.nextRequestId - 1);
          setLastCaptureError('Camera request timed out');
          resolve(null);
        }
      }, 60000); // 1 minute timeout
    });
  };

  // Define the Android bridge interfaces for TypeScript
  return {
    isCapturing,
    capturePhotoWithAndroid,
    lastCaptureError,
    clearError: () => setLastCaptureError(null),
    isAndroidWebView
  };
}

// Define global window properties for TypeScript
declare global {
  interface Window {
    AndroidCamera?: {
      takePhoto: (requestId: string) => void;
      captureVideo: (requestId: string) => void;
    };
    androidBridge?: {
      captureRequests: Map<number, (file: File | null) => void>;
      nextRequestId: number;
    };
    receiveImageFromAndroid?: (requestId: string, base64Data: string, fileName: string, mimeType: string) => void;
    receiveAndroidCameraError?: (requestId: string, errorCode: string, errorMessage: string) => void;
  }
}
