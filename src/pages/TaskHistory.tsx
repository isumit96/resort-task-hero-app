
import { useEffect } from "react";
import { Task } from "@/types";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import TaskCard from "@/components/TaskCard";
import { useTranslation } from "react-i18next";

const TaskHistory = () => {
  const { isAuthenticated } = useUser();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
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
        assigneeName: task.profiles?.username || t('common.unassigned'),
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
      .map(([date, tasks]) => {
        const firstDate = parseISO(date);
        const relativeDate = formatDistanceToNow(firstDate, { addSuffix: true });
        return {
          date,
          formattedDate: relativeDate,
          tasks
        };
      });
  };
  
  const groupedTasks = groupTasksByDate();
  
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <Header title={t('navigation.history')} showBackButton={false} />
        <div className="flex-1 flex items-center justify-center text-foreground">
          <p>{t('common.loading')}</p>
        </div>
        <div className="h-16"></div>
        <BottomNavigation />
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col bg-background">
      <Header title={t('navigation.history')} showBackButton={false} />
      
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        {!tasks?.length ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <p className="text-lg font-medium">{t('tasks.noCompletedTasks')}</p>
            <p className="mt-2">{t('tasks.completedTasksWillAppear')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedTasks.map(group => (
              <div key={group.date}>
                <h3 className="text-md font-medium text-foreground mb-3">
                  {group.formattedDate}
                </h3>
                <div className="space-y-3">
                  {group.tasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task}
                      showAssignee={false}
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
