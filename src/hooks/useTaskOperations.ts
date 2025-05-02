
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCallback } from "react";

export const useTaskOperations = (taskId: string | undefined) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Helper function to translate text
  const translateText = async (text: string, targetLang: string) => {
    if (!text) return null;
    
    try {
      const response = await supabase.functions.invoke('translate', {
        body: { text, target: targetLang }
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      return response.data?.translations?.[0]?.translatedText || null;
    } catch (error) {
      console.error(`Translation error (${targetLang}):`, error);
      return null;
    }
  };

  // Use useCallback to memoize these functions and prevent unnecessary re-renders
  const handleStepComplete = useCallback(async (stepId: string, isCompleted: boolean) => {
    if (!taskId) return;
    
    try {
      const { error: stepError } = await supabase
        .from('task_steps')
        .update({ is_completed: isCompleted })
        .eq('id', stepId);
      
      if (stepError) throw stepError;

      // Optimistic update for better user experience
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      
      console.log(`Step ${stepId} marked as ${isCompleted ? 'completed' : 'not completed'}`);
    } catch (error) {
      console.error('Error updating task step:', error);
      toast({
        title: "Error",
        description: "Failed to update step status",
        variant: "destructive",
      });
    }
  }, [taskId, queryClient, toast]);
  
  const handleAddComment = useCallback(async (stepId: string, comment: string) => {
    if (!taskId || !comment) return;
    
    try {
      // Translate the comment to supported languages
      const [comment_hi, comment_kn] = await Promise.all([
        translateText(comment, 'hi'),
        translateText(comment, 'kn')
      ]);
      
      const { error } = await supabase
        .from('task_steps')
        .update({ comment, comment_hi, comment_kn })
        .eq('id', stepId);
      
      if (error) throw error;
      
      // Optimistic update for better user experience
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
        .update({ photo_url: photoUrl })
        .eq('id', stepId);
      
      if (error) throw error;
      
      // Optimistic update for better user experience
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

  const handleTaskStatusUpdate = useCallback(async (newStatus: 'completed' | 'inprogress' | 'pending') => {
    if (!taskId) return;

    try {
      const updateData = newStatus === 'completed' 
        ? { status: newStatus, completed_at: new Date().toISOString() }
        : { status: newStatus };

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);
      
      if (error) throw error;

      // For user feedback
      if (newStatus === 'completed') {
        toast({
          title: "Task Completed",
          description: "All steps have been completed",
        });
        
        // Use setTimeout to delay navigation until toast is visible
        setTimeout(() => {
          navigate('/tasks');
        }, 1500);
      }

      // Update the cache for both this task and the tasks list
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
