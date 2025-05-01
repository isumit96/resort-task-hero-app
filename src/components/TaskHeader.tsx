
import { Task } from "@/types";
import { Clock, MapPin } from "lucide-react";
import TaskStatusBadge from "./TaskStatusBadge";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import { dynamicTranslations } from "@/i18n/config";

interface TaskHeaderProps {
  task: Task;
}

const TaskHeader = ({ task }: TaskHeaderProps) => {
  const { t, i18n } = useTranslation();
  
  // Register task title and location for translation
  const taskTitleKey = `task_title_${task.id}`;
  const taskLocationKey = `task_location_${task.id}`;
  
  dynamicTranslations.registerContent(taskTitleKey, task.title);
  dynamicTranslations.registerContent(taskLocationKey, task.location);
  
  const getRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  return (
    <div className="bg-card px-4 py-4 border-b border-border">
      <div className="flex justify-between items-start">
        <h1 className="text-xl font-semibold text-foreground">
          {t(taskTitleKey, { format: 'dynamic' })}
        </h1>
        <TaskStatusBadge status={task.status} />
      </div>
      
      <div className="mt-3 flex flex-wrap gap-y-2 gap-x-4">
        <div className="flex items-center text-muted-foreground">
          <Clock size={16} className="mr-1" />
          <span className="text-sm">{t('tasks.due')} {getRelativeTime(task.dueTime)}</span>
        </div>
        
        <div className="flex items-center text-muted-foreground">
          <MapPin size={16} className="mr-1" />
          <span className="text-sm">{t(taskLocationKey, { format: 'dynamic' })}</span>
        </div>
      </div>
    </div>
  );
};

export default TaskHeader;
