
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, Video, Loader2, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAndroidFile } from "@/hooks/use-android-file";
import { isAndroidWebView } from "@/utils/android-bridge";

interface TaskDescriptionProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  onPhotoUpload: (file: File) => void;
  onVideoUpload: (file: File) => void;
  photoUrl?: string;
  videoUrl?: string;
  className?: string;
}

const TaskDescription = ({
  description,
  onDescriptionChange,
  onPhotoUpload,
  onVideoUpload,
  photoUrl,
  videoUrl,
  className
}: TaskDescriptionProps) => {
  const { toast } = useToast();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadErrorType, setUploadErrorType] = useState<'photo' | 'video' | null>(null);
  const { capturePhoto, captureVideo, isCapturing, isAndroidWebView: isInAndroidView } = useAndroidFile();
  
  // Refs for file inputs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  // Check if we're on a mobile device - this helps with specific WebView handling
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isAndroidDevice = /Android/.test(navigator.userAgent);
  const runningInWebView = isInAndroidView || isAndroidWebView();
  
  console.log('TaskDescription mount:', { 
    isMobile, 
    isAndroidDevice, 
    runningInWebView,
    isCapturing,
    userAgent: navigator.userAgent
  });
  
  // Enhanced photo capture with Android WebView support
  const handlePhotoCapture = async () => {
    setUploadError(null);
    setUploadErrorType(null);
    setIsUploadingPhoto(true);
    
    console.log('Starting photo capture process');
    
    try {
      // Use the enhanced capturePhoto function that handles Android WebView
      const file = await capturePhoto();
      
      if (file) {
        console.log(`Processing uploaded photo: ${file.name} (${Math.round(file.size/1024)}KB)`);
        await onPhotoUpload(file);
        
        toast({
          title: "Photo uploaded",
          description: "Your photo has been uploaded successfully"
        });
      } else {
        console.log('No photo file returned from capturePhoto');
        // User may have canceled or there was an error that was already handled
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      
      setUploadError(`Failed to upload photo. Please try again.`);
      setUploadErrorType('photo');
      
      toast({
        title: `Photo upload failed`,
        description: `Unable to upload your photo. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };
  
  // Enhanced video capture with Android WebView support
  const handleVideoCapture = async () => {
    setUploadError(null);
    setUploadErrorType(null);
    setIsUploadingVideo(true);
    
    console.log('Starting video capture process');
    
    try {
      // Use the enhanced captureVideo function that handles Android WebView
      const file = await captureVideo();
      
      if (file) {
        console.log(`Processing uploaded video: ${file.name} (${Math.round(file.size/1024)}KB)`);
        await onVideoUpload(file);
        
        toast({
          title: "Video uploaded",
          description: "Your video has been uploaded successfully"
        });
      } else {
        console.log('No video file returned from captureVideo');
        // User may have canceled or there was an error that was already handled
      }
    } catch (error) {
      console.error('Error capturing video:', error);
      
      setUploadError(`Failed to upload video. Please try again.`);
      setUploadErrorType('video');
      
      toast({
        title: `Video upload failed`,
        description: `Unable to upload your video. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsUploadingVideo(false);
    }
  };

  // Legacy file upload handler for non-Android or fallback
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video') => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log(`No ${type} file selected`);
      return;
    }
    
    setUploadError(null);
    setUploadErrorType(null);
    
    // Check file size - limit to 10MB to prevent issues on mobile
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      const errorMsg = `File is too large (${Math.round(file.size/1024/1024)}MB). Please select a file under 10MB.`;
      setUploadError(errorMsg);
      setUploadErrorType(type);
      
      toast({
        title: "File too large",
        description: errorMsg,
        variant: "destructive"
      });
      return;
    }
    
    try {
      console.log(`Processing ${type} upload: ${file.name} (${Math.round(file.size/1024)}KB)`);
      
      if (type === 'photo') {
        setIsUploadingPhoto(true);
        await onPhotoUpload(file);
        
        toast({
          title: "Photo uploaded",
          description: "Your photo has been uploaded successfully"
        });
      } else {
        setIsUploadingVideo(true);
        await onVideoUpload(file);
        
        toast({
          title: "Video uploaded",
          description: "Your video has been uploaded successfully"
        });
      }
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      
      setUploadError(`Failed to upload ${type}. Please try again.`);
      setUploadErrorType(type);
      
      toast({
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} upload failed`,
        description: `Unable to upload your ${type}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      if (type === 'photo') {
        setIsUploadingPhoto(false);
      } else {
        setIsUploadingVideo(false);
      }
    }
  };

  const handleRemoveMedia = (type: 'photo' | 'video') => {
    if (type === 'photo') {
      onPhotoUpload(new File([], "removed"));
    } else {
      onVideoUpload(new File([], "removed"));
    }
    
    toast({
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} removed`,
      description: `Your ${type} has been removed`
    });
  };

  // Handle file input reset when user clicks "Cancel" in the camera UI
  useEffect(() => {
    // Clear any file inputs when component unmounts
    return () => {
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach(input => {
        const htmlInput = input as HTMLInputElement;
        htmlInput.value = '';
      });
    };
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description || ""} // Ensure value is never undefined
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Add task description..."
          className="mt-1.5"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="w-full sm:w-auto">
          <Label className="mb-1.5 block">Photo</Label>
          {!photoUrl ? (
            <div className="relative">
              <button 
                type="button"
                onClick={handlePhotoCapture}
                disabled={isUploadingPhoto || isCapturing}
                className={cn(
                  "w-full flex items-center gap-2 px-4 py-3 border rounded-md hover:bg-accent min-h-12 touch-manipulation",
                  (isUploadingPhoto || isCapturing) && "opacity-70 pointer-events-none"
                )}
              >
                {isUploadingPhoto || isCapturing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                <span className="text-sm">
                  {isUploadingPhoto || isCapturing ? "Processing..." : isMobile ? "Take Photo" : "Add Photo"}
                </span>
              </button>
              
              {/* Hidden file input as fallback, but accessible when needed */}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture={isAndroidDevice ? "environment" : undefined}
                className="opacity-0 absolute inset-0 cursor-pointer"
                onChange={(e) => handleFileUpload(e, 'photo')}
                disabled={isUploadingPhoto || isCapturing}
                // Add a key that changes when upload completes to reset the input
                key={`photo-upload-${isUploadingPhoto || isCapturing ? 'loading' : 'ready'}-${Date.now()}`}
                aria-hidden="true"
              />
            </div>
          ) : (
            <div className="relative mt-2 group">
              <img 
                src={photoUrl} 
                alt="Task photo" 
                className="rounded-md w-full max-w-[280px] h-40 object-cover border border-border"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-md">
                <button 
                  type="button"
                  onClick={() => handleRemoveMedia('photo')}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
          {uploadError && uploadErrorType === 'photo' && (
            <div className="mt-2 text-sm text-destructive flex items-center gap-1.5">
              <AlertTriangle size={14} />
              <span>{uploadError}</span>
            </div>
          )}
        </div>

        <div className="w-full sm:w-auto">
          <Label className="mb-1.5 block">Video</Label>
          {!videoUrl ? (
            <div className="relative">
              <button 
                type="button"
                onClick={handleVideoCapture}
                disabled={isUploadingVideo || isCapturing}
                className={cn(
                  "w-full flex items-center gap-2 px-4 py-3 border rounded-md hover:bg-accent min-h-12 touch-manipulation",
                  (isUploadingVideo || isCapturing) && "opacity-70 pointer-events-none"
                )}
              >
                {isUploadingVideo || isCapturing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Video className="h-4 w-4" />
                )}
                <span className="text-sm">
                  {isUploadingVideo || isCapturing ? "Processing..." : isMobile ? "Record Video" : "Add Video"}
                </span>
              </button>
              
              {/* Hidden file input as fallback, but accessible when needed */}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                capture={isAndroidDevice ? "environment" : undefined}
                className="opacity-0 absolute inset-0 cursor-pointer"
                onChange={(e) => handleFileUpload(e, 'video')}
                disabled={isUploadingVideo || isCapturing}
                // Add a key that changes when upload completes to reset the input
                key={`video-upload-${isUploadingVideo || isCapturing ? 'loading' : 'ready'}-${Date.now()}`}
                aria-hidden="true"
              />
            </div>
          ) : (
            <div className="relative mt-2 group">
              <video 
                src={videoUrl} 
                controls 
                className="rounded-md w-full max-w-[280px] border border-border"
                preload="metadata"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-md">
                <button 
                  type="button"
                  onClick={() => handleRemoveMedia('video')}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
          {uploadError && uploadErrorType === 'video' && (
            <div className="mt-2 text-sm text-destructive flex items-center gap-1.5">
              <AlertTriangle size={14} />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDescription;
