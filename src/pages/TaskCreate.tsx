
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { SaveAll, AlertCircle, Loader2 } from "lucide-react";
import TaskDescription from "@/components/TaskDescription";
import LocationSelect from "@/components/LocationSelect";
import TaskStepInput from "@/components/TaskStepInput";
import TemplateSelector from "@/components/TemplateSelector";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import TaskStepDraggable from "@/components/TaskStepDraggable";
import { useEmployees } from "@/hooks/useEmployees";
import { useTaskCreation } from "@/hooks/useTaskCreation";
import { useTemplateLoader } from "@/hooks/useTemplateLoader";
import { taskSchema, TaskFormData } from "@/types/forms";
import { DateTimeSelect } from "@/components/DateTimeSelect";
import { AssigneeSelect } from "@/components/AssigneeSelect";
import { uploadFileToStorage } from "@/utils/storage";
import { useDepartments } from "@/hooks/useDepartments";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const TaskCreate = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const templateId = searchParams.get('template');
  const [photoUrl, setPhotoUrl] = useState<string>();
  const [videoUrl, setVideoUrl] = useState<string>();
  const { toast } = useToast();
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const { data: departments, isLoading: isLoadingDepartments } = useDepartments();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      location: "",
      dueTime: "",
      assignedTo: "",
      department: "Housekeeping", // Set a valid default department value
      description: "",
      steps: [{ 
        title: "", 
        requiresPhoto: false, 
        isOptional: false,
        interactionType: "checkbox"
      }]
    },
    mode: "onChange"
  });

  const { employees, isLoading: isLoadingEmployees } = useEmployees();
  const { handleSubmit, saveAsTemplate, isSubmitting, isSavingTemplate } = useTaskCreation();
  const { loadTemplateData, isLoadingTemplate, templateApplied } = useTemplateLoader(form);

  const handlePhotoUpload = async (file: File) => {
    try {
      const url = await uploadFileToStorage(file, 'photos');
      setPhotoUrl(url);
      form.setValue('photoUrl', url);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive",
      });
    }
  };

  const handleVideoUpload = async (file: File) => {
    try {
      const url = await uploadFileToStorage(file, 'videos');
      setVideoUrl(url);
      form.setValue('videoUrl', url);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload video",
        variant: "destructive",
      });
    }
  };

  const moveStep = (dragIndex: number, hoverIndex: number) => {
    const steps = [...form.getValues().steps];
    const draggedStep = steps[dragIndex];
    steps.splice(dragIndex, 1);
    steps.splice(hoverIndex, 0, draggedStep);
    form.setValue('steps', steps);
  };

  const onSubmit = async (data: TaskFormData) => {
    try {
      const emptySteps = data.steps.filter(step => !step.title.trim());
      if (emptySteps.length > 0) {
        toast({
          title: "Validation Error",
          description: "All step titles must be filled in",
          variant: "destructive",
        });
        return;
      }

      const titles = data.steps.map(step => step.title.trim());
      const uniqueTitles = new Set(titles);
      if (uniqueTitles.size !== titles.length) {
        toast({
          title: "Validation Error",
          description: "Step titles must be unique",
          variant: "destructive",
        });
        return;
      }

      await handleSubmit(data);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (templateId) {
      loadTemplateData(templateId);
    }
  }, [templateId, loadTemplateData]);

  useEffect(() => {
    const subscription = form.watch(() => {
      const errors = Object.entries(form.formState.errors)
        .map(([key, value]) => {
          if (key === 'steps') {
            return value.message as string;
          }
          return value?.message as string;
        })
        .filter(Boolean);
      
      setFormErrors(errors);
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <div className="min-h-screen flex flex-col bg-background dark:bg-background">
      <Header title="Create Task" showBackButton={true} />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-3xl mx-auto w-full">
        {templateApplied && (
          <Alert className="bg-primary/10 border-primary/20">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Template applied</AlertTitle>
            <AlertDescription>
              The task details have been pre-filled from the selected template.
            </AlertDescription>
          </Alert>
        )}

        {formErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Form errors</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4">
                {formErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="mb-6">
              <TemplateSelector onSelectTemplate={loadTemplateData} />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Task title" 
                      {...field} 
                      className="bg-background dark:bg-background border-input"
                    />
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

            <DateTimeSelect
              form={form}
              isDeadline={false}
              label="Due Time"
              required={true}
            />

            <DateTimeSelect
              form={form}
              isDeadline={true}
              label="Deadline (Optional)"
              required={false}
            />

            <AssigneeSelect
              form={form}
              employees={employees}
              isLoading={isLoadingEmployees}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <TaskDescription
                    description={field.value || ""}
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

            <FormField
              control={form.control}
              name="department"
              rules={{ required: true }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoadingDepartments}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments?.map(dep => (
                          <SelectItem key={dep} value={dep}>
                            {dep}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h3 className="font-medium">Steps</h3>
              <DndProvider backend={HTML5Backend}>
                <div className="space-y-4">
                  {form.watch("steps").map((step, index) => (
                    <TaskStepDraggable
                      key={index}
                      index={index}
                      moveStep={moveStep}
                      onRemove={
                        form.watch("steps").length > 1 
                          ? () => {
                              const currentSteps = form.getValues("steps");
                              form.setValue("steps", currentSteps.filter((_, i) => i !== index));
                            }
                          : undefined
                      }
                    >
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
                      {form.formState.errors.steps?.[index]?.title && (
                        <p className="text-sm text-destructive mt-2">
                          {form.formState.errors.steps[index]?.title?.message}
                        </p>
                      )}
                    </TaskStepDraggable>
                  ))}
                </div>
              </DndProvider>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const currentSteps = form.getValues("steps");
                  form.setValue("steps", [
                    ...currentSteps,
                    { title: "", requiresPhoto: false, isOptional: false, interactionType: "checkbox" },
                  ]);
                }}
                className="bg-background dark:bg-background hover:bg-accent dark:hover:bg-accent transition-colors"
              >
                Add Step
              </Button>
            </div>

            <div className="flex gap-3">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </span>
                ) : (
                  "Create Task"
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                disabled={isSavingTemplate || isSubmitting}
                onClick={() => {
                  const data = form.getValues();
                  
                  const emptySteps = data.steps.filter(step => !step.title.trim());
                  if (emptySteps.length > 0) {
                    toast({
                      title: "Validation Error",
                      description: "All step titles must be filled in",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  saveAsTemplate(data);
                }}
                className="flex items-center gap-2 bg-background dark:bg-background hover:bg-accent dark:hover:bg-accent transition-colors"
              >
                {isSavingTemplate ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <SaveAll className="h-4 w-4" />
                    Save as Template
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default TaskCreate;
