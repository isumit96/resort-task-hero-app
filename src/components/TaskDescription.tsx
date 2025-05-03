
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, Video, Loader2, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

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
  
  // Check if we're on a mobile device - this helps with specific WebView handling
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Enhanced file upload handler with WebView compatibility improvements
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video') => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log(`No ${type} file selected`);
      return;
    }
    
    setUploadError(null);
    
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
            <label className={cn(
              "cursor-pointer block",
              isUploadingPhoto && "opacity-70 pointer-events-none"
            )}>
              <div className="flex items-center gap-2 px-4 py-3 border rounded-md hover:bg-accent min-h-12 touch-manipulation">
                {isUploadingPhoto ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                <span className="text-sm">
                  {isUploadingPhoto ? "Uploading..." : isMobile ? "Take Photo" : "Add Photo"}
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                capture={isMobile ? "environment" : undefined}
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'photo')}
                disabled={isUploadingPhoto}
                // Add a key that changes when upload completes to reset the input
                key={`photo-upload-${isUploadingPhoto ? 'loading' : 'ready'}`}
              />
            </label>
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
          {uploadError && type === 'photo' && (
            <div className="mt-2 text-sm text-destructive flex items-center gap-1.5">
              <AlertTriangle size={14} />
              <span>{uploadError}</span>
            </div>
          )}
        </div>

        <div className="w-full sm:w-auto">
          <Label className="mb-1.5 block">Video</Label>
          {!videoUrl ? (
            <label className={cn(
              "cursor-pointer block",
              isUploadingVideo && "opacity-70 pointer-events-none"
            )}>
              <div className="flex items-center gap-2 px-4 py-3 border rounded-md hover:bg-accent min-h-12 touch-manipulation">
                {isUploadingVideo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Video className="h-4 w-4" />
                )}
                <span className="text-sm">
                  {isUploadingVideo ? "Uploading..." : isMobile ? "Record Video" : "Add Video"}
                </span>
              </div>
              <input
                type="file"
                accept="video/*"
                capture={isMobile ? "environment" : undefined}
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'video')}
                disabled={isUploadingVideo}
                // Add a key that changes when upload completes to reset the input
                key={`video-upload-${isUploadingVideo ? 'loading' : 'ready'}`}
              />
            </label>
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
          {uploadError && type === 'video' && (
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
