
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SaveAll, AlertCircle } from "lucide-react";
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

const TaskCreate = () => {
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');
  const [photoUrl, setPhotoUrl] = useState<string>();
  const [videoUrl, setVideoUrl] = useState<string>();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      description: "",
      steps: [{ 
        title: "", 
        requiresPhoto: false, 
        isOptional: false,
        interactionType: "checkbox"
      }],
    },
  });

  const { employees, isLoading: isLoadingEmployees } = useEmployees();
  const { handleSubmit, saveAsTemplate, isSubmitting, isSavingTemplate } = useTaskCreation();
  const { loadTemplateData, isLoadingTemplate, templateApplied } = useTemplateLoader(form);

  const handlePhotoUpload = async (file: File) => {
    const url = await uploadFileToStorage(file, 'photos');
    setPhotoUrl(url);
    form.setValue('photoUrl', url);
  };

  const handleVideoUpload = async (file: File) => {
    const url = await uploadFileToStorage(file, 'videos');
    setVideoUrl(url);
    form.setValue('videoUrl', url);
  };

  const moveStep = (dragIndex: number, hoverIndex: number) => {
    const steps = [...form.getValues().steps];
    const draggedStep = steps[dragIndex];
    steps.splice(dragIndex, 1);
    steps.splice(hoverIndex, 0, draggedStep);
    form.setValue('steps', steps);
  };

  // Load template data if templateId is present
  React.useEffect(() => {
    if (templateId) {
      loadTemplateData(templateId);
    }
  }, [templateId, loadTemplateData]);

  return (
    <div className="min-h-screen flex flex-col dark:bg-background">
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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

            <div className="space-y-4">
              <h3 className="font-medium">Steps</h3>
              <DndProvider backend={HTML5Backend}>
                <div className="space-y-4">
                  {form.watch("steps").map((_, index) => (
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
