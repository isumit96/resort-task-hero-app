
import { Task } from "@/types";
import { Clock, MapPin } from "lucide-react";
import TaskStatusBadge from "./TaskStatusBadge";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";

interface TaskHeaderProps {
  task: Task;
}

const TaskHeader = ({ task }: TaskHeaderProps) => {
  const { t, i18n } = useTranslation();
  
  const getRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Log the task data for debugging
  console.log('Task in Header:', task);
  console.log('Task ID:', task.id, 'Title:', task.title, 'TitleKey:', task.titleKey);
  console.log('Current language:', i18n.language);

  // Get the translated task title, first trying the translation key
  const taskTitle = task.titleKey ? t(task.titleKey, { defaultValue: task.title || '' }) : task.title;
  
  // Get the translated location, first trying the translation key
  const taskLocation = task.locationKey ? t(task.locationKey, { defaultValue: task.location || '' }) : task.location;

  return (
    <div className="bg-card px-4 py-4 border-b border-border">
      <div className="flex justify-between items-start">
        <h1 className="text-xl font-semibold text-foreground">{taskTitle}</h1>
        <TaskStatusBadge status={task.status} />
      </div>
      
      <div className="mt-3 flex flex-wrap gap-y-2 gap-x-4">
        <div className="flex items-center text-muted-foreground">
          <Clock size={16} className="mr-1" />
          <span className="text-sm">{t('tasks.due')} {getRelativeTime(task.dueTime)}</span>
        </div>
        
        <div className="flex items-center text-muted-foreground">
          <MapPin size={16} className="mr-1" />
          <span className="text-sm">{taskLocation}</span>
        </div>
      </div>
    </div>
  );
};

export default TaskHeader;
