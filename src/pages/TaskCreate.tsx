import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  location: z.string().min(1, "Location is required"),
  dueTime: z.string().min(1, "Due time is required"),
  assignedTo: z.string().min(1, "Assignee is required"),
  deadline: z.string().optional(),
  steps: z.array(z.object({
    title: z.string().min(1, "Step title is required"),
    requiresPhoto: z.boolean().default(false),
    isOptional: z.boolean().default(false),
  })).min(1, "At least one step is required"),
});

type TaskFormData = z.infer<typeof taskSchema>;

const TaskCreate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Array<{ id: string; username: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      steps: [{ title: "", requiresPhoto: false, isOptional: false }],
    },
  });

  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username")
          .eq("role", "employee");
        
        if (error) throw error;
        
        console.log("Fetched employees:", data);
        
        if (!data || data.length === 0) {
          toast({
            title: "No Employees",
            description: "No employees found in the database. Please add employees first.",
            variant: "destructive"
          });
        } else {
          setEmployees(data);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        toast({
          title: "Error",
          description: "Failed to fetch employees",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, [toast]);

  const onSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true);
    try {
      console.log("Submitting task with data:", data);
      
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .insert({
          title: data.title,
          location: data.location,
          due_time: data.dueTime,
          assigned_to: data.assignedTo,
          deadline: data.deadline || null,
          status: "pending",
        })
        .select()
        .single();

      if (taskError) {
        console.error("Error creating task:", taskError);
        throw taskError;
      }

      console.log("Task created successfully:", task);

      const { error: stepsError } = await supabase
        .from("task_steps")
        .insert(
          data.steps.map(step => ({
            task_id: task.id,
            title: step.title,
            requires_photo: step.requiresPhoto,
            is_optional: step.isOptional,
          }))
        );

      if (stepsError) {
        console.error("Error creating task steps:", stepsError);
        throw stepsError;
      }

      toast({
        title: "Success",
        description: "Task created successfully",
      });

      navigate("/manager");
    } catch (error) {
      console.error("Error in task creation:", error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <Header title="Create Task" />
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Task title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Task location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline (Optional)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign To</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      {isLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading employees...
                        </SelectItem>
                      ) : employees.length === 0 ? (
                        <SelectItem value="no-employees" disabled>
                          No employees found
                        </SelectItem>
                      ) : (
                        employees.map(employee => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.username}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h3 className="font-medium">Steps</h3>
              {form.watch("steps").map((_, index) => (
                <div key={index} className="space-y-4 p-4 border rounded-lg">
                  <FormField
                    control={form.control}
                    name={`steps.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Step Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Step description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name={`steps.${index}.requiresPhoto`}
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Requires Photo</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`steps.${index}.isOptional`}
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Optional Step</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  {index > 0 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        const currentSteps = form.getValues("steps");
                        form.setValue("steps", currentSteps.filter((_, i) => i !== index));
                      }}
                      className="text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200"
                    >
                      Remove Step
                    </Button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const currentSteps = form.getValues("steps");
                  form.setValue("steps", [
                    ...currentSteps,
                    { title: "", requiresPhoto: false, isOptional: false },
                  ]);
                }}
              >
                Add Step
              </Button>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/manager")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default TaskCreate;
