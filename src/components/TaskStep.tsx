
import { useState } from "react";
import { TaskStep as TaskStepType } from "@/types";
import { Camera, X, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface TaskStepProps {
  step: TaskStepType;
  onComplete: (stepId: string, isCompleted: boolean) => void;
  onAddComment?: (stepId: string, comment: string) => void;
  onAddPhoto?: (stepId: string, photoUrl: string) => void;
}

const TaskStep = ({ step, onComplete, onAddComment, onAddPhoto }: TaskStepProps) => {
  const [comment, setComment] = useState(step.comment || "");
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(step.photoUrl);

  const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    onComplete(step.id, e.target.checked);
  };
  
  const handleYesNoResponse = (isYes: boolean) => {
    onComplete(step.id, isYes);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
  };

  const handleCommentSave = () => {
    if (onAddComment) {
      onAddComment(step.id, comment);
    }
    setShowCommentInput(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, we'd upload to a server
      // For demo purposes, we'll use a local URL
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
        if (onAddPhoto) {
          onAddPhoto(step.id, result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(undefined);
  };

  return (
    <div className="py-3 border-b border-border last:border-b-0 dark:border-border">
      <div className="flex items-start">
        {step.interactionType === 'yes_no' ? (
          <div className="flex flex-col gap-2">
            <ToggleGroup type="single" value={step.isCompleted === true ? "yes" : step.isCompleted === false ? "no" : undefined}>
              <ToggleGroupItem 
                value="yes"
                aria-label="Yes"
                onClick={() => handleYesNoResponse(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md ${step.isCompleted === true ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : ''}`}
              >
                <CheckCircle size={16} />
                <span>Yes</span>
              </ToggleGroupItem>
              
              <ToggleGroupItem 
                value="no"
                aria-label="No"
                onClick={() => handleYesNoResponse(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md ${step.isCompleted === false ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' : ''}`}
              >
                <XCircle size={16} />
                <span>No</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        ) : (
          <input
            type="checkbox"
            checked={!!step.isCompleted}
            onChange={handleCheck}
            className="mt-1 h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
          />
        )}
        
        <div className="ml-3 w-full">
          <div className="flex justify-between items-start">
            <label className={`text-base ${step.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
              {step.title}
            </label>
            {step.isOptional && (
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full dark:bg-muted/50">
                Optional
              </span>
            )}
          </div>

          {/* Photo upload option */}
          {step.requiresPhoto && (
            <div className="mt-3">
              {!photoPreview ? (
                <label className="flex items-center gap-2 py-2 px-3 rounded-md bg-muted text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors text-sm dark:bg-muted/50 dark:hover:bg-muted/30">
                  <Camera size={18} />
                  <span>Add Photo</span>
                  <input 
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <div className="relative mt-2">
                  <img 
                    src={photoPreview}
                    alt="Step verification" 
                    className="h-32 w-full object-cover rounded-lg"
                  />
                  <button 
                    onClick={handleRemovePhoto}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 dark:bg-white dark:bg-opacity-20 text-white p-1 rounded-full"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Comment section */}
          {showCommentInput ? (
            <div className="mt-3">
              <Textarea
                className="w-full border border-input bg-background rounded-md p-2 text-sm"
                placeholder="Add a comment..."
                rows={2}
                value={comment}
                onChange={handleCommentChange}
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCommentInput(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="default"
                  size="sm"
                  onClick={handleCommentSave}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {step.comment && (
                <p className="text-muted-foreground text-sm mt-1 italic">"{step.comment}"</p>
              )}
              {!showCommentInput && (
                <button 
                  className="text-sm text-primary mt-2"
                  onClick={() => setShowCommentInput(true)}
                >
                  {step.comment ? 'Edit comment' : 'Add comment'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskStep;
