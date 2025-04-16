
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import Header from "@/components/Header";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import TaskHeader from "@/components/TaskHeader";
import TaskStepsList from "@/components/TaskStepsList";
import TaskStatus from "@/components/TaskStatus";
import { useTaskOperations } from "@/hooks/useTaskOperations";
import type { Task } from "@/types";

const TaskDetail = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { isAuthenticated } = useUser();
  const navigate = useNavigate();
  const { handleStepComplete, handleAddComment, handleAddPhoto, handleTaskStatusUpdate } = useTaskOperations(taskId);

  const { data: task, error } = useQuery({
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
        dueTime: new Date(task.due_time).toLocaleString(),
        location: task.location,
        status: task.status,
        assignedTo: task.assigned_to,
        createdAt: task.created_at,
        completedAt: task.completed_at,
        steps: task.steps.map((step: any) => ({
          id: step.id,
          title: step.title,
          isCompleted: step.is_completed,
          requiresPhoto: step.requires_photo,
          comment: step.comment,
          photoUrl: step.photo_url
        }))
      };
    }
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
    if (task?.steps.every(step => step.isCompleted) && task.status !== 'completed') {
      handleTaskStatusUpdate('completed');
    } else if (task?.steps.some(step => step.isCompleted) && task.status === 'pending') {
      handleTaskStatusUpdate('inprogress');
    }
  }, [task?.steps, task?.status]);

  if (error) {
    return (
      <div className="h-screen flex flex-col">
        <Header showBackButton title="Task Details" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-red-600">
            <p>Error loading task</p>
            <p className="text-sm">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="h-screen flex flex-col">
        <Header showBackButton title="Task Details" />
        <div className="flex-1 flex items-center justify-center">
          <p>Loading task details...</p>
        </div>
      </div>
    );
  }

  const completedSteps = task.steps.filter(s => s.isCompleted).length;

  return (
    <div className="flex flex-col h-screen">
      <Header showBackButton title={`${task.title} - ${task.location}`} />
      
      <div className="flex-1 overflow-y-auto pb-6">
        <TaskHeader task={task} />
        
        <TaskStepsList
          steps={task.steps}
          onComplete={handleStepComplete}
          onAddComment={handleAddComment}
          onAddPhoto={handleAddPhoto}
        />
        
        <div className="px-4">
          <TaskStatus
            status={task.status}
            completedSteps={completedSteps}
            totalSteps={task.steps.length}
          />
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
