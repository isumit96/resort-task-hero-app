
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DelayedTasksAlertProps {
  count: number;
}

const DelayedTasksAlert = ({ count }: DelayedTasksAlertProps) => {
  if (count === 0) return null;

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        There {count === 1 ? 'is' : 'are'} {count} delayed {count === 1 ? 'task' : 'tasks'} that need attention
      </AlertDescription>
    </Alert>
  );
};

export default DelayedTasksAlert;
