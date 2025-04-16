
import { Task } from "@/types";
import { Clock, MapPin } from "lucide-react";
import TaskStatusBadge from "./TaskStatusBadge";

interface TaskHeaderProps {
  task: Task;
}

const TaskHeader = ({ task }: TaskHeaderProps) => {
  return (
    <div className="bg-white px-4 py-4 border-b">
      <div className="flex justify-between items-start">
        <h1 className="text-xl font-semibold">{task.title}</h1>
        <TaskStatusBadge status={task.status} />
      </div>
      
      <div className="mt-3 flex flex-wrap gap-y-2 gap-x-4">
        <div className="flex items-center text-gray-600">
          <Clock size={16} className="mr-1" />
          <span className="text-sm">Due {task.dueTime}</span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <MapPin size={16} className="mr-1" />
          <span className="text-sm">{task.location}</span>
        </div>
      </div>
    </div>
  );
};

export default TaskHeader;
