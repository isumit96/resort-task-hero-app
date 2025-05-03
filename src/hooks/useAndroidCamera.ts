
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  isAndroidWebView, 
  isNativeCameraAvailable,
  takeNativePhoto,
  sendDebugLog,
  initializeAndroidBridge
} from '@/utils/android-bridge';

/**
 * Hook to handle Android WebView camera interaction with robust fallback
 * and native communication bridge.
 */
export function useAndroidCamera() {
  const { toast } = useToast();
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastCaptureError, setLastCaptureError] = useState<string | null>(null);
  
  // Detect if we're in an Android WebView - more aggressive detection
  const isInAndroidWebView = isAndroidWebView();
  
  // Check for native camera availability
  const hasNativeCamera = isNativeCameraAvailable();

  // Setup global handlers for Android communication
  useEffect(() => {
    if (typeof window !== 'undefined' && isInAndroidWebView) {
      // Initialize the Android bridge
      initializeAndroidBridge();
      
      console.log('Setting up Android camera bridge:', { 
        isInAndroidWebView, 
        hasNativeCamera,
        androidCameraObject: window.AndroidCamera ? 'exists' : 'missing'
      });
      
      sendDebugLog('Setup', `Android WebView detected. Native camera available: ${hasNativeCamera}`);
    }
    
    // Cleanup function
    return () => {
      // We don't remove the global handlers as they might be used by other components
    };
  }, [isInAndroidWebView, hasNativeCamera]);

  /**
   * Capture photo using Android's native camera integration
   * with improved fallback and error handling
   */
  const capturePhotoWithAndroid = async (): Promise<File | null> => {
    if (!isInAndroidWebView) {
      console.log('Not in Android WebView, using standard file input');
      sendDebugLog('Camera', 'Not in Android WebView, using standard file input');
      // Let the normal file input handle it
      return null;
    }
    
    console.log('Camera availability check:', { 
      hasNativeCamera, 
      AndroidCamera: !!window.AndroidCamera,
      takePhotoMethodExists: window.AndroidCamera ? typeof window.AndroidCamera.takePhoto : 'undefined'
    });
    
    if (!hasNativeCamera) {
      console.log('Native camera not available, using file input fallback');
      sendDebugLog('Camera', 'Native camera not available, using file input fallback');
      return null;
    }
    
    console.log('Using Android native camera bridge');
    sendDebugLog('Camera', 'Using Android native camera bridge');
    setIsCapturing(true);
    setLastCaptureError(null);
    
    return new Promise((resolve) => {
      try {
        // Generate a request ID for this specific camera operation
        const requestId = window.androidBridge!.nextRequestId++;
        
        console.log('Camera operation requestId:', requestId);
        sendDebugLog('Camera', `Starting camera operation with requestId: ${requestId}`);
        
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
        }, 30000); // 30 second timeout
        
        // Store the callback in the request map
        window.androidBridge!.captureRequests.set(requestId, (file: File | null) => {
          clearTimeout(timeoutId);
          setIsCapturing(false);
          sendDebugLog('Camera', `Camera operation complete for request #${requestId}`);
          
          if (file) {
            console.log(`Received file from camera: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
            
            // Validate the file
            if (!file.size || file.size === 0) {
              sendDebugLog('CameraError', 'Empty file received from camera');
              setLastCaptureError('Camera returned an empty image');
              
              toast({
                title: 'Camera Error',
                description: 'Camera returned an empty image. Please try again.',
                variant: 'destructive'
              });
              
              resolve(null);
              return;
            }
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
              sendDebugLog('CameraError', `Invalid file type received: ${file.type}`);
              setLastCaptureError('Invalid image type');
              
              toast({
                title: 'Camera Error',
                description: 'Invalid image type received. Please try again.',
                variant: 'destructive'
              });
              
              resolve(null);
              return;
            }
            
            toast({
              title: 'Photo Captured',
              description: 'Photo successfully captured from camera'
            });
          }
          
          resolve(file);
        });
        
        // Try to use the camera method - LOG THE RESULT
        const cameraOpened = takeNativePhoto(requestId.toString());
        console.log('Native camera method called, result:', cameraOpened);
        sendDebugLog('Camera', `Native camera opened: ${cameraOpened}`);
        
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
        sendDebugLog('CameraError', `Exception: ${error instanceof Error ? error.message : String(error)}`);
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
