
import { useState } from "react";
import { TaskStep as TaskStepType } from "@/types";
import { Camera, X } from "lucide-react";

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
    <div className="py-3 border-b border-gray-200 last:border-b-0">
      <div className="flex items-start">
        <input
          type="checkbox"
          checked={step.isCompleted}
          onChange={handleCheck}
          className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
        />
        <div className="ml-3 w-full">
          <div className="flex justify-between items-start">
            <label className={`text-base ${step.isCompleted ? 'line-through text-gray-500' : ''}`}>
              {step.title}
            </label>
          </div>

          {/* Photo upload option */}
          {step.requiresPhoto && (
            <div className="mt-3">
              {!photoPreview ? (
                <label className="flex items-center gap-2 py-2 px-3 rounded-md bg-gray-100 text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors text-sm">
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
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded-full"
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
              <textarea
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
                placeholder="Add a comment..."
                rows={2}
                value={comment}
                onChange={handleCommentChange}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button 
                  className="text-sm py-1 px-3 bg-gray-200 text-gray-700 rounded-md"
                  onClick={() => setShowCommentInput(false)}
                >
                  Cancel
                </button>
                <button 
                  className="text-sm py-1 px-3 bg-blue-600 text-white rounded-md"
                  onClick={handleCommentSave}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div>
              {step.comment && (
                <p className="text-gray-600 text-sm mt-1 italic">"{step.comment}"</p>
              )}
              {!showCommentInput && (
                <button 
                  className="text-sm text-blue-600 mt-2"
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
