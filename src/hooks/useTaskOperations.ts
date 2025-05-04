import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCallback, useState } from "react";
import { uploadFileToStorage, blobUrlToFile } from "@/utils/storage";

export const useTaskOperations = (taskId: string | undefined) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [previousStatus, setPreviousStatus] = useState<'completed' | 'inprogress' | 'pending' | null>(null);
  const [hasInteractions, setHasInteractions] = useState<boolean>(false);

  // Check if there are any interactions in the task steps
  const checkForInteractions = useCallback(async () => {
    if (!taskId) return false;
    
    try {
      // Get the current task from Supabase
      const { data: steps, error } = await supabase
        .from('task_steps')
        .select('is_completed, comment, photo_url')
        .eq('task_id', taskId);
      
      if (error) throw error;
      
      // Check for any interactions
      const hasActiveInteractions = steps.some(step => 
        step.is_completed === true || 
        (step.comment && step.comment.trim() !== '') || 
        step.photo_url
      );
      
      return hasActiveInteractions;
    } catch (error) {
      console.error('Error checking interactions:', error);
      return false;
    }
  }, [taskId]);
  
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

  const handleStepComplete = useCallback(async (stepId: string, isCompleted: boolean) => {
    if (!taskId) return;
    
    try {
      // Get current task status before updating
      const { data: task } = await supabase
        .from('tasks')
        .select('status')
        .eq('id', taskId)
        .single();
      
      // Only save the previous status once when transitioning from pending to inprogress
      if (task && task.status === 'pending' && !previousStatus) {
        setPreviousStatus('pending');
      }
      
      // Mark that we have interactions
      if (isCompleted) {
        setHasInteractions(true);
      }
      
      const { error: stepError } = await supabase
        .from('task_steps')
        .update({ is_completed: isCompleted })
        .eq('id', stepId);
      
      if (stepError) throw stepError;

      // If a step is completed and task is pending, update task status to inprogress
      if (isCompleted && task && task.status === 'pending') {
        await handleTaskStatusUpdate('inprogress');
      }

      // Optimistic update for better user experience
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      
      console.log(`Step ${stepId} marked as ${isCompleted ? 'completed' : 'not completed'}`);
      
      // Check if all interactions have been removed when unchecking
      if (!isCompleted) {
        const hasActiveInteractions = await checkForInteractions();
        if (!hasActiveInteractions && previousStatus === 'pending') {
          await handleTaskStatusUpdate('pending');
          setPreviousStatus(null);
          setHasInteractions(false);
        }
      }
    } catch (error) {
      console.error('Error updating task step:', error);
      toast({
        title: "Error",
        description: "Failed to update step status",
        variant: "destructive",
      });
    }
  }, [taskId, queryClient, toast, previousStatus, checkForInteractions, handleTaskStatusUpdate]);
  
  const handleAddComment = useCallback(async (stepId: string, comment: string) => {
    if (!taskId) return;
    
    try {
      // Get current task status before updating
      const { data: task } = await supabase
        .from('tasks')
        .select('status')
        .eq('id', taskId)
        .single();
      
      // Only save the previous status once when transitioning from pending to inprogress
      if (task && task.status === 'pending' && comment.trim() !== '' && !previousStatus) {
        setPreviousStatus('pending');
      }
      
      // If comment is added, we have interactions
      if (comment.trim() !== '') {
        setHasInteractions(true);
      }
      
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
      
      // If a comment is added, update task status to inprogress
      if (comment.trim() !== '' && task && task.status === 'pending') {
        await handleTaskStatusUpdate('inprogress');
      }
      
      // Optimistic update for better user experience
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      
      toast({
        title: "Comment saved",
        description: "Your comment has been saved",
      });
      
      // Check if all interactions have been removed
      if (comment.trim() === '') {
        const hasActiveInteractions = await checkForInteractions();
        if (!hasActiveInteractions && previousStatus === 'pending') {
          await handleTaskStatusUpdate('pending');
          setPreviousStatus(null);
          setHasInteractions(false);
        }
      }
    } catch (error) {
      console.error('Error saving comment:', error);
      toast({
        title: "Error",
        description: "Failed to save comment",
        variant: "destructive",
      });
    }
  }, [taskId, queryClient, toast, previousStatus, checkForInteractions, handleTaskStatusUpdate]);
  
  const handleAddPhoto = useCallback(async (stepId: string, fileOrUrl: File | string) => {
    if (!taskId) return;
    
    try {
      console.log(`Starting photo upload process for step ${stepId}`);
      
      // Get current task status before updating
      const { data: task } = await supabase
        .from('tasks')
        .select('status')
        .eq('id', taskId)
        .single();
      
      // Process different input types: either a File or a URL string
      let photoUrl = '';
      
      if (fileOrUrl instanceof File) {
        console.log(`Received File object: ${fileOrUrl.name} (${Math.round(fileOrUrl.size/1024)}KB)`);
        
        // Upload the file to storage and get the URL
        photoUrl = await uploadFileToStorage(fileOrUrl, 'task-photos');
        console.log(`File uploaded, photoUrl: ${photoUrl}`);
      } else if (typeof fileOrUrl === 'string') {
        // If it's already a URL (like blob:// or https://)
        console.log(`Received URL directly: ${fileOrUrl}`);
        
        // If it's a local blob URL, we need to fetch and reupload
        if (fileOrUrl.startsWith('blob:')) {
          console.log('Converting blob URL to file for persistent storage...');
          try {
            // Convert blob URL to File object
            const file = await blobUrlToFile(fileOrUrl, `photo_${Date.now()}.jpg`);
            
            // Upload the file
            photoUrl = await uploadFileToStorage(file, 'task-photos');
            console.log(`Converted blob and uploaded, new photoUrl: ${photoUrl}`);
          } catch (error) {
            console.error('Failed to convert blob URL:', error);
            throw new Error('Failed to process image from camera');
          }
        } else if (fileOrUrl === "") {
          // Handle removal case
          console.log('Empty URL input, treating as photo removal');
          photoUrl = '';
        } else {
          // If it's already a proper URL, keep it
          photoUrl = fileOrUrl;
          console.log(`Using existing URL: ${photoUrl}`);
        }
      } else if (!fileOrUrl) {
        // Handle removal case
        console.log('Empty input, treating as photo removal');
        photoUrl = '';
      }
      
      // Only save the previous status once when transitioning from pending to inprogress
      if (task && task.status === 'pending' && photoUrl && !previousStatus) {
        setPreviousStatus('pending');
      }
      
      // If photo is added, we have interactions
      if (photoUrl) {
        setHasInteractions(true);
      }
      
      console.log(`Updating database with photoUrl: ${photoUrl}`);
      const { error } = await supabase
        .from('task_steps')
        .update({ photo_url: photoUrl })
        .eq('id', stepId);
      
      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('Database updated successfully');
      
      // If a photo is added, update task status to inprogress
      if (photoUrl && task && task.status === 'pending') {
        await handleTaskStatusUpdate('inprogress');
      }
      
      // Optimistic update for better user experience
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      
      if (photoUrl) {
        toast({
          title: "Photo added",
          description: "Your photo has been uploaded"
        });
      } else {
        toast({
          title: "Photo removed",
          description: "Your photo has been removed"
        });
      }
      
      // Check if all interactions have been removed
      if (!photoUrl) {
        const hasActiveInteractions = await checkForInteractions();
        if (!hasActiveInteractions && previousStatus === 'pending') {
          await handleTaskStatusUpdate('pending');
          setPreviousStatus(null);
          setHasInteractions(false);
        }
      }
    } catch (error) {
      console.error('Error saving photo:', error);
      toast({
        title: "Error",
        description: "Failed to save photo",
        variant: "destructive"
      });
    }
  }, [taskId, queryClient, toast, previousStatus, checkForInteractions, handleTaskStatusUpdate]);

  return {
    handleStepComplete,
    handleAddComment,
    handleAddPhoto,
    handleTaskStatusUpdate,
  };
};
