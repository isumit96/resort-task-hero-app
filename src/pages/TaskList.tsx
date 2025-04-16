import { useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import TaskCard from "@/components/TaskCard";
import BottomNavigation from "@/components/BottomNavigation";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useRole } from "@/hooks/useRole";

const TaskList = () => {
  const { isAuthenticated } = useUser();
  const { isManager } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: tasks, isLoading, error } = useTasks();
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    
    if (isManager) {
      navigate("/manager");
      return;
    }

    // Show notification if there are tasks due soon
    if (tasks?.length) {
      const urgentTasks = tasks.filter(task => 
        task.status === 'pending' && 
        task.dueTime.includes('AM')
      );
      
      if (urgentTasks.length > 0) {
        toast({
          title: "Tasks Due Soon",
          description: `You have ${urgentTasks.length} tasks that need attention`,
        });
      }
    }
  }, [tasks, isAuthenticated, isManager, navigate, toast]);

  if (error) {
    return (
      <div className="h-screen flex flex-col">
        <Header title="Today's Tasks" showBackButton={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-red-600">
            <p>Error loading tasks</p>
            <p className="text-sm">{error.message}</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col">
        <Header title="Today's Tasks" showBackButton={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader className="mx-auto h-8 w-8 animate-spin text-gray-400" />
            <p className="mt-2 text-gray-600">Loading tasks...</p>
          </div>
        </div>
        <div className="h-16" />
        <BottomNavigation />
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col">
      <Header title="Today's Tasks" showBackButton={false} />
      
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
        {!tasks?.length ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <p className="text-lg font-medium">No tasks for today!</p>
            <p className="mt-2">Enjoy your break or check again later</p>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'} Today
              </h2>
            </div>
            
            <div className="space-y-3">
              {tasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="h-16" />
      <BottomNavigation />
    </div>
  );
};

export default TaskList;
