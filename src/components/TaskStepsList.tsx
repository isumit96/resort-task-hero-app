
import { TaskStep as TaskStepType } from "@/types";
import TaskStep from "./TaskStep";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";

interface TaskStepsListProps {
  steps: TaskStepType[];
  onComplete: (stepId: string, isCompleted: boolean) => void;
  onAddComment: (stepId: string, comment: string) => void;
  onAddPhoto: (stepId: string, photoUrl: string) => void;
  onInteraction?: (isInteracting: boolean) => void;
  isTaskCompleted?: boolean;
}

const TaskStepsList = ({ steps, onComplete, onAddComment, onAddPhoto, onInteraction, isTaskCompleted = false }: TaskStepsListProps) => {
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
    <Card className="bg-background dark:bg-background mt-4 mx-4 border rounded-lg overflow-hidden shadow-sm">
      <h2 className="text-lg font-medium py-4 px-5 border-b dark:border-border flex items-center">
        {t('tasks.stepsToComplete')}
        <span className="ml-2 text-sm text-muted-foreground">
          ({steps.length})
        </span>
      </h2>
      
      <div className="p-4 space-y-2">
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
              onInteraction={onInteraction}
              isTaskCompleted={isTaskCompleted}
            />
          );
        })}
      </div>
    </Card>
  );
};

export default TaskStepsList;
