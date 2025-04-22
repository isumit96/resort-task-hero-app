
import { TaskStatus as TaskStatusType } from "@/types";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TaskStatusProps {
  status: TaskStatusType;
  completedSteps: number;
  totalSteps: number;
}

const TaskStatus = ({ status, completedSteps, totalSteps }: TaskStatusProps) => {
  const { t } = useTranslation();
  
  if (status === 'completed') {
    return (
      <div className="mt-6 p-4 bg-green-50 rounded-md flex items-center">
        <CheckCircle className="text-green-600 mr-3" size={24} />
        <div>
          <p className="font-medium text-green-800">{t('tasks.completed')}</p>
          <p className="text-sm text-green-700">
            {t('tasks.allStepsCompleted')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 bg-blue-50 rounded-md flex items-center">
      <AlertTriangle className="text-blue-600 mr-3" size={24} />
      <div>
        <p className="font-medium text-blue-800">{t('tasks.incomplete')}</p>
        <p className="text-sm text-blue-700">
          {completedSteps} {t('common.of')} {totalSteps} {t('tasks.stepsCompleted')}
        </p>
      </div>
    </div>
  );
};

export default TaskStatus;
