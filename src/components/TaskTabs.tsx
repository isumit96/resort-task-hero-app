
import { Task } from "@/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { History, ListTodo } from "lucide-react";
import TaskSection from "./TaskSection";

interface TaskTabsProps {
  pendingTasks: Task[];
  delayedTasks: Task[];
  completedTasks: Task[];
  showAssignee?: boolean;
}

const TaskTabs = ({ 
  pendingTasks, 
  delayedTasks, 
  completedTasks,
  showAssignee = true 
}: TaskTabsProps) => {
  return (
    <Tabs defaultValue="active" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-card">
        <TabsTrigger value="active" className="flex items-center gap-2 data-[state=active]:bg-muted">
          <ListTodo className="h-4 w-4" />
          Active Tasks
        </TabsTrigger>
        <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-muted">
          <History className="h-4 w-4" />
          Task History
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="space-y-4">
        <div className="grid gap-6 md:grid-cols-2">
          <TaskSection 
            title="Pending Tasks" 
            tasks={pendingTasks}
            badgeColor="yellow"
            showAssignee={showAssignee}
          />
          <TaskSection 
            title="Delayed Tasks" 
            tasks={delayedTasks}
            badgeColor={delayedTasks.length > 0 ? "red" : "gray"}
            showAssignee={showAssignee}
          />
        </div>
      </TabsContent>

      <TabsContent value="history" className="space-y-4">
        <TaskSection 
          title="Completed Tasks" 
          tasks={completedTasks}
          badgeColor="green"
          showAssignee={showAssignee}
        />
      </TabsContent>
    </Tabs>
  );
};

export default TaskTabs;
