
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Task } from "@/types";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";

export const useTasks = (isManager: boolean = false) => {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ["tasks", user?.id, isManager],
    queryFn: async (): Promise<Task[]> => {
      if (!user) return [];
      
      // Create a single query based on role to reduce redundant API calls
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
        query = query.eq('assigned_to', user.id as any);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching tasks:", error);
        toast({
          variant: "destructive",
          title: "Error loading tasks",
          description: error.message,
        });
        throw error;
      }

      // Handle empty data case more efficiently
      if (!data || !Array.isArray(data)) {
        return [];
      }

      // Transform the data once and reuse to avoid repeated transformations
      return data.map((task: any) => ({
        id: task.id,
        title: task.title,
        title_hi: task.title_hi,
        title_kn: task.title_kn,
        dueTime: task.due_time ? new Date(task.due_time).toLocaleString() : '',
        location: task.location || '',
        location_hi: task.location_hi,
        location_kn: task.location_kn,
        status: task.status,
        assignedTo: task.assigned_to,
        assigneeName: task.profiles?.username || 'Unassigned',
        createdAt: task.created_at,
        completedAt: task.completed_at,
        deadline: task.deadline,
        steps: (task.steps || []).map((step: any) => ({
          id: step.id,
          title: step.title,
          title_hi: step.title_hi,
          title_kn: step.title_kn,
          isCompleted: step.is_completed,
          requiresPhoto: step.requires_photo,
          comment: step.comment,
          comment_hi: step.comment_hi,
          comment_kn: step.comment_kn,
          photoUrl: step.photo_url,
          isOptional: step.is_optional || false
        }))
      }));
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60, // Cache data for 1 minute before refetching
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: true // But do refetch when component mounts
  });
};
