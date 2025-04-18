
import { useEffect } from "react";
import { Task } from "@/types";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { format, parseISO } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import TaskCard from "@/components/TaskCard";

const TaskHistory = () => {
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
          steps:task_steps(*),
          profiles:assigned_to(username)
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
        assigneeName: task.profiles?.username || 'Unassigned',
        createdAt: task.created_at,
        completedAt: task.completed_at,
        deadline: task.deadline,
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
            <p className="text-lg font-medium">No completed tasks yet</p>
            <p className="mt-2">Completed tasks will appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedTasks.map(group => (
              <div key={group.date}>
                <h3 className="text-md font-medium text-gray-700 mb-3">
                  {group.formattedDate}
                </h3>
                <div className="space-y-3">
                  {group.tasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task}
                      showAssignee={true}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="h-16"></div>
      <BottomNavigation />
    </div>
  );
};

export default TaskHistory;
