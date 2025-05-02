
import { useState, useEffect } from "react";
import { TaskStep as TaskStepType } from "@/types";
import { Camera, X, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTranslation } from "react-i18next";
import { getImageFromCamera } from "@/utils/storage";

/**
 * Renders an individual task step with support for checkbox or yes/no.
 * For yes/no steps, defaults to unselected initially and requires response.
 */
interface TaskStepProps {
  step: TaskStepType;
  onComplete: (stepId: string, isCompleted: boolean) => void;
  onAddComment?: (stepId: string, comment: string) => void;
  onAddPhoto?: (stepId: string, photoUrl: string) => void;
}

const TaskStep = ({ step, onComplete, onAddComment, onAddPhoto }: TaskStepProps) => {
  const { t } = useTranslation();
  
  // Unselected (undefined), explicitly true/false after selection
  const [yesNoValue, setYesNoValue] = useState<'yes' | 'no' | undefined>(
    step.interactionType === 'yes_no'
      ? step.isCompleted === true
        ? 'yes'
        : step.isCompleted === false
        ? 'no'
        : undefined
      : undefined
  );
  const [comment, setComment] = useState(step.comment || "");
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(step.photoUrl || undefined);
  const [isCapturing, setIsCapturing] = useState(false);

  // Update yesNoValue when step prop changes (react-query refresh etc)
  useEffect(() => {
    if (step.interactionType === 'yes_no') {
      if (step.isCompleted === true) setYesNoValue("yes");
      else if (step.isCompleted === false) setYesNoValue("no");
      else setYesNoValue(undefined);
    }
    // eslint-disable-next-line
  }, [step.isCompleted]);

  // Checkbox logic
  const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    onComplete(step.id, e.target.checked);
  };
  
  // Yes/No click handler with unselected as undefined
  const handleYesNoResponse = (value: 'yes' | 'no') => {
    setYesNoValue(value);
    onComplete(step.id, value === 'yes');
  };

  // Comment logic
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
  };
  
  const handleCommentSave = () => {
    if (onAddComment) onAddComment(step.id, comment);
    setShowCommentInput(false);
  };

  // Camera capture logic - enhanced for WebView
  const handleCapturePhoto = async () => {
    try {
      setIsCapturing(true);
      const file = await getImageFromCamera();
      
      if (file) {
        // Show preview immediately
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          setPhotoPreview(result);
        };
        reader.readAsDataURL(file);
        
        // Pass file to parent for upload
        if (onAddPhoto) onAddPhoto(step.id, URL.createObjectURL(file));
      }
    } catch (error) {
      console.error('Camera capture error:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(undefined);
    if (onAddPhoto) onAddPhoto(step.id, ""); // Remove from backend too
  };

  return (
    <div className="mb-4 rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start gap-3">
        {/* Checkbox input - made larger and easier to touch */}
        {step.interactionType === 'checkbox' && (
          <div className="mt-0.5 flex-shrink-0">
            <input
              type="checkbox"
              checked={!!step.isCompleted}
              onChange={handleCheck}
              className="h-6 w-6 rounded-md border-gray-300 text-primary focus:ring-primary touch-manipulation"
              style={{ minWidth: '24px' }}
            />
          </div>
        )}

        {/* Main content - well spaced and organized */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <label className={`text-base font-medium ${step.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {step.title}
            </label>
            {step.isOptional && (
              <span className="ml-2 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full dark:bg-muted/50">
                {t('common.optional')}
              </span>
            )}
          </div>

          {/* Yes/No buttons - larger touch targets and clear visual states */}
          {step.interactionType === 'yes_no' && (
            <div className="mt-3">
              <ToggleGroup
                type="single"
                value={yesNoValue}
                className="flex gap-3"
                onValueChange={v => {
                  if (v === 'yes' || v === 'no') handleYesNoResponse(v);
                }}
              >
                <ToggleGroupItem
                  value="yes"
                  aria-label="Yes"
                  data-state={yesNoValue === 'yes' ? "on" : "off"}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-md min-h-12 touch-manipulation ${
                    yesNoValue === "yes"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                      : "bg-muted text-muted-foreground dark:bg-muted/50"
                  }`}
                >
                  <CheckCircle size={18} />
                  <span>{t('templates.yes')}</span>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="no"
                  aria-label="No"
                  data-state={yesNoValue === 'no' ? "on" : "off"}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-md min-h-12 touch-manipulation ${
                    yesNoValue === "no"
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                      : "bg-muted text-muted-foreground dark:bg-muted/50"
                  }`}
                >
                  <XCircle size={18} />
                  <span>{t('templates.no')}</span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          )}

          {/* Photo section - improved for WebView with direct camera access */}
          {step.requiresPhoto && (
            <div className="mt-4">
              {!photoPreview ? (
                <button
                  onClick={handleCapturePhoto}
                  disabled={isCapturing}
                  className="flex items-center gap-2 py-3 px-3 w-full rounded-md bg-muted text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors text-sm dark:bg-muted/50 dark:hover:bg-muted/30 min-h-12 justify-center touch-manipulation border border-dashed border-border"
                  type="button"
                >
                  <Camera size={20} />
                  {isCapturing ? 
                    <span>{t('templates.opening')}</span> : 
                    <span>{t('templates.takePhoto')}</span>
                  }
                </button>
              ) : (
                <div className="relative mt-2">
                  <img 
                    src={photoPreview}
                    alt="Step verification" 
                    className="h-40 w-full object-cover rounded-lg border border-border"
                    loading="lazy"
                  />
                  <button 
                    onClick={handleRemovePhoto}
                    type="button"
                    className="absolute top-2 right-2 bg-black bg-opacity-50 dark:bg-white dark:bg-opacity-20 text-white p-2 rounded-full touch-manipulation"
                    aria-label="Remove photo"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Comment section - cleaner UI with better spacing */}
          {showCommentInput ? (
            <div className="mt-4 bg-card rounded-md p-0.5">
              <Textarea
                className="w-full border border-input bg-background rounded-md p-3 text-base min-h-[80px]"
                placeholder={t('templates.addComment')}
                rows={2}
                value={comment}
                onChange={handleCommentChange}
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button 
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setShowCommentInput(false)}
                  className="py-2 px-4 min-h-10 touch-manipulation"
                >
                  {t('common.cancel')}
                </Button>
                <Button 
                  variant="default"
                  size="sm"
                  type="button"
                  onClick={handleCommentSave}
                  className="py-2 px-4 min-h-10 touch-manipulation"
                >
                  {t('common.save')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-2">
              {step.comment && (
                <p className="text-muted-foreground text-sm mt-1 bg-muted/50 p-3 rounded-md italic">"{step.comment}"</p>
              )}
              {!showCommentInput && (
                <button 
                  className="text-sm text-primary mt-2 py-1 px-0 touch-manipulation flex items-center"
                  type="button"
                  onClick={() => setShowCommentInput(true)}
                >
                  {step.comment ? t('templates.editComment') : t('templates.addComment')}
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
