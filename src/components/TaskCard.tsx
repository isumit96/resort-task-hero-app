
import { Task } from "@/types";
import { Clock, MapPin, ChevronRight, User } from "lucide-react";
import TaskStatusBadge from "./TaskStatusBadge";
import { useNavigate } from "react-router-dom";

interface TaskCardProps {
  task: Task;
  showAssignee?: boolean;
}

const TaskCard = ({ task, showAssignee = false }: TaskCardProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/task/${task.id}`);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 active:bg-gray-50"
      onClick={handleClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-medium text-lg">{task.title}</h3>
          
          <div className="mt-2 flex flex-wrap gap-y-2 gap-x-4">
            <div className="flex items-center text-gray-600 text-sm">
              <Clock size={14} className="mr-1" />
              <span>Due {task.dueTime}</span>
            </div>
            
            <div className="flex items-center text-gray-600 text-sm">
              <MapPin size={14} className="mr-1" />
              <span>{task.location}</span>
            </div>

            {showAssignee && (
              <div className="flex items-center text-gray-600 text-sm">
                <User size={14} className="mr-1" />
                <span>Assigned to {task.assignedTo}</span>
              </div>
            )}
          </div>
          
          <div className="mt-3 flex items-center justify-between">
            <TaskStatusBadge status={task.status} />
            <div className="flex items-center text-gray-400 text-xs">
              <span>{task.steps.length} steps</span>
            </div>
          </div>
        </div>
        
        <div className="ml-2 text-gray-400">
          <ChevronRight size={20} />
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
