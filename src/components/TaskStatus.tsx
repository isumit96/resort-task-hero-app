
import { TaskStatus as TaskStatusType } from "@/types";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";

interface TaskStatusProps {
  status: TaskStatusType;
  completedSteps: number;
  totalSteps: number;
}

const TaskStatus = ({ status, completedSteps, totalSteps }: TaskStatusProps) => {
  const { t } = useTranslation();
  
  if (status === 'completed') {
    return (
      <Card className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-900/30">
        <CheckCircle className="text-green-600 dark:text-green-400 mr-4 flex-shrink-0" size={24} />
        <div>
          <p className="font-medium text-green-800 dark:text-green-300">{t('tasks.completed')}</p>
          <p className="text-sm text-green-700 dark:text-green-400">
            {t('tasks.allStepsCompleted')}
          </p>
        </div>
      </Card>
    );
  }

  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <Card className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
      <AlertTriangle className="text-blue-600 dark:text-blue-400 mr-4 flex-shrink-0" size={24} />
      <div className="flex-1">
        <p className="font-medium text-blue-800 dark:text-blue-300">{t('tasks.incomplete')}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            {completedSteps} {t('common.of')} {totalSteps} {t('tasks.stepsCompleted')}
          </p>
          <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
            {progressPercent}%
          </p>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-blue-200 dark:bg-blue-700/30 rounded-full h-1.5 mt-2">
          <div 
            className="bg-blue-600 dark:bg-blue-400 h-1.5 rounded-full transition-all duration-500" 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>
    </Card>
  );
};

export default TaskStatus;
