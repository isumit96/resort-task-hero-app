import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { format, formatRelative } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import TaskDescription from "@/components/TaskDescription";
import LocationSelect from "@/components/LocationSelect";
import TaskStepInput from "@/components/TaskStepInput";
import { SaveAll } from "lucide-react";
import { CalendarIcon, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
    interactionType: z.string().default('checkbox')
  })).min(1, "At least one step is required"),
  description: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

const TaskCreate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string>();
  const [videoUrl, setVideoUrl] = useState<string>();
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      description: "",
      steps: [{ 
        title: "", 
        requiresPhoto: false, 
        isOptional: false,
        interactionType: 'checkbox' 
      }],
    },
  });

  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoading(true);
      try {
        console.log("Attempting to fetch employees");
        
        const { count, error: countError } = await supabase
          .from("profiles")
          .select('*', { count: 'exact', head: true });
          
        if (countError) {
          console.error("Error counting profiles:", countError);
        } else {
          console.log("Total profiles count:", count);
        }
        
        const { data: allProfiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, username, role");
        
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          throw profilesError;
        }
        
        console.log("All fetched profiles:", allProfiles);
        console.log("Number of profiles fetched:", allProfiles?.length || 0);
        
        if (allProfiles && allProfiles.length > 0) {
          const formattedProfiles = allProfiles.map((profile: any) => ({
            id: profile.id,
            username: profile.username || '',
            role: profile.role || ''
          }));
          
          setEmployees(formattedProfiles);
          console.log("Employees state after update:", formattedProfiles);
        } else {
          console.log("No profiles returned from query");
          toast({
            title: "No Profiles",
            description: "No profiles found in the database.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error in fetchEmployees:", error);
        toast({
          title: "Error",
          description: "Failed to fetch profiles",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, [toast]);

  const handlePhotoUpload = async (file: File) => {
    const { data, error } = await supabase.storage
      .from('task-attachments')
      .upload(`photos/${Date.now()}-${file.name}`, file);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive",
      });
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('task-attachments')
      .getPublicUrl(data.path);

    setPhotoUrl(publicUrl);
  };

  const handleVideoUpload = async (file: File) => {
    const { data, error } = await supabase.storage
      .from('task-attachments')
      .upload(`videos/${Date.now()}-${file.name}`, file);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to upload video",
        variant: "destructive",
      });
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('task-attachments')
      .getPublicUrl(data.path);

    setVideoUrl(publicUrl);
  };

  const saveAsTemplate = async (data: TaskFormData) => {
    try {
      setIsSavingTemplate(true);
      
      const { data: template, error: templateError } = await supabase
        .from('task_templates')
        .insert({
          title: data.title,
          description: data.description,
          location: data.location,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      const templateSteps = data.steps.map((step, index) => ({
        template_id: template.id,
        title: step.title,
        requires_photo: step.requiresPhoto,
        is_optional: step.isOptional,
        interaction_type: step.interactionType,
        position: index,
      }));

      const { error: stepsError } = await supabase
        .from('template_steps')
        .insert(templateSteps);

      if (stepsError) throw stepsError;

      toast({
        title: "Success",
        description: "Task template saved successfully",
      });

    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const onSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true);
    try {
      console.log("Submitting task with data:", data);
      
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .insert({
          title: data.title,
          description: data.description,
          location: data.location,
          due_time: data.dueTime,
          assigned_to: data.assignedTo,
          deadline: data.deadline || null,
          photo_url: photoUrl,
          video_url: videoUrl,
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
            interaction_type: step.interactionType,
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

  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    return time;
  });

  return (
    <div className="min-h-screen flex flex-col dark:bg-background">
      <Header title="Create Task" showBackButton={true} />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-3xl mx-auto w-full">
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
                    <LocationSelect value={field.value} onChange={field.onChange} />
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
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>

                    <Select 
                      value={selectedTime} 
                      onValueChange={setSelectedTime}
                    >
                      <SelectTrigger className="w-[140px]">
                        <Clock className="mr-2 h-4 w-4" />
                        {selectedTime || "Select time"}
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={field.onChange}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>

                    <Select>
                      <SelectTrigger className="w-[140px]">
                        <Clock className="mr-2 h-4 w-4" />
                        Select time
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                    <SelectContent className="bg-white z-50">
                      {isLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading employees...
                        </SelectItem>
                      ) : employees.length === 0 ? (
                        <SelectItem value="no-employees" disabled>
                          No employees found
                        </SelectItem>
                      ) : (
                        employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.username || 'Unnamed'} ({employee.role})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <TaskDescription
                    description={field.value}
                    onDescriptionChange={field.onChange}
                    onPhotoUpload={handlePhotoUpload}
                    onVideoUpload={handleVideoUpload}
                    photoUrl={photoUrl}
                    videoUrl={videoUrl}
                  />
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
                    name={`steps.${index}`}
                    render={({ field }) => (
                      <TaskStepInput
                        title={field.value.title}
                        onTitleChange={(value) => form.setValue(`steps.${index}.title`, value)}
                        requiresPhoto={field.value.requiresPhoto}
                        onRequiresPhotoChange={(value) => form.setValue(`steps.${index}.requiresPhoto`, value)}
                        isOptional={field.value.isOptional}
                        onIsOptionalChange={(value) => form.setValue(`steps.${index}.isOptional`, value)}
                        interactionType={field.value.interactionType}
                        onInteractionTypeChange={(value) => form.setValue(`steps.${index}.interactionType`, value)}
                      />
                    )}
                  />
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const currentSteps = form.getValues("steps");
                  form.setValue("steps", [
                    ...currentSteps,
                    { title: "", requiresPhoto: false, isOptional: false, interactionType: 'checkbox' },
                  ]);
                }}
              >
                Add Step
              </Button>
            </div>

            <div className="flex gap-3">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Creating..." : "Create Task"}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                disabled={isSavingTemplate}
                onClick={() => form.getValues() && saveAsTemplate(form.getValues())}
                className="flex items-center gap-2"
              >
                <SaveAll className="h-4 w-4" />
                {isSavingTemplate ? "Saving..." : "Save as Template"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default TaskCreate;
