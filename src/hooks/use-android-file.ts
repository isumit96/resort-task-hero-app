
import { useState, useEffect } from 'react';
import { getImageFromCamera, getVideoFromCamera } from '@/utils/storage';
import { useToast } from '@/hooks/use-toast';
import { isAndroidWebView, sendDebugLog, checkConnectivity } from '@/utils/android-bridge';

export function useAndroidFile() {
  const { toast } = useToast();
  const [isCapturing, setIsCapturing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Is this running inside an Android WebView?
  const isInAndroidWebView = isAndroidWebView();

  // Set up listener for Android file errors
  useEffect(() => {
    const handleAndroidError = (e: CustomEvent) => {
      const { errorType, message } = e.detail;
      
      setUploadError(message || 'File upload failed');
      setIsCapturing(false);
      
      sendDebugLog('FileError', `Android error received: ${errorType} - ${message}`);
      
      toast({
        title: errorType === 'CAMERA_UNAVAILABLE' ? 'Camera Error' : 'Upload Error',
        description: message,
        variant: "destructive"
      });
    };
    
    document.addEventListener('android-file-error', handleAndroidError as EventListener);
    
    return () => {
      document.removeEventListener('android-file-error', handleAndroidError as EventListener);
    };
  }, [toast]);

  // Function to capture photo using camera
  const capturePhoto = async (): Promise<File | null> => {
    setIsCapturing(true);
    setUploadError(null);
    
    // Check connectivity first
    if (!checkConnectivity()) {
      const errorMsg = 'No internet connection. Please check your connectivity and try again.';
      setUploadError(errorMsg);
      setIsCapturing(false);
      
      toast({
        title: 'Connectivity Error',
        description: errorMsg,
        variant: 'destructive'
      });
      
      return null;
    }
    
    try {
      sendDebugLog('File', 'Starting photo capture');
      const file = await getImageFromCamera();
      
      if (file) {
        sendDebugLog('File', `Photo captured: ${file.name} (${Math.round(file.size/1024)}KB)`);
        
        // Check for empty files
        if (!file.size || file.size === 0) {
          const errorMsg = "Camera returned an empty image. Please try again.";
          setUploadError(errorMsg);
          
          toast({
            title: "Camera error",
            description: errorMsg,
            variant: "destructive"
          });
          
          return null;
        }
        
        // File captured successfully
        toast({
          title: 'Photo Captured',
          description: 'Photo was captured successfully'
        });
      } else {
        setUploadError('No photo was captured');
        
        // Only show toast if we actually attempted to open camera (not a cancel)
        if (isInAndroidWebView) {
          toast({
            title: 'No Photo',
            description: 'No photo was captured or the camera was canceled',
            variant: "destructive"
          });
        }
      }
      
      return file;
    } catch (error) {
      console.error('Photo capture error:', error);
      sendDebugLog('FileError', `Photo capture error: ${error}`);
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

  // Function to capture video using camera
  const captureVideo = async (): Promise<File | null> => {
    setIsCapturing(true);
    setUploadError(null);
    
    // Check connectivity first
    if (!checkConnectivity()) {
      const errorMsg = 'No internet connection. Please check your connectivity and try again.';
      setUploadError(errorMsg);
      setIsCapturing(false);
      
      toast({
        title: 'Connectivity Error',
        description: errorMsg,
        variant: 'destructive'
      });
      
      return null;
    }
    
    try {
      sendDebugLog('File', 'Starting video capture');
      const file = await getVideoFromCamera();
      
      if (file) {
        sendDebugLog('File', `Video captured: ${file.name} (${Math.round(file.size/1024)}KB)`);
        
        // Check for empty files
        if (!file.size || file.size === 0) {
          const errorMsg = "Camera returned an empty video. Please try again.";
          setUploadError(errorMsg);
          
          toast({
            title: "Camera error",
            description: errorMsg,
            variant: "destructive"
          });
          
          return null;
        }
        
        // File captured successfully
        toast({
          title: 'Video Recorded',
          description: 'Video was recorded successfully'
        });
      } else {
        setUploadError('No video was recorded');
        
        // Only show toast if we actually attempted to open camera (not a cancel)
        if (isInAndroidWebView) {
          toast({
            title: 'No Video',
            description: 'No video was recorded or the camera was canceled',
            variant: "destructive"
          });
        }
      }
      
      return file;
    } catch (error) {
      console.error('Video capture error:', error);
      sendDebugLog('FileError', `Video capture error: ${error}`);
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
    isAndroidWebView: isInAndroidWebView
  };
}
