
import { useNavigate } from "react-router-dom";
import { Task } from "@/types";
import { Calendar, MapPin } from "lucide-react";
import TaskStatusBadge from "./TaskStatusBadge";
import { formatDistanceToNow, parseISO } from "date-fns";
import { enUS, hi, kn } from 'date-fns/locale';
import { useTranslation } from "react-i18next";

interface TaskCardProps {
  task: Task;
  showAssignee?: boolean;
}

const TaskCard = ({ task, showAssignee = true }: TaskCardProps) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  const handleClick = () => {
    navigate(`/tasks/${task.id}`);
  };
  
  // Get appropriate locale based on current language
  const getLocale = () => {
    switch (i18n.language) {
      case 'hi':
        return hi;
      case 'kn':
        return kn;
      default:
        return enUS;
    }
  };
  
  const getRelativeTime = (dateString: string) => {
    try {
      // Parse the date string and get relative time with proper locale
      return formatDistanceToNow(parseISO(dateString), { 
        addSuffix: true,
        locale: getLocale()
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Get the localized title based on current language
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
  
  // Calculate completed steps ratio
  const completedSteps = task.steps?.filter(step => step.isCompleted).length || 0;
  const totalSteps = task.steps?.length || 0;
  
  return (
    <div 
      className="bg-card border border-border rounded-lg shadow-sm overflow-hidden hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex justify-between items-center px-4 py-2 bg-muted/30">
        <h3 className="font-medium text-sm truncate">{title}</h3>
        <TaskStatusBadge status={task.status} />
      </div>
      
      <div className="p-4 pt-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2.5">
            {task.dueTime && (
              <div className="flex items-center text-muted-foreground text-xs">
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                <span>{t('tasks.due')} {getRelativeTime(task.dueTime)}</span>
              </div>
            )}
            
            {location && (
              <div className="flex items-center text-muted-foreground text-xs">
                <MapPin className="h-3.5 w-3.5 mr-1.5" />
                <span>{location}</span>
              </div>
            )}
          </div>
          
          <div className="text-right">
            {task.steps && task.steps.length > 0 && (
              <>
                <span className="text-sm font-medium">{completedSteps}/{totalSteps}</span>
                <p className="text-muted-foreground text-xs">
                  {completedSteps === totalSteps ? 
                    t('tasks.completed') : 
                    (completedSteps > 0 ? 
                      `${completedSteps} ${t('tasks.stepsCompleted')}` : 
                      t('tasks.incomplete'))
                  }
                </p>
              </>
            )}
          </div>
        </div>
        
        {showAssignee && task.assigneeName && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {t('tasks.assignedTo')}
              </span>
              <span className="text-xs font-medium">
                {task.assigneeName}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
