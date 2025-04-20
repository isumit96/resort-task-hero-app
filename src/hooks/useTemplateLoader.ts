
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UseFormReturn } from "react-hook-form";
import { TaskFormData } from "@/types/forms";

export const useTemplateLoader = (form: UseFormReturn<TaskFormData>) => {
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [templateApplied, setTemplateApplied] = useState(false);
  const { toast } = useToast();

  const loadTemplateData = async (templateId: string) => {
    setIsLoadingTemplate(true);
    try {
      const { data: template, error: templateError } = await supabase
        .from("task_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (templateError) throw templateError;

      const { data: steps, error: stepsError } = await supabase
        .from("template_steps")
        .select("*")
        .eq("template_id", templateId)
        .order("position", { ascending: true });

      if (stepsError) throw stepsError;

      form.setValue("title", template.title);
      form.clearErrors("title");
      
      if (template.description) {
        form.setValue("description", template.description);
      }
      if (template.location) {
        form.setValue("location", template.location);
        form.clearErrors("location");
      }

      if (steps && steps.length > 0) {
        const formattedSteps = steps.map((step) => ({
          title: step.title,
          requiresPhoto: step.requires_photo || false,
          isOptional: step.is_optional || false,
          interactionType: step.interaction_type || "checkbox"
        }));
        
        // Clear any existing steps and set the new ones
        form.setValue("steps", formattedSteps);
      } else {
        // If no steps were found, ensure there's at least one empty step
        form.setValue("steps", [{
          title: "",
          requiresPhoto: false,
          isOptional: false,
          interactionType: "checkbox"
        }]);
      }

      setTemplateApplied(true);
      toast({
        title: "Template Applied",
        description: "The template has been loaded successfully."
      });
    } catch (error) {
      console.error("Error loading template:", error);
      toast({
        title: "Error",
        description: "Failed to load template data.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  return {
    loadTemplateData,
    isLoadingTemplate,
    templateApplied
  };
};
