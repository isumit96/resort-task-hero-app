
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface TaskDescriptionProps {
  description: string;
  descriptionKey?: string;
  onDescriptionChange: (value: string) => void;
  onPhotoUpload: (file: File) => void;
  onVideoUpload: (file: File) => void;
  photoUrl?: string;
  videoUrl?: string;
  className?: string;
}

const TaskDescription = ({
  description,
  descriptionKey,
  onDescriptionChange,
  onPhotoUpload,
  onVideoUpload,
  photoUrl,
  videoUrl,
  className
}: TaskDescriptionProps) => {
  const { t } = useTranslation();
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video') => {
    const file = event.target.files?.[0];
    if (file) {
      if (type === 'photo') {
        onPhotoUpload(file);
      } else {
        onVideoUpload(file);
      }
    }
  };

  // Use translation if available, otherwise use the original description
  const translatedDescription = descriptionKey ? t(descriptionKey, { defaultValue: description }) : description;

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <Label htmlFor="description">{t('tasks.description', 'Description')}</Label>
        <Textarea
          id="description"
          value={translatedDescription || ""} // Ensure value is never undefined
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={t('tasks.addTaskDescription', 'Add task description...')}
          className="mt-1.5"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <div>
          <Label className="mb-1.5 block">{t('common.photo', 'Photo')}</Label>
          <label className="cursor-pointer">
            <div className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-accent">
              <Camera className="h-4 w-4" />
              <span className="text-sm">{t('tasks.uploadPhoto', 'Upload Photo')}</span>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, 'photo')}
            />
          </label>
          {photoUrl && (
            <img 
              src={photoUrl} 
              alt={t('tasks.taskPhoto', 'Task photo')}
              className="mt-2 rounded-md w-full max-w-[200px] h-32 object-cover"
            />
          )}
        </div>

        <div>
          <Label className="mb-1.5 block">{t('common.video', 'Video')}</Label>
          <label className="cursor-pointer">
            <div className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-accent">
              <Video className="h-4 w-4" />
              <span className="text-sm">{t('tasks.uploadVideo', 'Upload Video')}</span>
            </div>
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, 'video')}
            />
          </label>
          {videoUrl && (
            <video 
              src={videoUrl} 
              controls 
              className="mt-2 rounded-md w-full max-w-[200px]"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDescription;
