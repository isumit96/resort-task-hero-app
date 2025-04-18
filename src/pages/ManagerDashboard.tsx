
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { useRole } from "@/hooks/useRole";
import Header from "@/components/Header";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Task } from "@/types";
import BottomNavigation from "@/components/BottomNavigation";
import DelayedTasksAlert from "@/components/DelayedTasksAlert";
import TaskTabs from "@/components/TaskTabs";

const ManagerDashboard = () => {
  const { isAuthenticated } = useUser();
  const { isManager } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      console.log("Not authenticated, redirecting to login");
      navigate("/");
      return;
    }

    if (!isManager) {
      console.log("Not a manager, redirecting to tasks page");
      navigate("/tasks");
      return;
    }
    
    console.log("Manager authenticated and authorized");
  }, [isAuthenticated, isManager, navigate]);

  const { data: tasks, error, isLoading } = useQuery({
    queryKey: ["all-tasks"],
    queryFn: async () => {
      console.log("Fetching all tasks for manager view");
      
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select(`
          *,
          steps:task_steps(*),
          profiles:assigned_to(username, role)
        `)
        .order('deadline', { ascending: true });

      if (error) {
        console.error("Error fetching tasks:", error);
        throw error;
      }
      
      console.log("Tasks fetched successfully for manager:", tasks);
      
      // Transform the data to match our Task type
      const transformedTasks = tasks.map((task: any): Task => ({
        id: task.id,
        title: task.title,
        dueTime: new Date(task.due_time).toLocaleString(),
        location: task.location || '',
        status: task.status,
        assignedTo: task.assigned_to,
        assigneeName: task.profiles?.username || 'Unassigned',
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
          isOptional: step.is_optional || false
        }))
      }));
      
      console.log("Transformed tasks for manager view:", transformedTasks);
      
      return transformedTasks;
    }
  });

  if (error) return <ErrorState error={error} title="Manager Dashboard" />;
  if (isLoading) return <LoadingState title="Manager Dashboard" />;

  const delayedTasks = tasks?.filter(task => 
    task.status !== 'completed' && 
    task.deadline && 
    new Date(task.deadline) < new Date()
  ) || [];

  const completedTasks = tasks?.filter(task => task.status === 'completed') || [];
  const pendingTasks = tasks?.filter(task => task.status !== 'completed' && !delayedTasks.includes(task)) || [];

  return (
    <div className="min-h-screen bg-background">
      <Header title="Manager Dashboard" showBackButton={false} />
      
      <main className="container mx-auto px-4 py-6 pb-20 max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Task Management</h1>
          <Button 
            onClick={() => navigate("/tasks/create")}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>

        <DelayedTasksAlert count={delayedTasks.length} />
        
        <TaskTabs 
          pendingTasks={pendingTasks}
          delayedTasks={delayedTasks}
          completedTasks={completedTasks}
          showAssignee={true}
        />
      </main>
      
      <div className="h-16" />
      <BottomNavigation />
    </div>
  );
};

export default ManagerDashboard;
