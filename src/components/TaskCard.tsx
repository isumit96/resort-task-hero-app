
import { Task } from "@/types";
import { Clock, MapPin, ChevronRight, User, Calendar } from "lucide-react";
import TaskStatusBadge from "./TaskStatusBadge";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, isAfter } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  showAssignee?: boolean;
}

const TaskCard = ({ task, showAssignee = true }: TaskCardProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/task/${task.id}`);
  };

  const getRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const isOverdue = isAfter(new Date(), date) && task.status !== 'completed';
      const relativeTime = formatDistanceToNow(date, { addSuffix: true });
      return { relativeTime, isOverdue };
    } catch (error) {
      console.error('Error formatting date:', error);
      return { relativeTime: dateString, isOverdue: false };
    }
  };

  const { relativeTime, isOverdue } = getRelativeTime(task.dueTime);
  const completedSteps = task.steps.filter(step => step.isCompleted).length;
  const progress = (completedSteps / task.steps.length) * 100;

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "bg-white dark:bg-gray-800 rounded-xl shadow-card hover:shadow-card-hover border border-border/40 dark:border-gray-700/60",
        "transition-all duration-200 overflow-hidden"
      )}
      onClick={handleClick}
    >
      <div className="relative">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 dark:bg-gray-700">
          <div 
            className={cn(
              "h-full transition-all",
              task.status === 'completed' ? "bg-status-completed" : 
              task.status === 'inprogress' ? "bg-status-inprogress" : 
              "bg-status-pending"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="p-4 pt-5">
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-3">
              <h3 className="font-medium text-lg text-gray-900 dark:text-gray-100">{task.title}</h3>
              
              <div className="mt-3 flex flex-wrap gap-y-2 gap-x-4">
                <div className={cn(
                  "flex items-center",
                  isOverdue ? "text-destructive" : "text-muted-foreground",
                  "text-sm"
                )}>
                  <Clock size={14} className="mr-1 flex-shrink-0" />
                  <span>Due {relativeTime}</span>
                </div>
                
                <div className="flex items-center text-muted-foreground text-sm dark:text-gray-300">
                  <MapPin size={14} className="mr-1 flex-shrink-0" />
                  <span>{task.location}</span>
                </div>

                {showAssignee && task.assigneeName && (
                  <div className="flex items-center text-muted-foreground text-sm dark:text-gray-300">
                    <User size={14} className="mr-1 flex-shrink-0" />
                    <span>{task.assigneeName}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-3 flex items-center justify-between">
                <TaskStatusBadge status={task.status} />
                <div className="flex items-center text-muted-foreground text-xs dark:text-gray-400">
                  <Calendar size={12} className="mr-1" />
                  <span>{completedSteps}/{task.steps.length} steps</span>
                </div>
              </div>
            </div>
            
            <div className="text-muted-foreground/50 dark:text-gray-400 self-center">
              <ChevronRight size={20} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCard;
