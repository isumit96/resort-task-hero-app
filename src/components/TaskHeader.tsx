
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

  // Get the translated task title with silent fallback
  const taskTitle = task.title; // Default to original title
  
  // Try to get translation if titleKey exists
  const translatedTitle = task.titleKey ? 
    t(task.titleKey, { defaultValue: task.title, silent: true }) : 
    task.title;
  
  // Get the translated location with silent fallback
  const taskLocation = task.location; // Default to original location
  
  // Try to get translation if locationKey exists
  const translatedLocation = task.locationKey ? 
    t(task.locationKey, { defaultValue: task.location, silent: true }) : 
    task.location;

  // Get the translated description with silent fallback
  const taskDescription = task.description; // Default to original description
  
  // Try to get translation if descriptionKey exists
  const translatedDescription = task.descriptionKey && task.description ? 
    t(task.descriptionKey, { defaultValue: task.description, silent: true }) : 
    task.description;

  return (
    <div className="bg-card px-4 py-4 border-b border-border">
      <div className="flex justify-between items-start">
        <h1 className="text-xl font-semibold text-foreground">{translatedTitle || taskTitle}</h1>
        <TaskStatusBadge status={task.status} />
      </div>
      
      {taskDescription && (
        <div className="mt-2 text-muted-foreground">
          <p>{translatedDescription || taskDescription}</p>
        </div>
      )}
      
      <div className="mt-3 flex flex-wrap gap-y-2 gap-x-4">
        <div className="flex items-center text-muted-foreground">
          <Clock size={16} className="mr-1" />
          <span className="text-sm">{t('tasks.due')} {getRelativeTime(task.dueTime)}</span>
        </div>
        
        <div className="flex items-center text-muted-foreground">
          <MapPin size={16} className="mr-1" />
          <span className="text-sm">{translatedLocation || taskLocation}</span>
        </div>
      </div>
    </div>
  );
};

export default TaskHeader;
