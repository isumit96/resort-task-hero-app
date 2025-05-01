
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TaskFormData } from "@/types/forms";
import { DepartmentType } from "@/types/index";

export const useTaskCreation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Helper function to translate text
  const translateText = async (text: string, targetLang: string) => {
    if (!text) return null;
    
    try {
      const response = await supabase.functions.invoke('translate', {
        body: { text, target: targetLang }
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      return response.data?.translations?.[0]?.translatedText || null;
    } catch (error) {
      console.error(`Translation error (${targetLang}):`, error);
      return null;
    }
  };

  // Helper function to translate batch of texts
  const translateBatch = async (texts: string[], targetLang: string) => {
    if (!texts || texts.length === 0) return [];
    
    try {
      const response = await supabase.functions.invoke('translate', {
        body: { text: texts, target: targetLang }
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      return response.data?.translations?.map(t => t.translatedText) || [];
    } catch (error) {
      console.error(`Batch translation error (${targetLang}):`, error);
      return texts.map(() => null);
    }
  };

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
    if (isSubmitting) return; // Prevent duplicate submissions
    
    setIsSubmitting(true);
    try {
      // Translate title, description, and location to supported languages
      const [title_hi, title_kn] = await Promise.all([
        translateText(data.title, 'hi'),
        translateText(data.title, 'kn')
      ]);
      
      const [location_hi, location_kn] = await Promise.all([
        translateText(data.location, 'hi'),
        translateText(data.location, 'kn')
      ]);
      
      const [description_hi, description_kn] = data.description ? await Promise.all([
        translateText(data.description, 'hi'),
        translateText(data.description, 'kn')
      ]) : [null, null];

      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .insert({
          title: data.title,
          title_hi,
          title_kn,
          description: data.description,
          description_hi,
          description_kn,
          location: data.location,
          location_hi,
          location_kn,
          due_time: data.dueTime,
          assigned_to: data.assignedTo,
          deadline: data.deadline || null,
          photo_url: data.photoUrl,
          video_url: data.videoUrl,
          department: data.department as DepartmentType,
          status: "pending",
        })
        .select()
        .single();

      if (taskError) throw taskError;

      const processedSteps = ensureUniqueStepTitles(data.steps);
      
      // Translate all step titles in batch for efficiency
      const stepTitles = processedSteps.map(step => step.title);
      const [hiTitles, knTitles] = await Promise.all([
        translateBatch(stepTitles, 'hi'),
        translateBatch(stepTitles, 'kn')
      ]);

      const taskSteps = processedSteps.map((step, index) => ({
        task_id: task.id,
        title: step.title,
        title_hi: hiTitles[index],
        title_kn: knTitles[index],
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

      navigate("/manager"); // Redirect to manager dashboard after success
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
      
      // Translate title, description, and location to supported languages
      const [title_hi, title_kn] = await Promise.all([
        translateText(data.title, 'hi'),
        translateText(data.title, 'kn')
      ]);
      
      const [location_hi, location_kn] = data.location ? await Promise.all([
        translateText(data.location, 'hi'),
        translateText(data.location, 'kn')
      ]) : [null, null];
      
      const [description_hi, description_kn] = data.description ? await Promise.all([
        translateText(data.description, 'hi'),
        translateText(data.description, 'kn')
      ]) : [null, null];
      
      const { data: template, error: templateError } = await supabase
        .from('task_templates')
        .insert({
          title: data.title,
          title_hi,
          title_kn,
          description: data.description,
          description_hi,
          description_kn,
          location: data.location,
          location_hi,
          location_kn,
          department: data.department as DepartmentType,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Translate all step titles in batch for efficiency
      const stepTitles = data.steps.map(step => step.title);
      const [hiTitles, knTitles] = await Promise.all([
        translateBatch(stepTitles, 'hi'),
        translateBatch(stepTitles, 'kn')
      ]);

      const templateSteps = data.steps.map((step, index) => ({
        template_id: template.id,
        title: step.title,
        title_hi: hiTitles[index],
        title_kn: knTitles[index],
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
