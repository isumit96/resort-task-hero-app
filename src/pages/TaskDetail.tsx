
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Task, TaskStep as TaskStepType } from "@/types";
import { useUser } from "@/context/UserContext";
import { getTaskById, updateTaskStatus, updateTaskStep } from "@/data/mockData";
import Header from "@/components/Header";
import TaskStatusBadge from "@/components/TaskStatusBadge";
import TaskStep from "@/components/TaskStep";
import { Clock, MapPin, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TaskDetail = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [allCompleted, setAllCompleted] = useState(false);
  const { userId, isAuthenticated } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }

    if (!taskId) {
      navigate("/tasks");
      return;
    }

    // Simulate loading data
    const timer = setTimeout(() => {
      const fetchedTask = getTaskById(taskId);
      if (fetchedTask) {
        setTask(fetchedTask);
        setAllCompleted(fetchedTask.steps.every(step => step.isCompleted));
      } else {
        toast({
          title: "Task not found",
          description: "The requested task could not be found",
          variant: "destructive",
        });
        navigate("/tasks");
      }
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [taskId, userId, isAuthenticated, navigate, toast]);

  const handleStepComplete = (stepId: string, isCompleted: boolean) => {
    if (!task) return;
    
    // Update the task step in our mock data
    updateTaskStep(task.id, stepId, isCompleted);
    
    // Update the local state
    const updatedTask = {...task};
    const stepIndex = updatedTask.steps.findIndex(s => s.id === stepId);
    if (stepIndex !== -1) {
      updatedTask.steps[stepIndex].isCompleted = isCompleted;
    }
    
    // Check if all steps are completed
    const allStepsCompleted = updatedTask.steps.every(s => s.isCompleted);
    
    // Update task status if needed
    if (allStepsCompleted && updatedTask.status !== 'completed') {
      updatedTask.status = 'completed';
      updatedTask.completedAt = new Date().toISOString();
      updateTaskStatus(task.id, 'completed');
      
      toast({
        title: "Task Completed",
        description: "All steps have been completed",
      });
      
      // Navigate back to task list after short delay
      setTimeout(() => {
        navigate('/tasks');
      }, 2000);
    } else if (!allStepsCompleted && updatedTask.status === 'pending') {
      updatedTask.status = 'inprogress';
      updateTaskStatus(task.id, 'inprogress');
    }
    
    setTask(updatedTask);
    setAllCompleted(allStepsCompleted);
  };
  
  const handleAddComment = (stepId: string, comment: string) => {
    if (!task) return;
    
    // Update the task step in our mock data
    updateTaskStep(task.id, stepId, true, comment);
    
    // Update the local state
    const updatedTask = {...task};
    const stepIndex = updatedTask.steps.findIndex(s => s.id === stepId);
    if (stepIndex !== -1) {
      updatedTask.steps[stepIndex].comment = comment;
    }
    setTask(updatedTask);
    
    toast({
      title: "Comment saved",
      description: "Your comment has been saved",
    });
  };
  
  const handleAddPhoto = (stepId: string, photoUrl: string) => {
    if (!task) return;
    
    // Update the task step in our mock data
    updateTaskStep(task.id, stepId, true, undefined, photoUrl);
    
    // Update the local state
    const updatedTask = {...task};
    const stepIndex = updatedTask.steps.findIndex(s => s.id === stepId);
    if (stepIndex !== -1) {
      updatedTask.steps[stepIndex].photoUrl = photoUrl;
    }
    setTask(updatedTask);
    
    toast({
      title: "Photo added",
      description: "Your photo has been uploaded",
    });
  };

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
