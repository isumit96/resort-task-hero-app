
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
          console.log('Step:', step.id, 'Title:', step.title, 'TitleKey:', step.titleKey);
          
          // First try to use the translation key, if it exists
          let displayTitle = step.title || '';
          if (step.titleKey) {
            displayTitle = t(step.titleKey, { defaultValue: step.title || '' });
          }
          
          // For comments, try the translation key first, then fall back to the raw comment
          let displayComment = step.comment || '';
          if (step.commentKey) {
            displayComment = t(step.commentKey, { defaultValue: step.comment || '' });
          }
          
          const translatedStep = {
            ...step,
            title: displayTitle,
            comment: displayComment
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
