
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, Video, Loader2, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
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
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video') => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
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
              <div className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-accent min-h-10 touch-manipulation">
                {isUploadingPhoto ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                <span className="text-sm">
                  {isUploadingPhoto ? "Uploading..." : "Take Photo"}
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'photo')}
                disabled={isUploadingPhoto}
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
        </div>

        <div className="w-full sm:w-auto">
          <Label className="mb-1.5 block">Video</Label>
          {!videoUrl ? (
            <label className={cn(
              "cursor-pointer block",
              isUploadingVideo && "opacity-70 pointer-events-none"
            )}>
              <div className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-accent min-h-10 touch-manipulation">
                {isUploadingVideo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Video className="h-4 w-4" />
                )}
                <span className="text-sm">
                  {isUploadingVideo ? "Uploading..." : "Record Video"}
                </span>
              </div>
              <input
                type="file"
                accept="video/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'video')}
                disabled={isUploadingVideo}
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
        </div>
      </div>
    </div>
  );
};

export default TaskDescription;
