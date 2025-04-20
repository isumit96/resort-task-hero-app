
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { TaskFormData } from "@/types/forms";

export const useTaskCreation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const ensureUniqueStepTitles = (steps: TaskFormData['steps']) => {
    const titleCounts: Record<string, number> = {};
    
    return steps.map(step => {
      const title = step.title;
      
      if (!titleCounts[title] || title === "") {
        titleCounts[title] = 1;
        return step;
      }
      
      titleCounts[title]++;
      const newTitle = `${title} (${titleCounts[title]})`;
      
      return {
        ...step,
        title: newTitle
      };
    });
  };

  const handleSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true);
    try {
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .insert({
          title: data.title,
          description: data.description,
          location: data.location,
          due_time: data.dueTime,
          assigned_to: data.assignedTo,
          deadline: data.deadline || null,
          photo_url: data.photoUrl,
          video_url: data.videoUrl,
          status: "pending",
        })
        .select()
        .single();

      if (taskError) throw taskError;

      const processedSteps = ensureUniqueStepTitles(data.steps);
      
      const taskSteps = processedSteps.map((step) => ({
        task_id: task.id,
        title: step.title,
        requires_photo: step.requiresPhoto,
        is_optional: step.isOptional,
        interaction_type: step.interactionType,
      }));

      const { error: stepsError } = await supabase
        .from("task_steps")
        .insert(taskSteps);

      if (stepsError) throw stepsError;

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

  return {
    handleSubmit,
    saveAsTemplate,
    isSubmitting,
    isSavingTemplate
  };
};
