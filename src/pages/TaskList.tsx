import { useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Loader, Plus } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import TaskCard from "@/components/TaskCard";
import { useRole } from "@/hooks/useRole";
import { formatDistanceToNow } from "date-fns";

const TaskList = () => {
  const { user, isAuthenticated } = useUser();
  const { isManager } = useRole();
  const navigate = useNavigate();
  const { data: tasks, isLoading, error } = useTasks(isManager);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    
    console.log("Current user in TaskList:", user);
  }, [isAuthenticated, navigate, user]);

  useEffect(() => {
    console.log("Tasks data in TaskList:", tasks);
  }, [tasks]);
  
  const handleCreateTask = () => {
    navigate("/tasks/create");
  };

  const parseDate = (dateString: string | undefined): Date | null => {
    if (!dateString) return null;
    
    try {
      return new Date(dateString);
    } catch (e) {
      console.error("Error parsing date:", e);
      return null;
    }
  };
  
  const now = new Date();
  const taskArray = Array.isArray(tasks) ? tasks : [];
  
  const activeTasks = taskArray.filter(task => task.status !== 'completed') || [];
  
  const overdueTasks = activeTasks.filter(task => {
    const deadlineDate = parseDate(task.deadline);
    return deadlineDate !== null && deadlineDate < now;
  });

  const upcomingTasks = activeTasks.filter(task => {
    const deadlineDate = parseDate(task.deadline);
    return deadlineDate === null || deadlineDate >= now;
  });

  if (error) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <Header showBackButton={false} />
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
      <div className="h-screen flex flex-col bg-gray-50">
        <Header showBackButton={false} />
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
    <div className="h-screen flex flex-col bg-gray-50">
      <Header showBackButton={false} />
      
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        {isManager && (
          <div className="mb-6">
            <Button 
              onClick={handleCreateTask}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Task
            </Button>
          </div>
        )}

        {(!activeTasks.length) ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <p className="text-lg font-medium">No tasks for today!</p>
            <p className="mt-2">Enjoy your break or check again later</p>
          </div>
        ) : (
          <div className="space-y-6">
            {overdueTasks.length > 0 && (
              <div>
                <div className="flex items-center mb-3">
                  <h2 className="text-base font-semibold">Overdue Tasks</h2>
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full">
                    {overdueTasks.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {overdueTasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      showAssignee={isManager}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {upcomingTasks.length > 0 && (
              <div>
                <div className="flex items-center mb-3">
                  <h2 className="text-base font-semibold">Upcoming tasks</h2>
                  <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-800 text-xs font-medium rounded-full">
                    {upcomingTasks.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {upcomingTasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task}
                      showAssignee={isManager}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="h-16" />
      <BottomNavigation />
    </div>
  );
};

export default TaskList;
