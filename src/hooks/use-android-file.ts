
import { useState, useEffect } from 'react';
import { getImageFromCamera, getVideoFromCamera } from '@/utils/storage';
import { useToast } from '@/hooks/use-toast';
import { 
  isAndroidWebView, 
  isNativeCameraAvailable,
  takeNativePhoto,
  takeNativeVideo,
  sendDebugLog,
  initializeAndroidBridge 
} from '@/utils/android-bridge';

export function useAndroidFile() {
  const { toast } = useToast();
  const [isCapturing, setIsCapturing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Is this running inside an Android WebView?
  const isAndroidWebView_ = isAndroidWebView();
  
  // Check for native camera availability
  const hasNativeCamera = isNativeCameraAvailable();

  // Initialize Android bridge if in WebView
  useEffect(() => {
    if (isAndroidWebView_) {
      initializeAndroidBridge();
      sendDebugLog('AndroidFile', 'Initialized Android file bridge');
    }
  }, [isAndroidWebView_]);

  // Set up listener for Android file errors
  useEffect(() => {
    const handleAndroidError = (e: CustomEvent) => {
      const { errorType, message } = e.detail;
      
      setUploadError(message || 'File upload failed');
      setIsCapturing(false);
      
      toast({
        title: errorType === 'CAMERA_UNAVAILABLE' ? 'Camera Error' : 'Upload Error',
        description: message,
        variant: "destructive"
      });

      sendDebugLog('AndroidFileError', `${errorType}: ${message}`);
    };
    
    document.addEventListener('android-file-error', handleAndroidError as EventListener);
    
    return () => {
      document.removeEventListener('android-file-error', handleAndroidError as EventListener);
    };
  }, [toast]);

  // Function to capture photo using camera with improved error handling
  const capturePhoto = async (): Promise<File | null> => {
    setIsCapturing(true);
    setUploadError(null);
    sendDebugLog('AndroidFile', 'Starting photo capture');
    
    try {
      let file: File | null = null;
      
      // First try using the native Android camera bridge
      if (isAndroidWebView_ && hasNativeCamera) {
        sendDebugLog('AndroidFile', 'Using native Android camera');
        
        // Generate a request ID for this specific operation
        const requestId = window.androidBridge ? window.androidBridge.nextRequestId++ : Date.now();
        
        file = await new Promise<File | null>((resolve) => {
          // Set up timeout for operation
          const timeoutId = setTimeout(() => {
            if (window.androidBridge?.captureRequests.has(requestId)) {
              sendDebugLog('CameraError', `Timeout for request #${requestId} after 30 seconds`);
              window.androidBridge.captureRequests.delete(requestId);
              setIsCapturing(false);
              setUploadError('Camera operation timed out');
              
              toast({
                title: 'Camera Timeout',
                description: 'The camera operation took too long and was cancelled',
                variant: 'destructive'
              });
              
              resolve(null);
            }
          }, 30000); // 30 second timeout
          
          // Store the callback in the request map
          if (window.androidBridge) {
            window.androidBridge.captureRequests.set(requestId, (file: File | null) => {
              clearTimeout(timeoutId);
              setIsCapturing(false);
              
              if (file) {
                // Validate the file
                if (!file.size || file.size === 0) {
                  sendDebugLog('CameraError', 'Empty file received from camera');
                  setUploadError('Camera returned an empty image');
                  
                  toast({
                    title: 'Camera Error',
                    description: 'Camera returned an empty image. Please try again.',
                    variant: 'destructive'
                  });
                  
                  resolve(null);
                  return;
                }
                
                // Validate the file type
                if (!file.type.startsWith('image/')) {
                  sendDebugLog('CameraError', `Invalid file type: ${file.type}`);
                  setUploadError('Invalid file type received');
                  
                  toast({
                    title: 'Camera Error',
                    description: 'Invalid file type received. Please try again.',
                    variant: 'destructive'
                  });
                  
                  resolve(null);
                  return;
                }
                
                // Success toast for better UX feedback
                toast({
                  title: 'Photo Captured',
                  description: 'Photo successfully captured from camera'
                });
              }
              
              resolve(file);
            });
            
            // Try to use the camera method
            const cameraOpened = takeNativePhoto(requestId.toString());
            console.log('Native camera opened:', cameraOpened);
            
            if (!cameraOpened) {
              clearTimeout(timeoutId);
              window.androidBridge.captureRequests.delete(requestId);
              
              // Fall back to standard file input approach
              sendDebugLog('AndroidFile', 'Native camera failed, falling back to file input');
              
              // Use the then method instead of await
              getImageFromCamera().then(result => {
                setIsCapturing(false);
                resolve(result);
              }).catch(err => {
                setIsCapturing(false);
                console.error('File input error:', err);
                resolve(null);
              });
            }
          } else {
            // No Android bridge, fall back to standard approach
            clearTimeout(timeoutId);
            setIsCapturing(false);
            resolve(null);
          }
        });
      } else {
        // Not in Android WebView or native camera not available
        sendDebugLog('AndroidFile', 'Using standard file input for photo capture');
        file = await getImageFromCamera();
      }
      
      // If file is null, it could mean user cancelled or there was an error 
      // that was already handled by the getImageFromCamera function
      if (!file) {
        setUploadError('No photo was captured');
        
        // Only show toast if we actually attempted to open camera (not a cancel)
        if (isAndroidWebView_) {
          toast({
            title: 'No Photo',
            description: 'No photo was captured or the camera was canceled',
            variant: "destructive"
          });
        }
      } else {
        // Validate the file
        if (file.size === 0) {
          setUploadError('Camera returned an empty image');
          
          toast({
            title: 'Camera Error',
            description: 'Camera returned an empty image. Please try again.',
            variant: 'destructive'
          });
          
          return null;
        }
        
        // Success toast for better UX feedback
        toast({
          title: 'Photo Captured',
          description: 'Photo successfully captured from camera'
        });
      }
      
      return file;
    } catch (error) {
      console.error('Photo capture error:', error);
      sendDebugLog('AndroidFileError', `Photo capture error: ${error instanceof Error ? error.message : String(error)}`);
      setUploadError('Failed to capture photo');
      
      toast({
        title: 'Camera Error',
        description: error instanceof Error ? error.message : 'Failed to capture photo',
        variant: "destructive"
      });
      
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  // Function to capture video using camera with improved error handling
  const captureVideo = async (): Promise<File | null> => {
    setIsCapturing(true);
    setUploadError(null);
    sendDebugLog('AndroidFile', 'Starting video capture');
    
    try {
      let file: File | null = null;
      
      // First try using the native Android camera bridge
      if (isAndroidWebView_ && hasNativeCamera && window.AndroidCamera?.captureVideo) {
        sendDebugLog('AndroidFile', 'Using native Android camera for video');
        
        // Generate a request ID for this specific operation
        const requestId = window.androidBridge ? window.androidBridge.nextRequestId++ : Date.now();
        
        file = await new Promise<File | null>((resolve) => {
          // Set up timeout for operation
          const timeoutId = setTimeout(() => {
            if (window.androidBridge?.captureRequests.has(requestId)) {
              sendDebugLog('CameraError', `Timeout for video request #${requestId} after 60 seconds`);
              window.androidBridge.captureRequests.delete(requestId);
              setIsCapturing(false);
              setUploadError('Video recording timed out');
              
              toast({
                title: 'Camera Timeout',
                description: 'The video recording took too long and was cancelled',
                variant: 'destructive'
              });
              
              resolve(null);
            }
          }, 60000); // 60 second timeout for video (longer than photos)
          
          // Store the callback in the request map
          if (window.androidBridge) {
            window.androidBridge.captureRequests.set(requestId, (file: File | null) => {
              clearTimeout(timeoutId);
              setIsCapturing(false);
              
              if (file) {
                // Validate the file
                if (!file.size || file.size === 0) {
                  sendDebugLog('CameraError', 'Empty video file received');
                  setUploadError('Camera returned an empty video');
                  
                  toast({
                    title: 'Camera Error',
                    description: 'Camera returned an empty video. Please try again.',
                    variant: 'destructive'
                  });
                  
                  resolve(null);
                  return;
                }
                
                // Validate file type
                if (!file.type.startsWith('video/')) {
                  sendDebugLog('CameraError', `Invalid video file type: ${file.type}`);
                  setUploadError('Invalid video file type');
                  
                  toast({
                    title: 'Camera Error',
                    description: 'Invalid video file type received. Please try again.',
                    variant: 'destructive'
                  });
                  
                  resolve(null);
                  return;
                }
                
                // Success toast for better UX feedback
                toast({
                  title: 'Video Recorded',
                  description: 'Video successfully recorded from camera'
                });
              }
              
              resolve(file);
            });
            
            // Try to use the camera method
            const cameraOpened = takeNativeVideo(requestId.toString());
            console.log('Native video recording started:', cameraOpened);
            
            if (!cameraOpened) {
              clearTimeout(timeoutId);
              window.androidBridge.captureRequests.delete(requestId);
              
              // Fall back to standard file input approach
              sendDebugLog('AndroidFile', 'Native video recording failed, falling back to file input');
              
              // Use the then method instead of await
              getVideoFromCamera().then(result => {
                setIsCapturing(false);
                resolve(result);
              }).catch(err => {
                setIsCapturing(false);
                console.error('File input error:', err);
                resolve(null);
              });
            }
          } else {
            // No Android bridge, fall back to standard approach
            clearTimeout(timeoutId);
            setIsCapturing(false);
            resolve(null);
          }
        });
      } else {
        // Not in Android WebView or native camera not available
        sendDebugLog('AndroidFile', 'Using standard file input for video capture');
        file = await getVideoFromCamera();
      }
      
      if (!file) {
        setUploadError('No video was recorded');
        
        // Only show toast if we actually attempted to open camera (not a cancel)
        if (isAndroidWebView_) {
          toast({
            title: 'No Video',
            description: 'No video was recorded or the camera was canceled',
            variant: "destructive"
          });
        }
      } else {
        // Validate the file
        if (file.size === 0) {
          setUploadError('Camera returned an empty video');
          
          toast({
            title: 'Camera Error',
            description: 'Camera returned an empty video. Please try again.',
            variant: 'destructive'
          });
          
          return null;
        }
        
        // Success toast for better UX feedback
        toast({
          title: 'Video Recorded',
          description: 'Video successfully recorded from camera'
        });
      }
      
      return file;
    } catch (error) {
      console.error('Video capture error:', error);
      sendDebugLog('AndroidFileError', `Video capture error: ${error instanceof Error ? error.message : String(error)}`);
      setUploadError('Failed to record video');
      
      toast({
        title: 'Camera Error',
        description: error instanceof Error ? error.message : 'Failed to record video',
        variant: "destructive"
      });
      
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  return {
    capturePhoto,
    captureVideo,
    isCapturing,
    uploadError,
    clearError: () => setUploadError(null),
    isAndroidWebView: isAndroidWebView_
  };
}
