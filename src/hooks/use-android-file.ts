
import { useState, useEffect } from 'react';
import { getImageFromCamera, getVideoFromCamera } from '@/utils/storage';
import { useToast } from '@/hooks/use-toast';
import { isAndroidWebView as checkIsAndroidWebView } from '@/utils/android-bridge';

export function useAndroidFile() {
  const { toast } = useToast();
  const [isCapturing, setIsCapturing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Is this running inside an Android WebView?
  const isAndroidWebView = checkIsAndroidWebView();

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

  // Function to capture photo using camera with improved error handling
  const capturePhoto = async (): Promise<File | null> => {
    setIsCapturing(true);
    setUploadError(null);
    
    try {
      const file = await getImageFromCamera();
      
      // If file is null, it could mean user cancelled or there was an error 
      // that was already handled by the getImageFromCamera function
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
      } else {
        // Success toast for better UX feedback
        toast({
          title: 'Photo Captured',
          description: 'Photo successfully captured from camera'
        });
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

  // Function to capture video using camera with improved error handling
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
      } else {
        // Success toast for better UX feedback
        toast({
          title: 'Video Recorded',
          description: 'Video successfully recorded from camera'
        });
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
