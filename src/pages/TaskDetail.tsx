
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Task, TaskStep as TaskStepType } from "@/types";
import { useUser } from "@/context/UserContext";
import Header from "@/components/Header";
import TaskStatusBadge from "@/components/TaskStatusBadge";
import TaskStep from "@/components/TaskStep";
import { Clock, MapPin, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const TaskDetail = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const [loading, setLoading] = useState(true);
  const [allCompleted, setAllCompleted] = useState(false);
  const { userId, isAuthenticated } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        steps: task.steps.map((step: any): TaskStepType => ({
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

    if (task) {
      setAllCompleted(task.steps.every(step => step.isCompleted));
      setLoading(false);
    }
  }, [taskId, userId, isAuthenticated, navigate, task]);

  const handleStepComplete = async (stepId: string, isCompleted: boolean) => {
    if (!task) return;
    
    try {
      // Update the task step in Supabase
      const { error: stepError } = await supabase
        .from('task_steps')
        .update({ is_completed: isCompleted })
        .eq('id', stepId);
      
      if (stepError) throw stepError;

      // Check if all steps are completed after this update
      const updatedSteps = task.steps.map(s => 
        s.id === stepId ? { ...s, isCompleted } : s
      );
      const allStepsCompleted = updatedSteps.every(s => s.isCompleted);
      
      if (allStepsCompleted && task.status !== 'completed') {
        const { error: taskError } = await supabase
          .from('tasks')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', task.id);
        
        if (taskError) throw taskError;
        
        toast({
          title: "Task Completed",
          description: "All steps have been completed",
        });
        
        setTimeout(() => {
          navigate('/tasks');
        }, 2000);
      } else if (!allStepsCompleted && task.status === 'pending') {
        const { error: taskError } = await supabase
          .from('tasks')
          .update({ status: 'inprogress' })
          .eq('id', task.id);
        
        if (taskError) throw taskError;
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };
  
  const handleAddComment = async (stepId: string, comment: string) => {
    if (!task) return;
    
    try {
      const { error } = await supabase
        .from('task_steps')
        .update({ comment })
        .eq('id', stepId);
      
      if (error) throw error;
      
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
  };
  
  const handleAddPhoto = async (stepId: string, photoUrl: string) => {
    if (!task) return;
    
    try {
      const { error } = await supabase
        .from('task_steps')
        .update({ photo_url: photoUrl })
        .eq('id', stepId);
      
      if (error) throw error;
      
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
  };

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

  if (loading || !task) {
    return (
      <div className="h-screen flex flex-col">
        <Header showBackButton title="Task Details" />
        <div className="flex-1 flex items-center justify-center">
          <p>Loading task details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header showBackButton title={`${task.title} - ${task.location}`} />
      
      <div className="flex-1 overflow-y-auto pb-6">
        {/* Task header */}
        <div className="bg-white px-4 py-4 border-b">
          <div className="flex justify-between items-start">
            <h1 className="text-xl font-semibold">{task.title}</h1>
            <TaskStatusBadge status={task.status} />
          </div>
          
          <div className="mt-3 flex flex-wrap gap-y-2 gap-x-4">
            <div className="flex items-center text-gray-600">
              <Clock size={16} className="mr-1" />
              <span className="text-sm">Due {task.dueTime}</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <MapPin size={16} className="mr-1" />
              <span className="text-sm">{task.location}</span>
            </div>
          </div>
        </div>
        
        {/* Task steps */}
        <div className="bg-white mt-2 px-4">
          <h2 className="text-lg font-medium py-3 border-b">Steps to complete</h2>
          
          <div className="divide-y divide-gray-100">
            {task.steps.map(step => (
              <TaskStep 
                key={step.id} 
                step={step} 
                onComplete={handleStepComplete}
                onAddComment={handleAddComment}
                onAddPhoto={handleAddPhoto}
              />
            ))}
          </div>
          
          {/* Task completion status */}
          {task.status === 'completed' ? (
            <div className="mt-6 p-4 bg-green-50 rounded-md flex items-center">
              <CheckCircle className="text-green-600 mr-3" size={24} />
              <div>
                <p className="font-medium text-green-800">Task Completed</p>
                <p className="text-sm text-green-700">
                  All steps have been completed
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 p-4 bg-blue-50 rounded-md flex items-center">
              <AlertTriangle className="text-blue-600 mr-3" size={24} />
              <div>
                <p className="font-medium text-blue-800">Task Incomplete</p>
                <p className="text-sm text-blue-700">
                  {task.steps.filter(s => s.isCompleted).length} of {task.steps.length} steps completed
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
