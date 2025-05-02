
import { Task } from "@/types";
import { Clock, MapPin } from "lucide-react";
import TaskStatusBadge from "./TaskStatusBadge";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";

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
    <Card className="mx-4 mt-4 overflow-hidden border rounded-lg shadow-sm">
      <div className="bg-card p-5">
        <div className="flex justify-between items-start gap-4">
          <h1 className="text-xl font-semibold text-foreground">
            {title}
          </h1>
          <TaskStatusBadge status={task.status} />
        </div>
        
        <div className="mt-4 flex flex-wrap gap-y-3 gap-x-6">
          <div className="flex items-center text-muted-foreground">
            <Clock size={16} className="mr-2 flex-shrink-0" />
            <span className="text-sm">{i18n.t('tasks.due')} {getRelativeTime(task.dueTime)}</span>
          </div>
          
          <div className="flex items-center text-muted-foreground">
            <MapPin size={16} className="mr-2 flex-shrink-0" />
            <span className="text-sm">
              {location}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TaskHeader;
