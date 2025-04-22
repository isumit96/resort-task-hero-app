
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Loader, Clock, ListChecks, MapPin } from "lucide-react";
import { StepInteractionType, TaskStep } from "@/types";
import { useTranslation } from "react-i18next";

interface TemplateStep {
  id: string;
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
  created_at: string;
  steps: TemplateStep[];
}

const TemplateDetail = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchTemplateDetails = async () => {
      if (!templateId) return;

      try {
        setIsLoading(true);
        
        const { data: templateData, error: templateError } = await supabase
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

        setTemplate({
          ...templateData,
          steps: steps || []
        });
      } catch (error) {
        console.error("Error fetching template details:", error);
        toast({
          title: t('common.error'),
          description: t('templates.fetchError'),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplateDetails();
  }, [templateId, toast, t]);

  const handleEdit = () => {
    navigate(`/templates/edit/${templateId}`);
  };

  const handleCreateTask = () => {
    navigate(`/tasks/create?template=${templateId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title={t('templates.templateDetails')} showBackButton={true} />
        <div className="flex-1 flex items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title={t('templates.templateDetails')} showBackButton={true} />
        <div className="flex-1 flex items-center justify-center">
          <p>{t('templates.notFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header title={t('templates.templateDetails')} showBackButton={true} />
      
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{template.title}</h1>
            {template.description && (
              <p className="mt-2 text-muted-foreground">{template.description}</p>
            )}

            <div className="flex flex-wrap gap-3 mt-4">
              {template.location && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{template.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <ListChecks className="h-4 w-4" />
                <span>{template.steps.length} {t('tasks.steps')}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-medium">{t('tasks.steps')}</h2>
            {template.steps.length === 0 ? (
              <p className="text-muted-foreground">{t('templates.noSteps')}</p>
            ) : (
              <div className="space-y-3">
                {template.steps.map((step, index) => (
                  <div 
                    key={step.id}
                    className="p-4 border rounded-lg bg-card"
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 rounded-full bg-muted w-6 h-6 flex items-center justify-center mr-3">
                        <span className="text-xs font-medium">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className={`${step.is_optional ? "text-muted-foreground" : ""}`}>
                          {step.title}
                          {step.is_optional && <span className="ml-2 text-xs">({t('common.optional')})</span>}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {step.requires_photo && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                              {t('templates.requiresPhoto')}
                            </span>
                          )}
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            {step.interaction_type === "checkbox" ? t('templates.checkbox') : t('templates.yesNo')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleCreateTask} className="flex-1">
              {t('templates.createFromTemplate')}
            </Button>
            <Button variant="outline" onClick={handleEdit}>
              {t('templates.editTemplate')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateDetail;
