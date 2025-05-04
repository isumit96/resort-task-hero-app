
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
  const [permissionRequested, setPermissionRequested] = useState(false);
  
  // Detect if we're in an Android WebView
  const isInAndroidWebView = isAndroidWebView();
  
  // Check for native camera availability
  const hasNativeCamera = isNativeCameraAvailable();

  // Handle Android permission request results
  useEffect(() => {
    const handlePermissionResult = (event: CustomEvent) => {
      const { granted } = event.detail;
      
      if (granted) {
        sendDebugLog('Permissions', 'Camera permission granted by user');
        setPermissionRequested(false);
      } else {
        sendDebugLog('Permissions', 'Camera permission denied by user');
        setLastCaptureError('Camera permission denied');
        setPermissionRequested(false);
        
        toast({
          title: 'Permission Required',
          description: 'Camera permission is required to take photos',
          variant: 'destructive'
        });
      }
    };
    
    document.addEventListener('android-permission-result', handlePermissionResult as EventListener);
    
    return () => {
      document.removeEventListener('android-permission-result', handlePermissionResult as EventListener);
    };
  }, [toast]);

  // Setup global handlers for Android communication
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize the bridge for robust detection
      initializeAndroidBridge();
      
      if (isInAndroidWebView) {
        sendDebugLog('Setup', `Android WebView detected. Native camera available: ${hasNativeCamera}`);
      } else {
        sendDebugLog('Setup', 'Not in Android WebView, will use standard camera access');
      }
    }
  }, [isInAndroidWebView, hasNativeCamera]);

  // Check camera permission
  const checkCameraPermission = async (): Promise<boolean> => {
    if (!window.AndroidCamera?.checkCameraPermission) {
      return true; // Assume permission granted if we can't check
    }
    
    try {
      const hasPermission = window.AndroidCamera.checkCameraPermission();
      return hasPermission;
    } catch (e) {
      return false;
    }
  };

  // Request camera permission
  const requestCameraPermission = async (): Promise<boolean> => {
    if (!window.AndroidCamera?.requestCameraPermission) {
      return false;
    }
    
    setPermissionRequested(true);
    
    try {
      const granted = await window.AndroidCamera.requestCameraPermission();
      setPermissionRequested(false);
      return granted;
    } catch (e) {
      setPermissionRequested(false);
      return false;
    }
  };

  /**
   * Capture photo using Android's native camera integration
   * with improved fallback and error handling
   */
  const capturePhotoWithAndroid = async (): Promise<File | null> => {
    if (!isInAndroidWebView || !hasNativeCamera) {
      sendDebugLog('Camera', `Not using Android camera bridge. In WebView: ${isInAndroidWebView}, Has native camera: ${hasNativeCamera}`);
      // Let the normal file input handle it
      return null;
    }
    
    sendDebugLog('Camera', 'Using Android native camera bridge');
    setIsCapturing(true);
    setLastCaptureError(null);
    
    // First check if we have camera permission
    const hasPermission = await checkCameraPermission();
    if (!hasPermission) {
      sendDebugLog('Camera', 'Requesting camera permission');
      
      const permissionGranted = await requestCameraPermission();
      if (!permissionGranted) {
        setIsCapturing(false);
        setLastCaptureError('Camera permission denied');
        
        toast({
          title: 'Permission Denied',
          description: 'Camera permission is required to take photos',
          variant: 'destructive'
        });
        
        return null;
      }
    }
    
    return new Promise((resolve) => {
      try {
        // Generate a request ID for this specific camera operation
        const requestId = window.androidBridge ? window.androidBridge.nextRequestId++ : Date.now();
        
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
        
        // Try to use the camera method
        const cameraOpened = takeNativePhoto(requestId.toString());
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
    hasNativeCamera,
    checkCameraPermission,
    requestCameraPermission,
    permissionRequested
  };
}
