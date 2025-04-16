
import { TaskStatus as TaskStatusType } from "@/types";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface TaskStatusProps {
  status: TaskStatusType;
  completedSteps: number;
  totalSteps: number;
}

const TaskStatus = ({ status, completedSteps, totalSteps }: TaskStatusProps) => {
  if (status === 'completed') {
    return (
      <div className="mt-6 p-4 bg-green-50 rounded-md flex items-center">
        <CheckCircle className="text-green-600 mr-3" size={24} />
        <div>
          <p className="font-medium text-green-800">Task Completed</p>
          <p className="text-sm text-green-700">
            All steps have been completed
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 bg-blue-50 rounded-md flex items-center">
      <AlertTriangle className="text-blue-600 mr-3" size={24} />
      <div>
        <p className="font-medium text-blue-800">Task Incomplete</p>
        <p className="text-sm text-blue-700">
          {completedSteps} of {totalSteps} steps completed
        </p>
      </div>
    </div>
  );
};

export default TaskStatus;
