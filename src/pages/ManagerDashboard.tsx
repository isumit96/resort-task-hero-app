
import { useNavigate } from "react-router-dom";
import { useRole } from "@/hooks/useRole";
import Header from "@/components/Header";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ErrorState from "@/components/ErrorState";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight } from "lucide-react";
import type { Task } from "@/types";
import BottomNavigation from "@/components/BottomNavigation";
import TaskTabs from "@/components/TaskTabs";
import TaskMetricsChart from "@/components/TaskMetricsChart";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const ManagerDashboard = () => {
  const { isManager } = useRole();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: tasks, error, isLoading } = useQuery({
    queryKey: ["all-tasks"],
    queryFn: async () => {
      console.log("Fetching all tasks for manager view");
      
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select(`
          *,
          steps:task_steps(*),
          profiles:assigned_to(username, role)
        `)
        .order('deadline', { ascending: true });

      if (error) {
        console.error("Error fetching tasks:", error);
        throw error;
      }
      
      console.log("Tasks fetched successfully for manager:", tasks);
      
      // Transform the data to match our Task type
      const transformedTasks = tasks.map((task: any): Task => ({
        id: task.id,
        title: task.title,
        dueTime: new Date(task.due_time).toLocaleString(),
        location: task.location || '',
        status: task.status,
        assignedTo: task.assigned_to,
        assigneeName: task.profiles?.username || 'Unassigned',
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
          isOptional: step.is_optional || false
        }))
      }));
      
      return transformedTasks;
    }
  });

  // Redirect unauthorized users immediately
  if (!isManager) {
    navigate("/tasks");
    return null;
  }

  if (error) return <ErrorState error={error} title={t('navigation.dashboard')} />;
  
  // Use skeleton loading state instead of blank page
  const delayedTasks = tasks?.filter(task => 
    task.status !== 'completed' && 
    task.deadline && 
    new Date(task.deadline) < new Date()
  ) || [];

  const completedTasks = tasks?.filter(task => task.status === 'completed') || [];
  const pendingTasks = tasks?.filter(task => task.status !== 'completed' && !delayedTasks.includes(task)) || [];

  return (
    <div className="min-h-screen bg-background">
      <Header title={t('navigation.dashboard')} showBackButton={false} />
      
      <main className="container mx-auto px-4 py-6 pb-20 max-w-7xl">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('navigation.dashboard')}</h1>
              <p className="text-muted-foreground">{t('manager.overview')}</p>
            </div>
            
            {!isLoading && (
              <Button 
                onClick={() => navigate("/tasks/create")}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-lg hover:shadow-primary/25 transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('tasks.createNew')}
              </Button>
            )}
          </div>

          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {isLoading ? (
              <div className="h-64 w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
            ) : (
              <TaskMetricsChart 
                pendingTasks={pendingTasks} 
                delayedTasks={delayedTasks}
                completedTasks={completedTasks}
              />
            )}
          </motion.div>
          
          <div className="grid gap-6 md:grid-cols-12">
            <motion.div 
              className="md:col-span-12 lg:col-span-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="overflow-hidden border border-border/50">
                <CardHeader className="bg-card px-6 py-4 border-b border-border/40">
                  <CardTitle className="text-lg font-medium">{t('manager.taskManagement')}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-6 space-y-4">
                      <div className="h-8 w-3/4 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
                      <div className="h-20 w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
                      <div className="h-20 w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
                    </div>
                  ) : (
                    <TaskTabs 
                      pendingTasks={pendingTasks}
                      delayedTasks={delayedTasks}
                      completedTasks={completedTasks}
                      showAssignee={true}
                    />
                  )}
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div 
              className="md:col-span-12 lg:col-span-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">{t('manager.quickActions')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => navigate("/tasks/create")} 
                    variant="outline" 
                    className="w-full justify-between hover:bg-primary hover:text-white transition-colors"
                    disabled={isLoading}
                  >
                    {t('tasks.createNew')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={() => navigate("/history")} 
                    variant="outline" 
                    className="w-full justify-between hover:bg-primary hover:text-white transition-colors"
                    disabled={isLoading}
                  >
                    {t('manager.viewTaskHistory')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
                <CardFooter>
                  <p className="text-xs text-muted-foreground">
                    {!isLoading ? `${tasks?.length || 0} ${t('manager.totalTasks')}` : t('common.loading')}
                  </p>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </main>
      
      <div className="h-16" />
      <BottomNavigation />
    </div>
  );
};

export default ManagerDashboard;
