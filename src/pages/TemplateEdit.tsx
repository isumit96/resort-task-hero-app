
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, SaveAll, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { taskSchema, TaskFormData } from "@/types/forms";
import TaskStepInput from "@/components/TaskStepInput";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import TaskStepDraggable from "@/components/TaskStepDraggable";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useDepartments } from "@/hooks/useDepartments";
import { StepInteractionType } from "@/types";

const TemplateEdit = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const { data: departments, isLoading: isLoadingDepartments } = useDepartments();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      location: "",
      dueTime: "",
      assignedTo: "",
      department: "Housekeeping",
      description: "",
      steps: [{ title: "", requiresPhoto: false, isOptional: false, interactionType: "checkbox" }],
    },
    mode: "onChange"
  });

  // Fetch template detail + steps
  useEffect(() => {
    const loadData = async () => {
      if (!templateId) return;

      setIsLoading(true);
      try {
        // Fetch template
        const { data: template, error: templateError } = await supabase
          .from("task_templates")
          .select("*")
          .eq("id", templateId)
          .single();
        if (templateError) throw templateError;

        // Fetch steps
        const { data: steps, error: stepsError } = await supabase
          .from("template_steps")
          .select("*")
          .eq("template_id", templateId)
          .order("position", { ascending: true });

        if (stepsError) throw stepsError;

        const formattedSteps = steps && steps.length > 0
          ? steps.map((step) => ({
              title: step.title || "", // Ensure title is never undefined
              requiresPhoto: step.requires_photo || false,
              isOptional: step.is_optional || false,
              // Ensure interaction_type is cast to a valid StepInteractionType
              interactionType: (step.interaction_type || "checkbox") as StepInteractionType
            }))
          : [{ title: "", requiresPhoto: false, isOptional: false, interactionType: "checkbox" as StepInteractionType }];

        form.reset({
          title: template.title || "",
          location: template.location || "",
          department: template.department || "Housekeeping",
          description: template.description || "",
          dueTime: "", // keep empty
          assignedTo: "", // keep empty
          steps: formattedSteps
        });
      } catch (error) {
        console.error("Error loading template:", error);
        toast({
          title: "Error",
          description: "Could not load template data.",
          variant: "destructive",
        });
        navigate("/templates");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line
  }, [templateId]);

  // Watch for form errors and set formErrors state
  useEffect(() => {
    const subscription = form.watch(() => {
      const errors = Object.entries(form.formState.errors)
        .map(([key, value]) => {
          if (key === "steps") {
            return value?.message as string;
          }
          return value?.message as string;
        })
        .filter(Boolean);

      setFormErrors(errors);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line
  }, [form]);

  // Draggable steps reordering
  const moveStep = (dragIndex: number, hoverIndex: number) => {
    const steps = [...form.getValues().steps];
    const draggedStep = steps[dragIndex];
    steps.splice(dragIndex, 1);
    steps.splice(hoverIndex, 0, draggedStep);
    form.setValue("steps", steps, { shouldValidate: true });
  };

  // Helpers
  function areStepTitlesUnique(steps: { title: string }[]) {
    // Ensure all titles are strings before checking uniqueness
    const titles = steps.map(s => (s.title || "").trim());
    return new Set(titles).size === titles.length;
  }

  // Save/update
  const onSubmit = async (data: TaskFormData) => {
    // Frontend Validations
    if (!data.title.trim() || !data.location.trim() || !data.department || data.steps.length === 0) {
      toast({
        title: "Validation Error",
        description: "Required fields are missing.",
        variant: "destructive",
      });
      return;
    }
    
    // Ensure all step titles are defined strings before checking uniqueness
    const stepsWithDefinedTitles = data.steps.map(step => ({
      ...step,
      title: step.title || ""
    }));
    
    if (!areStepTitlesUnique(stepsWithDefinedTitles)) {
      toast({
        title: "Validation Error",
        description: "Step titles must be unique.",
        variant: "destructive",
      });
      return;
    }
    
    if (stepsWithDefinedTitles.some(step => !step.title.trim())) {
      toast({
        title: "Validation Error",
        description: "All step titles must be filled in.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Update template info
      const { error: updateError } = await supabase
        .from("task_templates")
        .update({
          title: data.title,
          description: data.description,
          location: data.location,
          department: data.department,
        })
        .eq("id", templateId);

      if (updateError) throw updateError;

      // Fetch existing steps to compare/update/delete
      const { data: existingSteps } = await supabase
        .from("template_steps")
        .select("*")
        .eq("template_id", templateId)
        .order("position", { ascending: true });

      // 1. Update or upsert steps
      for (let i = 0; i < data.steps.length; i++) {
        const step = data.steps[i];
        const currentExisting = existingSteps?.[i];
        if (currentExisting) {
          // Update existing step
          await supabase.from("template_steps").update({
            title: step.title || "", // Ensure title is never undefined
            requires_photo: step.requiresPhoto,
            is_optional: step.isOptional,
            interaction_type: step.interactionType,
            position: i
          }).eq("id", currentExisting.id);
        } else {
          // New row
          await supabase.from("template_steps").insert({
            template_id: templateId,
            title: step.title || "", // Ensure title is never undefined
            requires_photo: step.requiresPhoto,
            is_optional: step.isOptional,
            interaction_type: step.interactionType,
            position: i,
          });
        }
      }

      // 2. Delete extra steps that were removed
      if (existingSteps && existingSteps.length > data.steps.length) {
        const stepsToDelete = existingSteps.slice(data.steps.length);
        await Promise.all(
          stepsToDelete.map(step =>
            supabase.from("template_steps").delete().eq("id", step.id)
          )
        );
      }

      toast({
        title: "Success",
        description: "Template updated successfully.",
      });
      navigate(`/templates/${templateId}`);
    } catch (error) {
      console.error("Error updating template:", error);
      toast({
        title: "Error",
        description: "Failed to update template.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title="Edit Template" showBackButton={true} />
        <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background dark:bg-background">
      <Header title="Edit Template" showBackButton={true} />
      <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-3xl mx-auto w-full">
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
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Template title"
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
                    <Input 
                      placeholder="Location"
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Description"
                      {...field}
                      className="bg-background dark:bg-background border-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Steps */}
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
                            form.setValue("steps", currentSteps.filter((_, i) => i !== index), { shouldValidate: true });
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
                  ], { shouldValidate: true });
                }}
                className="bg-background dark:bg-background hover:bg-accent dark:hover:bg-accent transition-colors"
              >
                Add Step
              </Button>
            </div>

            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                <>
                  <SaveAll className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default TemplateEdit;
