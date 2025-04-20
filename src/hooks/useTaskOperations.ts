
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCallback } from "react";

export const useTaskOperations = (taskId: string | undefined) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Use useCallback to memoize these functions and prevent unnecessary re-renders
  const handleStepComplete = useCallback(async (stepId: string, isCompleted: boolean) => {
    if (!taskId) return;
    
    try {
      const { error: stepError } = await supabase
        .from('task_steps')
        .update({ is_completed: isCompleted } as any)
        .eq('id', stepId as any);
      
      if (stepError) throw stepError;

      // Use more specific invalidation to update only necessary data
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      // No need to invalidate all tasks if we're just updating a step
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  }, [taskId, queryClient, toast]);
  
  const handleAddComment = useCallback(async (stepId: string, comment: string) => {
    if (!taskId) return;
    
    try {
      const { error } = await supabase
        .from('task_steps')
        .update({ comment } as any)
        .eq('id', stepId as any);
      
      if (error) throw error;
      
      // Only invalidate the specific task that changed
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      
      toast({
        title: "Comment saved",
        description: "Your comment has been saved",
      });
    } catch (error) {
      console.error('Error saving comment:', error);
      toast({
        title: "Error",
        description: "Failed to save comment",
        variant: "destructive",
      });
    }
  }, [taskId, queryClient, toast]);
  
  const handleAddPhoto = useCallback(async (stepId: string, photoUrl: string) => {
    if (!taskId) return;
    
    try {
      const { error } = await supabase
        .from('task_steps')
        .update({ photo_url: photoUrl } as any)
        .eq('id', stepId as any);
      
      if (error) throw error;
      
      // Only invalidate the specific task that changed
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      
      toast({
        title: "Photo added",
        description: "Your photo has been uploaded",
      });
    } catch (error) {
      console.error('Error saving photo:', error);
      toast({
        title: "Error",
        description: "Failed to save photo",
        variant: "destructive",
      });
    }
  }, [taskId, queryClient, toast]);

  const handleTaskStatusUpdate = useCallback(async (newStatus: 'completed' | 'inprogress') => {
    if (!taskId) return;

    try {
      const updateData = newStatus === 'completed' 
        ? { status: newStatus, completed_at: new Date().toISOString() }
        : { status: newStatus };

      const { error } = await supabase
        .from('tasks')
        .update(updateData as any)
        .eq('id', taskId as any);
      
      if (error) throw error;

      if (newStatus === 'completed') {
        toast({
          title: "Task Completed",
          description: "All steps have been completed",
        });
        
        // Use setTimeout to delay navigation until toast is visible
        setTimeout(() => {
          navigate('/tasks');
        }, 1000);
      }

      // Batch update queries to reduce render cycles
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  }, [taskId, navigate, queryClient, toast]);

  return {
    handleStepComplete,
    handleAddComment,
    handleAddPhoto,
    handleTaskStatusUpdate,
  };
};
