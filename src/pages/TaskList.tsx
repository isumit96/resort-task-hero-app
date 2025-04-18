
import { useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useToast } from "@/hooks/use-toast";
import { Loader, Clock, MapPin } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";

const TaskList = () => {
  const { user, isAuthenticated } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: tasks, isLoading, error } = useTasks();
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
  }, [isAuthenticated, navigate]);

  const handleOpenTask = (taskId: string) => {
    navigate(`/task/${taskId}`);
  };

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

  // Filter tasks into overdue and upcoming
  const now = new Date();
  const overdueTasks = tasks?.filter(task => 
    task.status !== 'completed' && 
    task.deadline && 
    new Date(task.deadline) < now
  ) || [];

  const upcomingTasks = tasks?.filter(task => 
    task.status !== 'completed' && 
    (!task.deadline || new Date(task.deadline) >= now)
  ) || [];
  
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header showBackButton={false} />
      
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        {!tasks?.length ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <p className="text-lg font-medium">No tasks for today!</p>
            <p className="mt-2">Enjoy your break or check again later</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overdue Tasks Section */}
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
                    <div key={task.id} className="rounded-lg border border-red-200 bg-white overflow-hidden shadow-sm">
                      <div className="p-4">
                        <h3 className="font-medium text-lg">{task.title}</h3>
                        <div className="mt-2 flex items-center text-red-500 text-sm">
                          <Clock size={14} className="mr-1" />
                          <span>Deadline crossed {getTimeAgo(task.deadline || '')}</span>
                        </div>
                        <div className="mt-1 flex items-center text-gray-500 text-sm">
                          <MapPin size={14} className="mr-1" />
                          <span>{task.location}</span>
                        </div>
                      </div>
                      <div className="p-3 bg-white border-t">
                        <Button 
                          className="w-full bg-blue-500 hover:bg-blue-600"
                          onClick={() => handleOpenTask(task.id)}
                        >
                          Open Task
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Upcoming Tasks Section */}
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
                    <div key={task.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
                      <div className="p-4">
                        <h3 className="font-medium text-lg">{task.title}</h3>
                        <div className="mt-2 flex items-center text-gray-600 text-sm">
                          <Clock size={14} className="mr-1" />
                          <span>{getTaskDueText(task.dueTime)}</span>
                        </div>
                        <div className="mt-1 flex items-center text-gray-500 text-sm">
                          <MapPin size={14} className="mr-1" />
                          <span>{task.location}</span>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 border-t">
                        <Button 
                          variant="outline"
                          className="w-full bg-blue-50 text-blue-500 border-blue-100 hover:bg-blue-100"
                          onClick={() => handleOpenTask(task.id)}
                        >
                          Open Task
                        </Button>
                      </div>
                    </div>
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

// Helper function to format time ago
const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));
  
  if (diffMins < 60) {
    return `${diffMins} minutes ago`;
  }
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
};

// Helper function for due time text
const getTaskDueText = (dueTime: string) => {
  if (dueTime.includes('Today')) {
    return dueTime;
  }
  
  const now = new Date();
  const dueDate = new Date(dueTime);
  
  const diffMs = dueDate.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));
  
  if (diffMins < 60) {
    return `Due in ${diffMins} minutes`;
  }
  
  return dueTime;
};

export default TaskList;
