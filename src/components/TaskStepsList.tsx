
import { TaskStep as TaskStepType } from "@/types";
import TaskStep from "./TaskStep";

interface TaskStepsListProps {
  steps: TaskStepType[];
  onComplete: (stepId: string, isCompleted: boolean) => void;
  onAddComment: (stepId: string, comment: string) => void;
  onAddPhoto: (stepId: string, photoUrl: string) => void;
}

const TaskStepsList = ({ steps, onComplete, onAddComment, onAddPhoto }: TaskStepsListProps) => {
  return (
    <div className="bg-white mt-2 px-4">
      <h2 className="text-lg font-medium py-3 border-b">Steps to complete</h2>
      
      <div className="divide-y divide-gray-100">
        {steps.map(step => (
          <TaskStep 
            key={step.id} 
            step={step} 
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
