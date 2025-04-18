
import { cn } from "@/lib/utils";
import { Task } from "@/types";
import TaskCard from "./TaskCard";

interface TaskSectionProps {
  title: string;
  tasks: Task[];
  badgeColor?: "yellow" | "red" | "green" | "gray";
}

const TaskSection = ({ title, tasks, badgeColor = "gray" }: TaskSectionProps) => {
  const getBadgeClasses = () => {
    switch (badgeColor) {
      case "yellow":
        return "bg-yellow-100 text-yellow-800";
      case "red":
        return "bg-red-100 text-red-800";
      case "green":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">{title}</h2>
        <span className={cn(
          "px-2.5 py-0.5 rounded-full text-sm font-medium",
          getBadgeClasses()
        )}>
          {tasks.length}
        </span>
      </div>
      
      <div className="space-y-3">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} showAssignee={true} />
        ))}
        {tasks.length === 0 && (
          <p className="text-gray-500 text-center py-4">No {title.toLowerCase()}</p>
        )}
      </div>
    </div>
  );
};

export default TaskSection;
