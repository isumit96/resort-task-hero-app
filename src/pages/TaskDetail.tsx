
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import Header from "@/components/Header";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import TaskHeader from "@/components/TaskHeader";
import TaskStepsList from "@/components/TaskStepsList";
import TaskStatus from "@/components/TaskStatus";
import { useTaskOperations } from "@/hooks/useTaskOperations";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import BottomNavigation from "@/components/BottomNavigation";
import type { Task } from "@/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import TaskDescription from "@/components/TaskDescription";

const TaskDetail = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { isAuthenticated } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { handleStepComplete, handleAddComment, handleAddPhoto, handleTaskStatusUpdate } = useTaskOperations(taskId);
  const [allRequiredStepsCompleted, setAllRequiredStepsCompleted] = useState(false);
  const { t, i18n } = useTranslation();

  const { data: task, error, isLoading } = useQuery({
    queryKey: ["task", taskId, i18n.language], // Add language as dependency to refetch when language changes
    queryFn: async (): Promise<Task | null> => {
      if (!taskId) throw new Error(t("tasks.noTaskId"));

      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .select(`
          *,
          steps:task_steps(*)
        `)
        .eq('id', taskId)
        .single();

      if (taskError) throw taskError;
      if (!task) return null;

      // Create translation keys for this task
      const titleKey = `tasks.${task.id}.title`;
      const locationKey = `tasks.${task.id}.location`;
      const descriptionKey = `tasks.${task.id}.description`;

      console.log('Fetching task data with language:', i18n.language);
      console.log('Task ID being fetched:', task.id);

      return {
        id: task.id,
        title: task.title,
        titleKey, // Include translation key
        dueTime: new Date(task.due_time).toISOString(),
        location: task.location || '',
        locationKey, // Include translation key
        status: task.status,
        assignedTo: task.assigned_to,
        createdAt: task.created_at,
        completedAt: task.completed_at,
        deadline: task.deadline,
        description: task.description || '',
        descriptionKey,
        photoUrl: task.photo_url,
        videoUrl: task.video_url,
        steps: (task.steps || []).map((step: any) => {
          const stepTitleKey = `tasks.${task.id}.step.${step.id}.title`;
          const stepCommentKey = step.comment ? `tasks.${task.id}.step.${step.id}.comment` : undefined;
          
          return {
            id: step.id,
            title: step.title, // Original title from DB
            titleKey: stepTitleKey,
            isCompleted: step.is_completed,
            requiresPhoto: step.requires_photo,
            comment: step.comment,
            commentKey: stepCommentKey,
            photoUrl: step.photo_url,
            isOptional: step.is_optional || false,
            interactionType: step.interaction_type || 'checkbox'
          };
        })
      };
    },
    staleTime: 1000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }

    if (!taskId) {
      navigate("/tasks");
      return;
    }
  }, [taskId, isAuthenticated, navigate]);

  useEffect(() => {
    if (!task) return;

    const requiredSteps = task.steps.filter(step => !step.isOptional);
    const requiredStepsCompleted = requiredSteps.every(step => {
      if (step.interactionType === "yes_no") {
        return typeof step.isCompleted === "boolean";
      }
      return step.isCompleted !== null && step.isCompleted !== undefined && !!step.isCompleted;
    });

    setAllRequiredStepsCompleted(requiredStepsCompleted);

    if (task.steps.every(step => (typeof step.isCompleted === "boolean" && step.isCompleted === true)) && task.status !== 'completed') {
      handleTaskStatusUpdate('inprogress');
    } else if (task.steps.some(step => step.isCompleted) && task.status === 'pending') {
      handleTaskStatusUpdate('inprogress');
    }
  }, [task?.steps, task?.status, handleTaskStatusUpdate]);

  const handleMarkComplete = () => {
    if (!task) return;
    
    if (!allRequiredStepsCompleted) {
      toast({
        title: t('tasks.cannotCompleteTask'),
        description: t('tasks.completeRequiredSteps'),
        variant: "destructive"
      });
      return;
    }
    
    handleTaskStatusUpdate('completed');
    toast({
      title: t('tasks.taskCompleted'),
      description: t('tasks.allStepsCompleted'),
    });
  };

  const handleDescriptionChange = () => {
    // This would be implemented if editing task descriptions was a feature
    console.log("Description change not implemented yet");
  };

  const handlePhotoUpload = () => {
    // This would be implemented if uploading photos to tasks was a feature
    console.log("Photo upload not implemented yet");
  };

  const handleVideoUpload = () => {
    // This would be implemented if uploading videos to tasks was a feature
    console.log("Video upload not implemented yet");
  };

  if (isLoading || !task) {
    return <LoadingState title={t('tasks.taskDetails')} />;
  }

  if (error) {
    return <ErrorState error={error} title={t('tasks.taskDetails')} />;
  }

  return (
    <div className="flex flex-col h-screen bg-background dark:bg-[#121212]">
      <Header showBackButton title={t('tasks.taskDetails')} />
      
      <div className="flex-1 overflow-y-auto pb-24 bg-background dark:bg-[#121212]">
        <TaskHeader task={task} />
        
        {task.description && (
          <div className="px-4 py-4 bg-card border-b border-border">
            <TaskDescription
              description={task.description}
              descriptionKey={task.descriptionKey}
              onDescriptionChange={handleDescriptionChange}
              onPhotoUpload={handlePhotoUpload}
              onVideoUpload={handleVideoUpload}
              photoUrl={task.photoUrl}
              videoUrl={task.videoUrl}
            />
          </div>
        )}
        
        <TaskStepsList
          steps={task.steps}
          onComplete={handleStepComplete}
          onAddComment={handleAddComment}
          onAddPhoto={handleAddPhoto}
        />
        
        <div className="px-4 py-4 bg-background dark:bg-[#121212]">
          <TaskStatus
            status={task.status}
            completedSteps={task.steps.filter(s => s.isCompleted === true).length}
            totalSteps={task.steps.length}
          />
        
          {task.status !== 'completed' && (
            <div className="mt-6 bg-background dark:bg-[#121212]">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="w-full">
                      <Button 
                        className="w-full py-6 text-base shadow-lg hover:shadow-primary/25 transition-all duration-300 animate-fade-in hover:bg-primary/90" 
                        disabled={!allRequiredStepsCompleted}
                        onClick={handleMarkComplete}
                        type="button"
                        variant="default"
                        size="default"
                      >
                        <CheckCircle2 className="mr-2" />
                        {t('tasks.markComplete')}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!allRequiredStepsCompleted && (
                    <TooltipContent>
                      <p>{t('tasks.completeRequiredSteps')}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              {!allRequiredStepsCompleted && (
                <p className="text-sm text-muted-foreground dark:text-muted-foreground/80 mt-2 text-center">
                  {t('tasks.completeRequiredSteps')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="h-16 bg-background dark:bg-[#121212]" />
      <BottomNavigation />
    </div>
  );
};

export default TaskDetail;
