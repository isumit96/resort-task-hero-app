
import { useState, useEffect } from "react";
import { TaskStep as TaskStepType } from "@/types";
import { Camera, X, CheckCircle, XCircle, Lock, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTranslation } from "react-i18next";
import { getImageFromCamera } from "@/utils/storage";
import { useToast } from "@/hooks/use-toast";
import { useAndroidCamera } from "@/hooks/useAndroidCamera";
import { isAndroidWebView, isNativeCameraAvailable, sendDebugLog } from "@/utils/android-bridge";

/**
 * Renders an individual task step with support for checkbox or yes/no.
 * For yes/no steps, defaults to unselected initially and requires response.
 */
interface TaskStepProps {
  step: TaskStepType;
  onComplete: (stepId: string, isCompleted: boolean) => void;
  onAddComment?: (stepId: string, comment: string) => void;
  onAddPhoto?: (stepId: string, photoUrl: string) => void;
  isTaskCompleted?: boolean;
}

const TaskStep = ({ step, onComplete, onAddComment, onAddPhoto, isTaskCompleted = false }: TaskStepProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { capturePhotoWithAndroid, isCapturing: isNativeCapturing, isAndroidWebView: isInAndroidWebView, hasNativeCamera } = useAndroidCamera();
  
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
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Check if running in WebView for better detection
  const runningInWebView = isInAndroidWebView || isAndroidWebView();
  const nativeCameraAvailable = hasNativeCamera || isNativeCameraAvailable();

  // Update yesNoValue when step prop changes (react-query refresh etc)
  useEffect(() => {
    if (step.interactionType === 'yes_no') {
      if (step.isCompleted === true) setYesNoValue("yes");
      else if (step.isCompleted === false) setYesNoValue("no");
      else setYesNoValue(undefined);
    }
    // eslint-disable-next-line
  }, [step.isCompleted]);

  // Update photo preview when step prop changes
  useEffect(() => {
    setPhotoPreview(step.photoUrl);
  }, [step.photoUrl]);

  // Log detection status on component mount
  useEffect(() => {
    console.log('TaskStep component environment:', {
      runningInWebView,
      nativeCameraAvailable,
      stepId: step.id
    });
    
    sendDebugLog('TaskStep', `Step ${step.id} environment: WebView=${runningInWebView}, NativeCamera=${nativeCameraAvailable}`);
  }, [runningInWebView, nativeCameraAvailable, step.id]);

  // Checkbox logic
  const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isTaskCompleted) return;
    onComplete(step.id, e.target.checked);
  };
  
  // Yes/No click handler with unselected as undefined
  const handleYesNoResponse = (value: 'yes' | 'no') => {
    if (isTaskCompleted) return;
    setYesNoValue(value);
    onComplete(step.id, value === 'yes');
  };

  // Comment logic
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isTaskCompleted) return;
    setComment(e.target.value);
  };
  
  const handleCommentSave = () => {
    if (isTaskCompleted) return;
    if (onAddComment) onAddComment(step.id, comment);
    setShowCommentInput(false);
    
    toast({
      title: "Comment saved",
      description: "Your comment has been saved successfully"
    });
  };

  // Enhanced camera capture logic with Android native bridge support
  const handleCapturePhoto = async () => {
    if (isTaskCompleted) return;
    setUploadError(null);
    setIsCapturing(true);
    
    console.log(`Starting photo capture for step ${step.id}`);
    sendDebugLog('TaskStep', `Starting photo capture for step ${step.id}`);
    
    // Log whether we're using AndroidCamera or file input
    if (runningInWebView && nativeCameraAvailable) {
      console.log('Will use Android native camera bridge');
      sendDebugLog('Camera', 'Using native Android camera bridge');
    } else {
      console.log('Will use file input for camera capture');
      sendDebugLog('Camera', 'Using file input for camera capture');
    }
    
    try {
      // Try using Android native camera first if available
      let file = null;
      
      // First try native camera if available
      if (runningInWebView && nativeCameraAvailable) {
        console.log('Using Android native camera bridge');
        sendDebugLog('Camera', 'Using Android native camera bridge for step photo');
        file = await capturePhotoWithAndroid();
      }
      
      // If native camera didn't work or isn't available, fall back to standard approach
      if (!file) {
        console.log('Native camera unavailable or failed, using standard camera capture');
        sendDebugLog('Camera', 'Using standard file input for step photo');
        file = await getImageFromCamera();
      }
      
      console.log(`Camera capture result:`, file ? `File received (${file.size} bytes)` : 'No file received');
      
      // If we got a file back from the camera
      if (file && file.size > 0) {
        try {
          // Create an immediate preview from the file - only for local UI rendering
          const localPreviewUrl = URL.createObjectURL(file);
          console.log(`Local preview URL created: ${localPreviewUrl}`);
          setPhotoPreview(localPreviewUrl);
          
          // IMPORTANT: Pass the actual file instead of the blob URL to ensure proper upload
          if (onAddPhoto) {
            console.log(`Calling onAddPhoto for step ${step.id} with file object`);
            
            // Pass the actual File object to ensure it gets properly uploaded
            await onAddPhoto(step.id, file);
            
            toast({
              title: "Photo attached",
              description: "Your photo has been successfully attached to this step"
            });
          }
        } catch (error) {
          console.error('Preview/upload error:', error);
          setUploadError("Failed to process photo. Please try again.");
          
          toast({
            title: "Upload failed",
            description: "Failed to process photo. Please try again.",
            variant: "destructive"
          });
        }
      } else if (file && file.size === 0) {
        // Empty file - likely a WebView issue
        console.error('Camera returned empty file');
        setUploadError("Camera returned an empty image. Please try again.");
        
        toast({
          title: "Camera error",
          description: "Camera returned an empty image. Please try again.",
          variant: "destructive"
        });
      } else {
        // No file received - user cancelled or WebView issue
        console.log('No file received from camera');
        setUploadError("No photo was captured. Please try again.");
        
        toast({
          title: "No photo",
          description: "No photo was captured. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      setUploadError("Failed to access camera. Please check permissions.");
      
      toast({
        title: "Camera error",
        description: "Failed to access camera. Please check permissions.",
        variant: "destructive"
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRemovePhoto = () => {
    if (isTaskCompleted) return;
    
    // If there was a local preview URL, revoke it to prevent memory leaks
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
    
    setPhotoPreview(undefined);
    setUploadError(null);
    
    if (onAddPhoto) {
      onAddPhoto(step.id, ""); // Remove from backend too
      toast({
        title: "Photo removed",
        description: "The photo has been removed from this step"
      });
    }
  };

  // Show locked status indicator for completed tasks
  const renderLockedIndicator = () => {
    if (!isTaskCompleted) return null;
    
    return (
      <div className="absolute top-2 right-2 text-muted-foreground flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-full text-xs">
        <Lock size={12} />
        <span>Locked</span>
      </div>
    );
  };

  // Check if we're on a mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  return (
    <div className="mb-4 rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md relative">
      {renderLockedIndicator()}
      
      <div className="flex items-start gap-3">
        {/* Checkbox input - made larger and easier to touch */}
        {step.interactionType === 'checkbox' && (
          <div className="mt-0.5 flex-shrink-0">
            <input
              type="checkbox"
              checked={!!step.isCompleted}
              onChange={handleCheck}
              disabled={isTaskCompleted}
              className={`h-6 w-6 rounded-md border-gray-300 text-primary focus:ring-primary touch-manipulation ${
                isTaskCompleted ? "opacity-60 cursor-not-allowed" : ""
              }`}
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
                className={`flex gap-3 ${isTaskCompleted ? "opacity-60" : ""}`}
                onValueChange={v => {
                  if (isTaskCompleted) return;
                  if (v === 'yes' || v === 'no') handleYesNoResponse(v);
                }}
                disabled={isTaskCompleted}
              >
                <ToggleGroupItem
                  value="yes"
                  aria-label="Yes"
                  data-state={yesNoValue === 'yes' ? "on" : "off"}
                  disabled={isTaskCompleted}
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
                  disabled={isTaskCompleted}
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

          {/* Photo section - improved for WebView with better handling */}
          {step.requiresPhoto && (
            <div className="mt-4">
              {!photoPreview ? (
                <>
                  <button
                    onClick={handleCapturePhoto}
                    disabled={isCapturing || isNativeCapturing || isTaskCompleted}
                    className={`flex items-center gap-2 py-3 px-4 w-full rounded-md bg-muted text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors text-sm dark:bg-muted/50 dark:hover:bg-muted/30 min-h-12 justify-center touch-manipulation border border-dashed border-border ${
                      isTaskCompleted ? "opacity-60 cursor-not-allowed" : ""
                    } ${(isCapturing || isNativeCapturing) ? "animate-pulse" : ""}`}
                    type="button"
                  >
                    {(isCapturing || isNativeCapturing) ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Camera size={20} />
                    )}
                    {(isCapturing || isNativeCapturing) ? 
                      <span>{isMobile ? t('templates.takingPhoto') : t('templates.opening')}</span> : 
                      <span>{t('templates.takePhoto')}</span>
                    }
                  </button>
                  
                  {uploadError && (
                    <div className="mt-2 text-sm text-destructive flex items-center gap-1.5 bg-destructive/10 p-2 rounded">
                      <AlertTriangle size={14} />
                      <span>{uploadError}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="relative mt-2 group">
                  <img 
                    src={photoPreview}
                    alt="Step verification" 
                    className="h-48 w-full object-cover rounded-lg border border-border"
                    loading="lazy"
                  />
                  {!isTaskCompleted && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg">
                      <button 
                        onClick={handleRemovePhoto}
                        type="button"
                        className="absolute top-2 right-2 bg-black/50 group-hover:bg-black/70 text-white p-2 rounded-full touch-manipulation transition-colors"
                        aria-label="Remove photo"
                        disabled={isTaskCompleted}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Comment section */}
          {showCommentInput && !isTaskCompleted ? (
            <div className="mt-4 bg-card rounded-md p-0.5">
              <Textarea
                className="w-full border border-input bg-background rounded-md p-3 text-base min-h-[80px]"
                placeholder={t('templates.addComment')}
                rows={2}
                value={comment}
                onChange={handleCommentChange}
                disabled={isTaskCompleted}
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button 
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setShowCommentInput(false)}
                  className="py-2 px-4 min-h-10 touch-manipulation"
                  disabled={isTaskCompleted}
                >
                  {t('common.cancel')}
                </Button>
                <Button 
                  variant="default"
                  size="sm"
                  type="button"
                  onClick={handleCommentSave}
                  className="py-2 px-4 min-h-10 touch-manipulation"
                  disabled={isTaskCompleted}
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
              {!showCommentInput && !isTaskCompleted && (
                <button 
                  className="text-sm text-primary mt-2 py-1 px-0 touch-manipulation flex items-center"
                  type="button"
                  onClick={() => setShowCommentInput(true)}
                  disabled={isTaskCompleted}
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
