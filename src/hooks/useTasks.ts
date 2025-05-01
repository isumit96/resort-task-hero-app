
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Task } from "@/types";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export const useTasks = (isManager: boolean = false) => {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  
  return useQuery({
    queryKey: ["tasks", user?.id, isManager, i18n.language],
    queryFn: async (): Promise<Task[]> => {
      if (!user) return [];
      
      let query = supabase
        .from("tasks")
        .select(`
          *,
          steps:task_steps(*),
          profiles:assigned_to(username)
        `)
        .order('created_at', { ascending: false });

      if (!isManager) {
        query = query.eq('assigned_to', user.id as any);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching tasks:", error);
        toast({
          variant: "destructive",
          title: t("errors.loadingTasks"),
          description: error.message,
        });
        throw error;
      }

      if (!data || !Array.isArray(data)) {
        return [];
      }

      console.log('Current language:', i18n.language);
      
      // Process tasks and prepare for translation
      return data.map((task: any) => {
        // Generate translation keys based on task ID
        const titleKey = `tasks.${task.id}.title`;
        const locationKey = `tasks.${task.id}.location`;
        
        return {
          id: task.id,
          title: task.title, // Original title from DB
          titleKey, // Translation key for this specific task
          dueTime: task.due_time ? new Date(task.due_time).toLocaleString() : '',
          location: task.location || '',
          locationKey, // Translation key for the location
          status: task.status,
          assignedTo: task.assigned_to,
          assigneeName: task.profiles?.username || t('tasks.unassigned'),
          createdAt: task.created_at,
          completedAt: task.completed_at,
          deadline: task.deadline,
          steps: (task.steps || []).map((step: any) => {
            const stepTitleKey = `tasks.${task.id}.step.${step.id}.title`;
            const stepCommentKey = step.comment ? `tasks.${task.id}.step.${step.id}.comment` : undefined;
            
            return {
              id: step.id,
              title: step.title, // Original title from DB
              titleKey: stepTitleKey, // Translation key for this step
              isCompleted: step.is_completed,
              requiresPhoto: step.requires_photo,
              comment: step.comment,
              commentKey: stepCommentKey, // Translation key for the comment
              photoUrl: step.photo_url,
              isOptional: step.is_optional || false,
              interactionType: step.interaction_type || 'checkbox'
            };
          })
        };
      });
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });
};
