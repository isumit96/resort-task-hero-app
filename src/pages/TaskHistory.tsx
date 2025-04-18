import { useEffect, useState } from "react";
import { Task } from "@/types";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { format, parseISO } from "date-fns";
import { CheckCircle, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const TaskHistory = () => {
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useUser();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
  }, [isAuthenticated, navigate]);

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ["completed-tasks"],
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          steps:task_steps(*)
        `)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (error) throw error;
      
      return data.map((task: any): Task => ({
        id: task.id,
        title: task.title,
        dueTime: new Date(task.due_time).toLocaleString(),
        location: task.location,
        status: task.status,
        assignedTo: task.assigned_to,
        createdAt: task.created_at,
        completedAt: task.completed_at,
        deadline: task.deadline ? new Date(task.deadline).toLocaleString() : undefined,
        steps: task.steps.map((step: any) => ({
          id: step.id,
          title: step.title,
          isCompleted: step.is_completed,
          requiresPhoto: step.requires_photo,
          comment: step.comment,
          photoUrl: step.photo_url,
          isOptional: step.is_optional
        }))
      }));
    }
  });
  
  // Group tasks by completion date
  const groupTasksByDate = () => {
    if (!tasks) return [];
    
    const grouped: Record<string, Task[]> = {};
    
    tasks.forEach(task => {
      if (task.completedAt) {
        const date = format(new Date(task.completedAt), 'yyyy-MM-dd');
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

  const handleOpenTask = (taskId: string) => {
    navigate(`/task/${taskId}`);
  };
  
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <Header title="Task History" showBackButton={false} />
        <div className="flex-1 flex items-center justify-center">
          <p>Loading history...</p>
        </div>
        <div className="h-16"></div>
        <BottomNavigation />
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header title="Task History" showBackButton={false} />
      
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        {!tasks?.length ? (
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
                      <div key={task.id} className="rounded-lg border border-green-100 bg-white overflow-hidden shadow-sm">
                        <div className="p-4">
                          <div className="flex justify-between">
                            <h3 className="font-medium text-lg">{task.title}</h3>
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                              Completed
                            </span>
                          </div>
                          
                          <div className="mt-2 flex items-center text-gray-600 text-sm">
                            <Clock size={14} className="mr-1" />
                            <span>Completed {formatCompletedDate(task.completedAt || '')}</span>
                          </div>
                          
                          <div className="mt-1 flex items-center text-gray-500 text-sm">
                            <MapPin size={14} className="mr-1" />
                            <span>{task.location}</span>
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 border-t">
                          <Button 
                            variant="outline"
                            className="w-full bg-green-50 text-green-700 border-green-100 hover:bg-green-100"
                            onClick={() => handleOpenTask(task.id)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="h-16"></div>
      
      <BottomNavigation />
    </div>
  );
};

const formatCompletedDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  
  // If completed today, show "Today at HH:MM"
  if (date.toDateString() === now.toDateString()) {
    return `Today at ${format(date, 'h:mm a')}`;
  }
  
  // If completed yesterday, show "Yesterday at HH:MM"
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${format(date, 'h:mm a')}`;
  }
  
  // Otherwise show "MMM d at HH:MM"
  return format(date, 'MMM d, yyyy');
};

export default TaskHistory;
