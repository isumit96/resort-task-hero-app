import { useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Loader, Plus, CalendarClock, Clock, AlertTriangle, CheckCircle2, FileEdit } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import TaskCard from "@/components/TaskCard";
import { useRole } from "@/hooks/useRole";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from "@/components/LanguageSwitcher";

const TaskList = () => {
  const { t } = useTranslation();
  const {
    user,
    isAuthenticated
  } = useUser();
  const {
    isManager
  } = useRole();
  const navigate = useNavigate();
  const {
    data: tasks,
    isLoading,
    error
  } = useTasks(isManager);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    console.log("Current user in TaskList:", user);
  }, [isAuthenticated, navigate, user]);

  useEffect(() => {
    console.log("Tasks data in TaskList:", tasks);
  }, [tasks]);

  const handleCreateTask = () => {
    navigate("/tasks/create");
  };

  const handleViewTemplates = () => {
    navigate("/templates");
  };

  const parseDate = (dateString: string | undefined): Date | null => {
    if (!dateString) return null;
    try {
      return new Date(dateString);
    } catch (e) {
      console.error("Error parsing date:", e);
      return null;
    }
  };

  const now = new Date();
  const taskArray = Array.isArray(tasks) ? tasks : [];
  const activeTasks = taskArray.filter(task => task.status !== 'completed') || [];
  const overdueTasks = activeTasks.filter(task => {
    const deadlineDate = parseDate(task.deadline);
    return deadlineDate !== null && deadlineDate < now;
  });
  const upcomingTasks = activeTasks.filter(task => {
    const deadlineDate = parseDate(task.deadline);
    return deadlineDate === null || deadlineDate >= now;
  });

  const container = {
    hidden: {
      opacity: 0
    },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: {
      opacity: 0,
      y: 20
    },
    show: {
      opacity: 1,
      y: 0
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header showBackButton={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-4 max-w-md">
            <div className="mb-4 bg-red-100 dark:bg-red-900/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t('common.error')}</h2>
            <p className="text-muted-foreground mb-4">{error.message}</p>
            <Button onClick={() => window.location.reload()}>
              {t('common.tryAgain')}
            </Button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header showBackButton={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader className="mx-auto h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">{t('tasks.loadingTasks')}</p>
          </div>
        </div>
        <div className="h-16" />
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showBackButton={false} />
      
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-20 max-w-2xl mx-auto w-full">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>

        {isManager && (
          <div className="mb-8 space-y-3">
            <Button onClick={handleCreateTask} className="w-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-primary/25 transition-all duration-300" size="lg">
              <Plus className="h-4 w-4 mr-2" />
              {t('tasks.createNew')}
            </Button>
            
            <Button onClick={handleViewTemplates} className="w-full" variant="outline" size="lg">
              <FileEdit className="h-4 w-4 mr-2" />
              {t('tasks.viewTemplates')}
            </Button>
          </div>
        )}

        {!activeTasks.length ? (
          <div className="flex flex-col items-center justify-center min-h-full flex-1 text-center">
            <div className="bg-primary/10 p-5 rounded-full mb-4">
              <CheckCircle2 size={40} className="text-primary" />
            </div>
            <p className="text-xl font-medium text-foreground">{t('tasks.allCaughtUp')}</p>
            <p className="mt-2 text-muted-foreground max-w-xs">
              {t('tasks.noTasks')}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
              {overdueTasks.length > 0 && (
                <div>
                  <div className="flex items-center mb-4">
                    <CalendarClock size={20} className="text-destructive mr-2" />
                    <h2 className="text-lg font-semibold text-foreground">{t('tasks.overdueTasks')}</h2>
                    <span className="ml-2 px-2 py-0.5 bg-destructive/10 text-destructive text-xs font-medium rounded-full">
                      {overdueTasks.length}
                    </span>
                  </div>
                  <motion.div className="space-y-3" variants={container}>
                    {overdueTasks.map(task => (
                      <motion.div key={task.id} variants={item}>
                        <TaskCard task={task} showAssignee={isManager} />
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}
              
              {upcomingTasks.length > 0 && (
                <div>
                  <div className="flex items-center mb-4">
                    <Clock size={20} className="text-primary mr-2" />
                    <h2 className="text-lg font-semibold text-foreground">{t('tasks.upcomingTasks')}</h2>
                    <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                      {upcomingTasks.length}
                    </span>
                  </div>
                  <motion.div className="space-y-3" variants={container}>
                    {upcomingTasks.map(task => (
                      <motion.div key={task.id} variants={item}>
                        <TaskCard task={task} showAssignee={isManager} />
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
      
      <div className="h-16" />
      <BottomNavigation />
    </div>
  );
};

export default TaskList;
