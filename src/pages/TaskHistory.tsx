
import { useEffect, useState } from "react";
import { Task } from "@/types";
import { getTaskHistory } from "@/data/mockData";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import TaskCard from "@/components/TaskCard";
import BottomNavigation from "@/components/BottomNavigation";
import { format, parseISO } from "date-fns";
import { CheckCircle } from "lucide-react";

const TaskHistory = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId, isAuthenticated } = useUser();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    
    // Simulate loading data
    const timer = setTimeout(() => {
      if (userId) {
        const historyTasks = getTaskHistory(userId);
        setTasks(historyTasks);
        setLoading(false);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [userId, isAuthenticated, navigate]);
  
  // Group tasks by completion date
  const groupTasksByDate = () => {
    const grouped: Record<string, Task[]> = {};
    
    tasks.forEach(task => {
      if (task.completedAt) {
        const date = format(parseISO(task.completedAt), 'yyyy-MM-dd');
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(task);
      }
    });
    
    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
      .map(([date, tasks]) => ({
        date,
        formattedDate: format(parseISO(date), 'MMMM d, yyyy'),
        tasks
      }));
  };
  
  const groupedTasks = groupTasksByDate();
  
  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        <Header title="Task History" showBackButton={false} />
        <div className="flex-1 flex items-center justify-center">
          <p>Loading history...</p>
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
      <Header title="Task History" showBackButton={false} />
      
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <CheckCircle className="h-12 w-12 text-gray-300 mb-2" />
            <p className="text-lg font-medium">No completed tasks yet</p>
            <p className="mt-2">Completed tasks will appear here</p>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                {tasks.length} Completed {tasks.length === 1 ? 'Task' : 'Tasks'}
              </h2>
            </div>
            
            <div className="space-y-6">
              {groupedTasks.map(group => (
                <div key={group.date}>
                  <h3 className="text-md font-medium text-gray-700 mb-3">
                    {group.formattedDate}
                  </h3>
                  <div className="space-y-3">
                    {group.tasks.map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                </div>
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

export default TaskHistory;
