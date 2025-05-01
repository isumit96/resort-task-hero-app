
import { TaskStep as TaskStepType } from "@/types";
import TaskStep from "./TaskStep";
import { useTranslation } from "react-i18next";

interface TaskStepsListProps {
  steps: TaskStepType[];
  onComplete: (stepId: string, isCompleted: boolean) => void;
  onAddComment: (stepId: string, comment: string) => void;
  onAddPhoto: (stepId: string, photoUrl: string) => void;
}

const TaskStepsList = ({ steps, onComplete, onAddComment, onAddPhoto }: TaskStepsListProps) => {
  const { t, i18n } = useTranslation();
  
  console.log('Steps in TaskStepsList:', steps.length);
  console.log('Current language:', i18n.language);
  
  return (
    <div className="bg-background dark:bg-background mt-2 px-4">
      <h2 className="text-lg font-medium py-3 border-b dark:border-border">{t('tasks.stepsToComplete')}</h2>
      
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {steps.map(step => {
          console.log('Step ID:', step.id, 'Title key:', step.titleKey);
          
          // Always use original title as fallback
          const translatedTitle = step.titleKey ? 
            t(step.titleKey, { defaultValue: step.title }) : 
            step.title;
          
          // Always use original comment as fallback
          const translatedComment = step.commentKey && step.comment ? 
            t(step.commentKey, { defaultValue: step.comment }) : 
            step.comment;
          
          // Create a new step object with translated content
          const translatedStep = {
            ...step,
            title: translatedTitle || step.title, // Make sure title is never empty
            comment: translatedComment
          };
          
          return (
            <TaskStep 
              key={step.id} 
              step={translatedStep} 
              onComplete={onComplete}
              onAddComment={onAddComment}
              onAddPhoto={onAddPhoto}
            />
          );
        })}
      </div>
      
      {steps.length === 0 && (
        <div className="py-6 text-center text-muted-foreground">
          {t('tasks.noSteps')}
        </div>
      )}
    </div>
  );
};

export default TaskStepsList;
