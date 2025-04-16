
import { useEffect, useState } from "react";
import { Task } from "@/types";
import { getCurrentUserTasks } from "@/data/mockData";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import TaskCard from "@/components/TaskCard";
import BottomNavigation from "@/components/BottomNavigation";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";

const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId, isAuthenticated } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    
    // Simulate loading data
    const timer = setTimeout(() => {
      if (userId) {
        const userTasks = getCurrentUserTasks(userId);
        setTasks(userTasks);
        setLoading(false);
        
        // Show notification if there are tasks due soon
        const urgentTasks = userTasks.filter(task => 
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
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [userId, isAuthenticated, navigate, toast]);
  
  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        <Header title="Today's Tasks" showBackButton={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader className="mx-auto h-8 w-8 animate-spin text-gray-400" />
            <p className="mt-2 text-gray-600">Loading tasks...</p>
          </div>
        </div>
        <div className="h-16">
          {/* Spacer for bottom nav */}
        </div>
        <BottomNavigation />
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col">
      <Header title="Today's Tasks" showBackButton={false} />
      
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
        {tasks.length === 0 ? (
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
      
      {/* Spacer for bottom nav */}
      <div className="h-16"></div>
      
      <BottomNavigation />
    </div>
  );
};

export default TaskList;
