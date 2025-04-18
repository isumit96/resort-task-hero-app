import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { useRole } from "@/hooks/useRole";
import Header from "@/components/Header";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, History, ListTodo, Clock, MapPin } from "lucide-react";
import type { Task } from "@/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import BottomNavigation from "@/components/BottomNavigation";

const ManagerDashboard = () => {
  const { isAuthenticated } = useUser();
  const { isManager } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }

    if (!isManager) {
      navigate("/tasks");
      return;
    }
  }, [isAuthenticated, isManager, navigate]);

  const { data: tasks, error, isLoading } = useQuery({
    queryKey: ["all-tasks"],
    queryFn: async () => {
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select(`
          *,
          steps:task_steps(*)
        `)
        .order('deadline', { ascending: true });

      if (error) throw error;
      
      return tasks.map((task: any): Task => ({
        id: task.id,
        title: task.title,
        dueTime: new Date(task.due_time).toLocaleString(),
        location: task.location,
        status: task.status,
        assignedTo: task.assigned_to,
        createdAt: task.created_at,
        completedAt: task.completed_at,
        deadline: task.deadline ? new Date(task.deadline).toLocaleString() : undefined,
        steps: task.steps.map((step: any) => ({
          id: step.id,
          title: step.title,
          isCompleted: step.is_completed,
          requiresPhoto: step.requires_photo,
          comment: step.comment,
          photoUrl: step.photo_url,
          isOptional: step.is_optional
        }))
      }));
    }
  });

  if (error) return <ErrorState error={error} title="Manager Dashboard" />;
  if (isLoading) return <LoadingState title="Manager Dashboard" />;

  const delayedTasks = tasks?.filter(task => 
    task.status !== 'completed' && 
    task.deadline && 
    new Date(task.deadline) < new Date()
  ) || [];

  const completedTasks = tasks?.filter(task => task.status === 'completed') || [];
  const pendingTasks = tasks?.filter(task => task.status !== 'completed' && !delayedTasks.includes(task)) || [];

  const handleOpenTask = (taskId: string) => {
    navigate(`/task/${taskId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Manager Dashboard" showBackButton={false} />
      
      <main className="container mx-auto px-4 py-6 pb-20 max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Task Management</h1>
          <Button 
            onClick={() => navigate("/tasks/create")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>

        {delayedTasks.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              There {delayedTasks.length === 1 ? 'is' : 'are'} {delayedTasks.length} delayed {delayedTasks.length === 1 ? 'task' : 'tasks'} that need attention
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Active Tasks
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Task History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Pending Tasks</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    {pendingTasks.length}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {pendingTasks.map(task => (
                    <div key={task.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
                      <div className="p-4">
                        <h3 className="font-medium text-lg">{task.title}</h3>
                        <div className="mt-2 flex items-center text-gray-600 text-sm">
                          <Clock size={14} className="mr-1" />
                          <span>Due {task.dueTime}</span>
                        </div>
                        <div className="mt-1 flex items-center text-gray-500 text-sm">
                          <MapPin size={14} className="mr-1" />
                          <span>{task.location}</span>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 border-t">
                        <Button 
                          variant="outline"
                          className="w-full bg-blue-50 text-blue-500 border-blue-100 hover:bg-blue-100"
                          onClick={() => handleOpenTask(task.id)}
                        >
                          Open Task
                        </Button>
                      </div>
                    </div>
                  ))}
                  {pendingTasks.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No pending tasks</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Delayed Tasks</h2>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-sm font-medium",
                    delayedTasks.length > 0 ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                  )}>
                    {delayedTasks.length}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {delayedTasks.map(task => (
                    <div key={task.id} className="rounded-lg border border-red-200 bg-white overflow-hidden shadow-sm">
                      <div className="p-4">
                        <h3 className="font-medium text-lg">{task.title}</h3>
                        <div className="mt-2 flex items-center text-red-500 text-sm">
                          <Clock size={14} className="mr-1" />
                          <span>Deadline crossed {getTimeAgo(task.deadline || '')}</span>
                        </div>
                        <div className="mt-1 flex items-center text-gray-500 text-sm">
                          <MapPin size={14} className="mr-1" />
                          <span>{task.location}</span>
                        </div>
                      </div>
                      <div className="p-3 bg-white border-t">
                        <Button 
                          className="w-full bg-blue-500 hover:bg-blue-600"
                          onClick={() => handleOpenTask(task.id)}
                        >
                          Open Task
                        </Button>
                      </div>
                    </div>
                  ))}
                  {delayedTasks.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No delayed tasks</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Completed Tasks</h2>
              <span className="px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {completedTasks.length}
              </span>
            </div>
            
            <div className="space-y-3">
              {completedTasks.map(task => (
                <div key={task.id} className="rounded-lg border border-green-100 bg-white overflow-hidden shadow-sm">
                  <div className="p-4">
                    <div className="flex justify-between">
                      <h3 className="font-medium text-lg">{task.title}</h3>
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                        Completed
                      </span>
                    </div>
                    
                    <div className="mt-2 flex items-center text-gray-600 text-sm">
                      <Clock size={14} className="mr-1" />
                      <span>Completed {formatCompletedDate(task.completedAt || '')}</span>
                    </div>
                    
                    <div className="mt-1 flex items-center text-gray-500 text-sm">
                      <MapPin size={14} className="mr-1" />
                      <span>{task.location}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 border-t">
                    <Button 
                      variant="outline"
                      className="w-full bg-green-50 text-green-700 border-green-100 hover:bg-green-100"
                      onClick={() => handleOpenTask(task.id)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
              {completedTasks.length === 0 && (
                <p className="text-gray-500 text-center py-4">No completed tasks yet</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <div className="h-16" />
      <BottomNavigation />
    </div>
  );
};

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));
  
  if (diffMins < 60) {
    return `${diffMins} minutes ago`;
  }
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
};

const formatCompletedDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  
  if (date.toDateString() === now.toDateString()) {
    return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' })}`;
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' })}`;
  }
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default ManagerDashboard;
