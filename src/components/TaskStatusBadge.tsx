
import { TaskStatus } from "@/types";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle, RotateCw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TaskStatusBadgeProps {
  status: TaskStatus;
  size?: "sm" | "md";
}

const TaskStatusBadge = ({ status, size = "md" }: TaskStatusBadgeProps) => {
  const { t } = useTranslation();
  
  const getStatusDetails = (status: TaskStatus) => {
    switch (status) {
      case "pending":
        return {
          bgColor: "bg-blue-50 dark:bg-blue-900/30",
          textColor: "text-blue-700 dark:text-blue-300",
          borderColor: "border-blue-200 dark:border-blue-700",
          icon: <Clock size={size === "sm" ? 10 : 14} className="mr-1" />,
          label: t('tasks.status.pending', 'Pending')
        };
      case "inprogress":
        return {
          bgColor: "bg-amber-50 dark:bg-amber-900/30",
          textColor: "text-amber-700 dark:text-amber-300",
          borderColor: "border-amber-200 dark:border-amber-700",
          icon: <RotateCw size={size === "sm" ? 10 : 14} className="mr-1 animate-spin" />,
          label: t('tasks.status.inprogress', 'In Progress')
        };
      case "completed":
        return {
          bgColor: "bg-green-50 dark:bg-green-900/30",
          textColor: "text-green-700 dark:text-green-300",
          borderColor: "border-green-200 dark:border-green-700",
          icon: <CheckCircle size={size === "sm" ? 10 : 14} className="mr-1" />,
          label: t('tasks.status.completed', 'Completed')
        };
      default:
        return {
          bgColor: "bg-gray-100 dark:bg-gray-800",
          textColor: "text-gray-700 dark:text-gray-300",
          borderColor: "border-gray-200 dark:border-gray-700",
          icon: null,
          label: t(`tasks.status.${status}`, status)
        };
    }
  };

  const { bgColor, textColor, borderColor, icon, label } = getStatusDetails(status);

  return (
    <span 
      className={cn(
        bgColor, textColor, borderColor,
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        "border",
        size === "sm" ? "text-[10px] py-0 px-1.5" : ""
      )}
    >
      {icon}
      {label}
    </span>
  );
};

export default TaskStatusBadge;
