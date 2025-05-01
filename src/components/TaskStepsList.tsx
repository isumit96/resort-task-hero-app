
import { TaskStep as TaskStepType } from "@/types";
import TaskStep from "./TaskStep";
import { useTranslation } from "react-i18next";
import { dynamicTranslations } from "@/i18n/config";

interface TaskStepsListProps {
  steps: TaskStepType[];
  onComplete: (stepId: string, isCompleted: boolean) => void;
  onAddComment: (stepId: string, comment: string) => void;
  onAddPhoto: (stepId: string, photoUrl: string) => void;
}

const TaskStepsList = ({ steps, onComplete, onAddComment, onAddPhoto }: TaskStepsListProps) => {
  const { t, i18n } = useTranslation();
  
  // Register step titles for translation
  steps.forEach(step => {
    const stepKey = `step_${step.id}`;
    dynamicTranslations.registerContent(stepKey, step.title);
  });
  
  return (
    <div className="bg-background dark:bg-background mt-2 px-4">
      <h2 className="text-lg font-medium py-3 border-b dark:border-border">{t('tasks.stepsToComplete')}</h2>
      
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {steps.map(step => (
          <TaskStep 
            key={step.id} 
            step={{
              ...step,
              // Use dynamic translation format for title
              title: t(`step_${step.id}`, { format: 'dynamic' })
            }} 
            onComplete={onComplete}
            onAddComment={onAddComment}
            onAddPhoto={onAddPhoto}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskStepsList;
