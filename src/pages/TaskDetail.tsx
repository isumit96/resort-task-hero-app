
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

const TaskDetail = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { isAuthenticated } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { handleStepComplete, handleAddComment, handleAddPhoto, handleTaskStatusUpdate } = useTaskOperations(taskId);
  const [allRequiredStepsCompleted, setAllRequiredStepsCompleted] = useState(false);
  const { t, i18n } = useTranslation();

  const { data: task, error, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: async (): Promise<Task | null> => {
      if (!taskId) throw new Error("No task ID provided");

      const { data: task, error } = await supabase
        .from("tasks")
        .select(`
          *,
          steps:task_steps(*)
        `)
        .eq('id', taskId)
        .single();

      if (error) throw error;
      if (!task) return null;

      return {
        id: task.id,
        title: task.title,
        title_hi: task.title_hi,
        title_kn: task.title_kn,
        dueTime: new Date(task.due_time).toISOString(),
        location: task.location,
        location_hi: task.location_hi,
        location_kn: task.location_kn,
        status: task.status,
        assignedTo: task.assigned_to,
        createdAt: task.created_at,
        completedAt: task.completed_at,
        steps: task.steps.map((step: any) => ({
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
          isOptional: step.is_optional || false,
          interactionType: step.interaction_type || 'checkbox'
        }))
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

  if (isLoading || !task) {
    return <LoadingState title={t('tasks.taskDetails')} />;
  }

  if (error) {
    return <ErrorState error={error} title={t('tasks.taskDetails')} />;
  }

  // Get localized title based on current language
  const getLocalizedText = (baseText: string, hiText?: string | null, knText?: string | null) => {
    if (i18n.language === 'hi' && hiText) {
      return hiText;
    }
    if (i18n.language === 'kn' && knText) {
      return knText;
    }
    return baseText;
  };

  const title = getLocalizedText(task.title, task.title_hi, task.title_kn);
  const completedSteps = task.steps.filter(s => s.isCompleted === true).length;
  const isCompleted = task.status === 'completed';

  return (
    <div className="flex flex-col h-screen bg-background dark:bg-background">
      <Header showBackButton title={title} />
      
      <div className="flex-1 overflow-y-auto pb-24 bg-background dark:bg-background">
        <TaskHeader task={task} />
        
        <TaskStepsList
          steps={task.steps}
          onComplete={handleStepComplete}
          onAddComment={handleAddComment}
          onAddPhoto={handleAddPhoto}
          isTaskCompleted={isCompleted}
        />
        
        <div className="px-4 py-6 bg-background dark:bg-background">
          <TaskStatus
            status={task.status}
            completedSteps={completedSteps}
            totalSteps={task.steps.length}
          />
        
          {!isCompleted && (
            <div className="mt-6 bg-background dark:bg-background">
              <Button 
                className={`
                  w-full py-6 text-base shadow-lg transition-all duration-300 rounded-lg
                  ${allRequiredStepsCompleted 
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-primary/25' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/90'}
                `}
                disabled={!allRequiredStepsCompleted}
                onClick={handleMarkComplete}
                type="button"
                size="default"
              >
                <CheckCircle2 className="mr-2" size={22} />
                {t('tasks.markComplete')}
              </Button>
              {!allRequiredStepsCompleted && (
                <p className="text-sm text-muted-foreground dark:text-muted-foreground/80 mt-3 text-center">
                  {t('tasks.completeRequiredSteps')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="h-16 bg-background dark:bg-background" />
      <BottomNavigation />
    </div>
  );
};

export default TaskDetail;
