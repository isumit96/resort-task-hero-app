
import { TaskStep as TaskStepType } from "@/types";
import TaskStep from "./TaskStep";
import { useTranslation } from "react-i18next";
import { dynamicTranslations } from "@/i18n/config";
import { useEffect } from "react";

interface TaskStepsListProps {
  steps: TaskStepType[];
  onComplete: (stepId: string, isCompleted: boolean) => void;
  onAddComment: (stepId: string, comment: string) => void;
  onAddPhoto: (stepId: string, photoUrl: string) => void;
}

const TaskStepsList = ({ steps, onComplete, onAddComment, onAddPhoto }: TaskStepsListProps) => {
  const { t, i18n } = useTranslation();
  
  // Register step titles for translation as soon as steps data is available
  useEffect(() => {
    // Register each step title for translation
    steps.forEach(step => {
      const stepKey = `step_${step.id}`;
      dynamicTranslations.registerContent(stepKey, step.title);
      
      // You could add translations for other languages here if available
      // Example if we had translations from backend:
      // if (step.titleHi) dynamicTranslations.registerContent(stepKey, step.titleHi, 'hi');
      // if (step.titleKn) dynamicTranslations.registerContent(stepKey, step.titleKn, 'kn');
    });
  }, [steps]);
  
  return (
    <div className="bg-background dark:bg-background mt-2 px-4">
      <h2 className="text-lg font-medium py-3 border-b dark:border-border">{t('tasks.stepsToComplete')}</h2>
      
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {steps.map(step => {
          // Create a consistent key for the step
          const stepKey = `step_${step.id}`;
          
          return (
            <TaskStep 
              key={step.id} 
              step={{
                ...step,
                // Use dynamic translation format for title
                title: t(stepKey, { format: 'dynamic' })
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
