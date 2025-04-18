
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
    <Tabs defaultValue="active" className="w-full">
      <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-background border-b rounded-none p-0 h-auto">
        <TabsTrigger 
          value="active" 
          className="rounded-none data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none py-3 text-sm"
        >
          <ListTodo className="h-4 w-4 mr-2" />
          Active Tasks
        </TabsTrigger>
        <TabsTrigger 
          value="history" 
          className="rounded-none data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none py-3 text-sm"
        >
          <History className="h-4 w-4 mr-2" />
          Task History
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="mt-0 p-6 space-y-6">
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

      <TabsContent value="history" className="mt-0 p-6">
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
