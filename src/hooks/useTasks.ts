
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Task } from "@/types";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";

export const useTasks = (isManager: boolean = false) => {
  const { user } = useUser();
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ["tasks", user?.id, isManager],
    queryFn: async (): Promise<Task[]> => {
      if (!user) return [];
      
      console.log("Fetching tasks for user:", user.id);
      
      let query = supabase
        .from("tasks")
        .select(`
          *,
          steps:task_steps(*),
          profiles:assigned_to(username)
        `)
        .order('created_at', { ascending: false });

      // If not a manager, only fetch tasks assigned to the user
      if (!isManager) {
        // Fix: Cast user.id to any to bypass type checking
        query = query.eq('assigned_to', user.id as any);
      }

      const { data: tasks, error } = await query;

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

      // Fix: Add type guard to ensure tasks is an array
      if (!Array.isArray(tasks)) {
        console.error("Expected tasks to be an array but got:", tasks);
        return [];
      }

      // Transform the data to match our Task type
      const transformedTasks = tasks.map(task => ({
        id: task.id,
        title: task.title,
        dueTime: task.due_time ? new Date(task.due_time).toLocaleString() : '',
        location: task.location || '',
        status: task.status,
        assignedTo: task.assigned_to,
        assigneeName: task.profiles?.username || 'Unassigned',
        createdAt: task.created_at,
        completedAt: task.completed_at,
        deadline: task.deadline,
        steps: (task.steps || []).map((step: any) => ({
          id: step.id,
          title: step.title,
          isCompleted: step.is_completed,
          requiresPhoto: step.requires_photo,
          comment: step.comment,
          photoUrl: step.photo_url,
          isOptional: step.is_optional || false
        }))
      }));

      return transformedTasks;
    },
    enabled: !!user?.id
  });
};
