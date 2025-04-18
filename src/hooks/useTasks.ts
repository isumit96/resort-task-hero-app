
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Task, TaskStep } from "@/types";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";

export const useTasks = () => {
  const { user } = useUser();
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: async (): Promise<Task[]> => {
      if (!user) return [];
      
      console.log("Fetching tasks for user:", user.id);
      
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select(`
          *,
          steps:task_steps(*)
        `)
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching tasks:", error);
        toast({
          variant: "destructive",
          title: "Error loading tasks",
          description: error.message,
        });
        throw error;
      }

      console.log("Tasks returned from database:", tasks);

      return tasks.map(task => ({
        id: task.id,
        title: task.title,
        dueTime: new Date(task.due_time).toLocaleString(),
        location: task.location,
        status: task.status,
        assignedTo: task.assigned_to,
        createdAt: task.created_at,
        completedAt: task.completed_at,
        deadline: task.deadline ? new Date(task.deadline).toLocaleString() : undefined,
        steps: task.steps.map((step: any): TaskStep => ({
          id: step.id,
          title: step.title,
          isCompleted: step.is_completed,
          requiresPhoto: step.requires_photo,
          comment: step.comment,
          photoUrl: step.photo_url,
          isOptional: step.is_optional
        }))
      }));
    },
    enabled: !!user?.id
  });
};
