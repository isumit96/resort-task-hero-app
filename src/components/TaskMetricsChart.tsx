
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell, PieChart, Pie } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Task } from "@/types";
import { CheckCircle2, Clock, AlertTriangle, CalendarClock } from "lucide-react";

interface TaskMetricsChartProps {
  pendingTasks: Task[];
  delayedTasks: Task[];
  completedTasks: Task[];
}

const TaskMetricsChart = ({ 
  pendingTasks,
  delayedTasks,
  completedTasks 
}: TaskMetricsChartProps) => {
  
  const totalTasks = pendingTasks.length + delayedTasks.length + completedTasks.length;
  const completionRate = totalTasks ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  
  // Data for status distribution chart
  const statusData = [
    { name: 'Pending', value: pendingTasks.length, color: '#9b87f5' },
    { name: 'Delayed', value: delayedTasks.length, color: '#f97316' },
    { name: 'Completed', value: completedTasks.length, color: '#22c55e' }
  ];
  
  // Get employee task distribution
  const employeeTaskDistribution = () => {
    const distribution: Record<string, number> = {};
    
    [...pendingTasks, ...delayedTasks, ...completedTasks].forEach(task => {
      if (!distribution[task.assigneeName || 'Unassigned']) {
        distribution[task.assigneeName || 'Unassigned'] = 0;
      }
      distribution[task.assigneeName || 'Unassigned'] += 1;
    });
    
    return Object.entries(distribution)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 employees
  };
  
  const employeeData = employeeTaskDistribution();
  
  const statusColors = {
    pending: '#9b87f5',
    delayed: '#f97316',
    completed: '#22c55e'
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Completion Rate */}
      <Card className="col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="text-3xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {completedTasks.length} of {totalTasks} tasks completed
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Task Status Distribution */}
      <Card className="col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Task Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[160px]">
            <ChartContainer 
              config={{
                pending: { color: '#9b87f5' },
                delayed: { color: '#f97316' },
                completed: { color: '#22c55e' },
              }}
            >
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent 
                      indicator="dot"
                    />
                  }
                />
              </PieChart>
            </ChartContainer>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1 text-center">
            <div className="flex flex-col items-center">
              <div className="flex items-center text-xs text-muted-foreground">
                <span className="mr-1 h-2 w-2 rounded-full bg-primary"></span>
                Pending
              </div>
              <div className="text-sm font-medium">{pendingTasks.length}</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center text-xs text-muted-foreground">
                <span className="mr-1 h-2 w-2 rounded-full bg-orange-500"></span>
                Delayed
              </div>
              <div className="text-sm font-medium">{delayedTasks.length}</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center text-xs text-muted-foreground">
                <span className="mr-1 h-2 w-2 rounded-full bg-green-500"></span>
                Completed
              </div>
              <div className="text-sm font-medium">{completedTasks.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Employee Task Distribution */}
      <Card className="col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Top Assigned Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[160px]">
            <ChartContainer 
              config={{
                value: { color: '#9b87f5' }
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={employeeData}>
                  <XAxis 
                    dataKey="name" 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value.split(' ')[0]} // Show only first name
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {employeeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#9b87f5" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Quick Stats */}
      <Card className="col-span-1 md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Task Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-background p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-lg font-bold">{pendingTasks.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-background p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Delayed</p>
                <p className="text-lg font-bold">{delayedTasks.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-background p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-lg font-bold">{completedTasks.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-background p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <CalendarClock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold">{totalTasks}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskMetricsChart;
