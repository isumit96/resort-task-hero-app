
import { Task } from "@/types";
import { Clock, MapPin } from "lucide-react";
import TaskStatusBadge from "./TaskStatusBadge";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";

interface TaskHeaderProps {
  task: Task;
}

const TaskHeader = ({ task }: TaskHeaderProps) => {
  const { i18n } = useTranslation();
  
  const getRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Get the localized title and location based on current language
  const getLocalizedText = (baseText: string, hiText?: string | null, knText?: string | null) => {
    if (i18n.language === 'hi' && hiText) {
      return hiText;
    }
    if (i18n.language === 'kn' && knText) {
      return knText;
    }
    return baseText;
  };

  const title = getLocalizedText(task.title, task.title_hi, task.title_kn);
  const location = getLocalizedText(task.location, task.location_hi, task.location_kn);

  return (
    <div className="bg-card px-4 py-4 border-b border-border">
      <div className="flex justify-between items-start">
        <h1 className="text-xl font-semibold text-foreground">
          {title}
        </h1>
        <TaskStatusBadge status={task.status} />
      </div>
      
      <div className="mt-3 flex flex-wrap gap-y-2 gap-x-4">
        <div className="flex items-center text-muted-foreground">
          <Clock size={16} className="mr-1" />
          <span className="text-sm">{i18n.t('tasks.due')} {getRelativeTime(task.dueTime)}</span>
        </div>
        
        <div className="flex items-center text-muted-foreground">
          <MapPin size={16} className="mr-1" />
          <span className="text-sm">
            {location}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TaskHeader;
