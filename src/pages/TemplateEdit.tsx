
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader } from "lucide-react";
import LocationSelect from "@/components/LocationSelect";
import { StepInteractionType } from "@/types";
import TaskStepInput from "@/components/TaskStepInput";

interface TemplateStep {
  id?: string;
  template_id?: string;
  title: string;
  requires_photo: boolean;
  is_optional: boolean;
  position: number;
  interaction_type: StepInteractionType;
}

interface Template {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  created_at?: string;
}

const TemplateEdit = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [template, setTemplate] = useState<Template>({
    id: templateId || "",
    title: "",
    description: "",
    location: "",
  });
  const [steps, setSteps] = useState<TemplateStep[]>([]);

  useEffect(() => {
    const fetchTemplateDetails = async () => {
      if (!templateId) return;

      try {
        setIsLoading(true);
        
        // Fetch template details
        const { data: templateData, error: templateError } = await supabase
          .from("task_templates")
          .select("*")
          .eq("id", templateId)
          .single();

        if (templateError) throw templateError;

        // Fetch template steps
        const { data: stepsData, error: stepsError } = await supabase
          .from("template_steps")
          .select("*")
          .eq("template_id", templateId)
          .order("position", { ascending: true });

        if (stepsError) throw stepsError;

        setTemplate({
          id: templateData.id,
          title: templateData.title,
          description: templateData.description,
          location: templateData.location,
          created_at: templateData.created_at,
        });

        if (stepsData && stepsData.length > 0) {
          setSteps(stepsData.map((step: any) => ({
            id: step.id,
            template_id: step.template_id,
            title: step.title,
            requires_photo: step.requires_photo,
            is_optional: step.is_optional,
            position: step.position,
            interaction_type: step.interaction_type as StepInteractionType,
          })));
        } else {
          // Initialize with a blank step if no steps exist
          setSteps([{
            title: "",
            requires_photo: false,
            is_optional: false,
            position: 0,
            interaction_type: "checkbox" as StepInteractionType,
          }]);
        }
      } catch (error) {
        console.error("Error fetching template details:", error);
        toast({
          title: "Error",
          description: "Failed to fetch template details.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplateDetails();
  }, [templateId, toast]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      if (!template.title) {
        toast({
          title: "Error",
          description: "Template title is required.",
          variant: "destructive",
        });
        return;
      }

      if (steps.some(step => !step.title)) {
        toast({
          title: "Error",
          description: "All steps must have a title.",
          variant: "destructive",
        });
        return;
      }

      // Update template
      const { error: templateError } = await supabase
        .from("task_templates")
        .update({
          title: template.title,
          description: template.description,
          location: template.location,
        })
        .eq("id", templateId);

      if (templateError) throw templateError;

      // Delete all existing steps
      const { error: deleteError } = await supabase
        .from("template_steps")
        .delete()
        .eq("template_id", templateId);

      if (deleteError) throw deleteError;

      // Insert updated steps
      const stepsToInsert = steps.map((step, index) => ({
        template_id: templateId,
        title: step.title,
        requires_photo: step.requires_photo,
        is_optional: step.is_optional,
        interaction_type: step.interaction_type,
        position: index,
      }));

      const { error: insertError } = await supabase
        .from("template_steps")
        .insert(stepsToInsert);

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Template updated successfully.",
      });

      navigate(`/templates`);
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

  const handleCancel = () => {
    navigate(`/templates`);
  };

  const moveStep = (dragIndex: number, hoverIndex: number) => {
    const newSteps = [...steps];
    const draggedStep = newSteps[dragIndex];
    newSteps.splice(dragIndex, 1);
    newSteps.splice(hoverIndex, 0, draggedStep);
    setSteps(newSteps);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title="Edit Template" showBackButton={true} />
        <div className="flex-1 flex items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header title="Edit Template" showBackButton={true} />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-3xl mx-auto w-full">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={template.title || ""}
              onChange={(e) => setTemplate({ ...template, title: e.target.value })}
              placeholder="Template title"
              className="mt-1.5"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={template.description || ""}
              onChange={(e) => setTemplate({ ...template, description: e.target.value })}
              placeholder="Template description"
              className="mt-1.5"
            />
          </div>
          
          <div>
            <Label htmlFor="location">Location</Label>
            <LocationSelect 
              value={template.location || ""} 
              onChange={(value) => setTemplate({ ...template, location: value })}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Steps</h3>
          
          {steps.map((step, index) => (
            <div key={index} className="space-y-4 p-4 border rounded-lg">
              <TaskStepInput
                title={step.title}
                onTitleChange={(value) => {
                  const newSteps = [...steps];
                  newSteps[index] = { ...newSteps[index], title: value };
                  setSteps(newSteps);
                }}
                requiresPhoto={step.requires_photo}
                onRequiresPhotoChange={(value) => {
                  const newSteps = [...steps];
                  newSteps[index] = { ...newSteps[index], requires_photo: value };
                  setSteps(newSteps);
                }}
                isOptional={step.is_optional}
                onIsOptionalChange={(value) => {
                  const newSteps = [...steps];
                  newSteps[index] = { ...newSteps[index], is_optional: value };
                  setSteps(newSteps);
                }}
                interactionType={step.interaction_type}
                onInteractionTypeChange={(value) => {
                  const newSteps = [...steps];
                  newSteps[index] = { ...newSteps[index], interaction_type: value as StepInteractionType };
                  setSteps(newSteps);
                }}
                index={index}
                moveStep={moveStep}
                totalSteps={steps.length}
              />
              
              {steps.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setSteps(steps.filter((_, i) => i !== index));
                  }}
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
              setSteps([...steps, {
                title: "",
                requires_photo: false,
                is_optional: false,
                position: steps.length,
                interaction_type: "checkbox" as StepInteractionType,
              }]);
            }}
          >
            Add Step
          </Button>
        </div>
        
        <div className="flex gap-3 pt-4">
          <Button onClick={handleSave} disabled={isSaving} className="flex-1">
            {isSaving ? "Saving..." : "Save Template"}
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TemplateEdit;
