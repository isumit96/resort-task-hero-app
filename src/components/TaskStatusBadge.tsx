
import { TaskStatus } from "@/types";

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

const TaskStatusBadge = ({ status }: TaskStatusBadgeProps) => {
  const getStatusDetails = (status: TaskStatus) => {
    switch (status) {
      case "pending":
        return {
          bgColor: "bg-status-pending bg-opacity-20",
          textColor: "text-status-pending text-opacity-90",
          borderColor: "border-status-pending",
          label: "Pending"
        };
      case "inprogress":
        return {
          bgColor: "bg-status-inprogress bg-opacity-40",
          textColor: "text-gray-700",
          borderColor: "border-yellow-300",
          label: "In Progress"
        };
      case "completed":
        return {
          bgColor: "bg-status-completed bg-opacity-40",
          textColor: "text-green-800",
          borderColor: "border-green-300",
          label: "Completed"
        };
      default:
        return {
          bgColor: "bg-gray-200",
          textColor: "text-gray-800",
          borderColor: "border-gray-300",
          label: status
        };
    }
  };

  const { bgColor, textColor, borderColor, label } = getStatusDetails(status);

  return (
    <span 
      className={`
        ${bgColor} ${textColor} ${borderColor}
        inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium
        border
      `}
    >
      {label}
    </span>
  );
};

export default TaskStatusBadge;
