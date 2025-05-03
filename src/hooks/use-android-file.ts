
import { useState, useEffect } from 'react';
import { getImageFromCamera, getVideoFromCamera } from '@/utils/storage';
import { useToast } from '@/hooks/use-toast';

export function useAndroidFile() {
  const { toast } = useToast();
  const [isCapturing, setIsCapturing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Is this running inside an Android WebView?
  const isAndroidWebView = /Android/.test(navigator.userAgent) && 
                          (/wv/.test(navigator.userAgent) || 
                           /Version\/[0-9.]+/.test(navigator.userAgent));

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
    
    try {
      const file = await getImageFromCamera();
      
      if (!file) {
        setUploadError('No photo was captured');
        
        // Only show toast if we actually attempted to open camera (not a cancel)
        if (isAndroidWebView) {
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
    
    try {
      const file = await getVideoFromCamera();
      
      if (!file) {
        setUploadError('No video was recorded');
        
        // Only show toast if we actually attempted to open camera (not a cancel)
        if (isAndroidWebView) {
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
    isAndroidWebView
  };
}
