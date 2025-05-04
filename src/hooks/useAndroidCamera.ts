
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
  
  // Detect if we're in an Android WebView - improved detection
  const isInAndroidWebView = isAndroidWebView();
  
  // Check for native camera availability
  const hasNativeCamera = isNativeCameraAvailable();

  // Setup global handlers for Android communication
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Always initialize the bridge for more robust detection
      initializeAndroidBridge();
      
      console.log('🔍 Android camera detection results:', { 
        isInAndroidWebView, 
        hasNativeCamera,
        androidCameraObject: window.AndroidCamera ? 'exists' : 'missing'
      });
      
      if (isInAndroidWebView) {
        console.log('📱 Running inside Android WebView');
        sendDebugLog('Setup', `Android WebView detected. Native camera available: ${hasNativeCamera}`);
      } else {
        console.log('🌐 Running in regular browser');
        sendDebugLog('Setup', 'Not in Android WebView, will use standard camera access');
      }
    }
  }, [isInAndroidWebView, hasNativeCamera]);

  /**
   * Capture photo using Android's native camera integration
   * with improved fallback and error handling
   */
  const capturePhotoWithAndroid = async (): Promise<File | null> => {
    if (!isInAndroidWebView || !hasNativeCamera) {
      console.log('🌐 Not using Android WebView camera bridge - using standard file input');
      sendDebugLog('Camera', `Not using Android camera bridge. In WebView: ${isInAndroidWebView}, Has native camera: ${hasNativeCamera}`);
      // Let the normal file input handle it
      return null;
    }
    
    console.log('🔍 AndroidCamera availability check:', { 
      hasNativeCamera, 
      AndroidCamera: !!window.AndroidCamera,
      takePhotoMethodExists: window.AndroidCamera ? typeof window.AndroidCamera.takePhoto : 'undefined'
    });
    
    console.log('📱 Will use Android native camera bridge');
    sendDebugLog('Camera', 'Using Android native camera bridge');
    setIsCapturing(true);
    setLastCaptureError(null);
    
    return new Promise((resolve) => {
      try {
        // Generate a request ID for this specific camera operation
        const requestId = window.androidBridge ? window.androidBridge.nextRequestId++ : Date.now();
        
        console.log('📸 Camera operation requestId:', requestId);
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
        if (!window.androidBridge) {
          console.error('❌ Android bridge not initialized');
          sendDebugLog('CameraError', 'Android bridge not initialized');
          clearTimeout(timeoutId);
          setIsCapturing(false);
          setLastCaptureError('Android camera not available');
          resolve(null);
          return;
        }
        
        window.androidBridge.captureRequests.set(requestId, (file: File | null) => {
          clearTimeout(timeoutId);
          setIsCapturing(false);
          sendDebugLog('Camera', `Camera operation complete for request #${requestId}`);
          
          if (file) {
            console.log(`📥 Received file from camera: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
            
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
        
        // Try to use the camera method with clear logging
        console.log('📸 BEFORE calling takeNativePhoto');
        const cameraOpened = takeNativePhoto(requestId.toString());
        console.log('📸 AFTER calling takeNativePhoto, result:', cameraOpened);
        sendDebugLog('Camera', `Native camera opened: ${cameraOpened}`);
        
        if (!cameraOpened) {
          clearTimeout(timeoutId);
          window.androidBridge.captureRequests.delete(requestId);
          setIsCapturing(false);
          setLastCaptureError('Failed to open native camera - falling back to file input');
          sendDebugLog('CameraError', 'Failed to open native camera - using fallback');
          resolve(null);
        }
      } catch (error) {
        console.error('❌ Error calling Android camera:', error);
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
