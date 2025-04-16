
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { useRole } from "@/hooks/useRole";
import Header from "@/components/Header";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import TaskCard from "@/components/TaskCard";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Task } from "@/types";

const ManagerDashboard = () => {
  const { isAuthenticated } = useUser();
  const { isManager } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }

    if (!isManager) {
      navigate("/tasks");
      return;
    }
  }, [isAuthenticated, isManager, navigate]);

  const { data: tasks, error, isLoading } = useQuery({
    queryKey: ["all-tasks"],
    queryFn: async () => {
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select(`
          *,
          steps:task_steps(*)
        `)
        .order('deadline', { ascending: true });

      if (error) throw error;
      
      return tasks.map((task: any): Task => ({
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

  if (error) return <ErrorState error={error} title="Manager Dashboard" />;
  if (isLoading) return <LoadingState title="Manager Dashboard" />;

  const delayedTasks = tasks?.filter(task => 
    task.status !== 'completed' && 
    task.deadline && 
    new Date(task.deadline) < new Date()
  ) || [];

  return (
    <div className="h-screen flex flex-col">
      <Header title="Manager Dashboard" showBackButton={false} />
      
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900">Task Overview</h2>
          <Button onClick={() => navigate("/tasks/create")} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>

        {delayedTasks.length > 0 && (
          <div className="mb-6">
            <h3 className="text-red-600 font-medium mb-3">
              Delayed Tasks ({delayedTasks.length})
            </h3>
            <div className="space-y-3">
              {delayedTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="font-medium mb-3">All Tasks</h3>
          <div className="space-y-3">
            {tasks?.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
