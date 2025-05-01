
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
  const { t } = useTranslation();
  
  return (
    <div className="bg-background dark:bg-background mt-2 px-4">
      <h2 className="text-lg font-medium py-3 border-b dark:border-border">{t('tasks.stepsToComplete')}</h2>
      
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {steps.map(step => {
          // First ensure the step has all necessary properties
          const titleKey = step.titleKey || '';
          const commentKey = step.commentKey || undefined;
          
          // Translate using titleKey with fallback to original title
          const translatedTitle = titleKey ? t(titleKey, { defaultValue: step.title }) : step.title;
          
          // Translate comment if it exists and has a translation key
          const translatedComment = commentKey && step.comment ? 
            t(commentKey, { defaultValue: step.comment }) : 
            step.comment;
          
          const translatedStep = {
            ...step,
            title: translatedTitle,
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
