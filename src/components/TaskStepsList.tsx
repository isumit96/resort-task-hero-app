
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
  
  // Get the localized title based on current language
  const getLocalizedTitle = (step: TaskStepType) => {
    if (i18n.language === 'hi' && step.title_hi) {
      return step.title_hi;
    }
    if (i18n.language === 'kn' && step.title_kn) {
      return step.title_kn;
    }
    return step.title;
  };
  
  return (
    <div className="bg-background dark:bg-background mt-2 px-4">
      <h2 className="text-lg font-medium py-3 border-b dark:border-border">{t('tasks.stepsToComplete')}</h2>
      
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {steps.map(step => {          
          return (
            <TaskStep 
              key={step.id} 
              step={{
                ...step,
                title: getLocalizedTitle(step)
              }} 
              onComplete={onComplete}
              onAddComment={onAddComment}
              onAddPhoto={onAddPhoto}
            />
          );
        })}
      </div>
    </div>
  );
};

export default TaskStepsList;
