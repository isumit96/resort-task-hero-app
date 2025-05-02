
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UseFormReturn } from "react-hook-form";
import { TaskFormData } from "@/types/forms";
import { DepartmentType } from "@/types/index";

export const useTemplateLoader = (form: UseFormReturn<TaskFormData>) => {
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [templateApplied, setTemplateApplied] = useState(false);
  const { toast } = useToast();

  const loadTemplateData = async (templateId: string) => {
    setIsLoadingTemplate(true);
    try {
      // Reset any existing steps to ensure old content is cleared completely
      form.setValue("steps", []);
      
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
      
      if (template.department) {
        form.setValue("department", template.department as DepartmentType);
        form.clearErrors("department");
      }

      // When applying steps, completely replace the existing array
      if (steps && steps.length > 0) {
        const formattedSteps = steps.map((step) => ({
          title: step.title,
          requiresPhoto: step.requires_photo || false,
          isOptional: step.is_optional || false,
          interactionType: step.interaction_type || "checkbox"
        }));
        
        // Ensure we're setting an entirely new array, not appending to existing
        form.setValue("steps", formattedSteps, { shouldValidate: true });
      } else {
        // If no steps were found, ensure there's at least one empty step
        form.setValue("steps", [{
          title: "",
          requiresPhoto: false,
          isOptional: false,
          interactionType: "checkbox"
        }], { shouldValidate: true });
      }

      // Force update of form
      form.trigger();

      // Show toast notification once when template is applied
      toast({
        title: "Template Applied",
        description: "The template has been loaded successfully."
      });
      
      // Set templateApplied state to true to show the alert
      setTemplateApplied(true);
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

  // Add function to reset the templateApplied state
  const resetTemplateApplied = () => {
    setTemplateApplied(false);
  };

  return {
    loadTemplateData,
    isLoadingTemplate,
    templateApplied,
    resetTemplateApplied
  };
};
