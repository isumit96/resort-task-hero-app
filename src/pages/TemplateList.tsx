
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader, PlusCircle, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BottomNavigation from "@/components/BottomNavigation";
import { useEmployees } from "@/hooks/useEmployees";
import { useDepartments } from "@/hooks/useDepartments";
import TemplateCard from "@/components/TemplateCard";
import { useTranslation } from "react-i18next";

interface Template {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  created_at: string;
  step_count?: number;
  department: string | null;
}

const TemplateList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all-departments");
  const { employees, isLoading: isLoadingEmployees } = useEmployees();
  const { data: departments, isLoading: isLoadingDepartments } = useDepartments();
  const { t } = useTranslation();
  
  const [locations, setLocations] = useState<string[]>([]);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data: templatesData, error: templateError } = await supabase
        .from("task_templates")
        .select(`
          *,
          template_steps:template_steps(count)
        `);

      if (templateError) {
        console.error("Error fetching templates:", templateError);
        throw templateError;
      }

      return templatesData.map((template: any) => ({
        ...template,
        step_count: template.template_steps[0]?.count || 0
      }));
    }
  });

  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("name");

      if (error) {
        console.error("Error fetching locations:", error);
        return;
      }

      if (data) {
        const locationNames = data.map(location => location.name);
        setLocations(locationNames);
      }
    };

    fetchLocations();
  }, []);

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error: stepsError } = await supabase
        .from("template_steps")
        .delete()
        .eq("template_id", templateId);

      if (stepsError) {
        throw stepsError;
      }

      const { error: templateError } = await supabase
        .from("task_templates")
        .delete()
        .eq("id", templateId);

      if (templateError) {
        throw templateError;
      }

      return templateId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast({
        title: t('templates.deleted'),
        description: t('templates.deleteSuccess'),
      });
    },
    onError: (error) => {
      console.error("Error deleting template:", error);
      toast({
        title: t('common.error'),
        description: t('templates.deleteFailed'),
        variant: "destructive",
      });
    },
  });

  const quickAssignMutation = useMutation({
    mutationFn: async ({ 
      templateId, 
      employeeId, 
      dueDate 
    }: { 
      templateId: string; 
      employeeId: string; 
      dueDate: Date;
    }) => {
      const { data: templateData, error: templateError } = await supabase
        .from("task_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (templateError) throw templateError;

      const { data: templateSteps, error: stepsError } = await supabase
        .from("template_steps")
        .select("*")
        .eq("template_id", templateId)
        .order("position", { ascending: true });

      if (stepsError) throw stepsError;

      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .insert({
          title: templateData.title,
          description: templateData.description,
          location: templateData.location,
          assigned_to: employeeId,
          due_time: dueDate.toISOString(),
          status: "pending",
        })
        .select()
        .single();

      if (taskError) throw taskError;

      const taskStepsToInsert = templateSteps.map(step => ({
        task_id: task.id,
        title: step.title,
        requires_photo: step.requires_photo,
        is_optional: step.is_optional,
        interaction_type: step.interaction_type,
      }));

      const { error: createStepsError } = await supabase
        .from("task_steps")
        .insert(taskStepsToInsert);

      if (createStepsError) throw createStepsError;

      return task;
    },
    onSuccess: () => {
      toast({
        title: t('tasks.assigned'),
        description: t('tasks.assignSuccess'),
      });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => {
      console.error("Error assigning task:", error);
      toast({
        title: t('common.error'),
        description: t('tasks.assignFailed'),
        variant: "destructive",
      });
    },
  });

  const handleQuickAssign = (templateId: string, employeeId: string, dueDate: Date) => {
    quickAssignMutation.mutate({ templateId, employeeId, dueDate });
  };

  const handleEditTemplate = (templateId: string) => {
    navigate(`/templates/edit/${templateId}`);
  };

  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      const { data: templateData, error: templateError } = await supabase
        .from("task_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (templateError) throw templateError;

      const { data: newTemplate, error: newTemplateError } = await supabase
        .from("task_templates")
        .insert({
          title: `${templateData.title} (${t('templates.copy')})`,
          description: templateData.description,
          location: templateData.location,
        })
        .select()
        .single();

      if (newTemplateError) throw newTemplateError;

      const { data: steps, error: stepsError } = await supabase
        .from("template_steps")
        .select("*")
        .eq("template_id", templateId);

      if (stepsError) throw stepsError;

      const newSteps = steps.map(step => ({
        template_id: newTemplate.id,
        title: step.title,
        requires_photo: step.requires_photo,
        is_optional: step.is_optional,
        interaction_type: step.interaction_type,
        position: step.position,
      }));

      const { error: newStepsError } = await supabase
        .from("template_steps")
        .insert(newSteps);

      if (newStepsError) throw newStepsError;

      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast({
        title: t('templates.duplicated'),
        description: t('templates.duplicateSuccess'),
      });
    } catch (error) {
      console.error("Error duplicating template:", error);
      toast({
        title: t('common.error'),
        description: t('templates.duplicateFailed'),
        variant: "destructive",
      });
    }
  };

  const handleUseTemplate = (templateId: string) => {
    navigate(`/tasks/create?template=${templateId}`);
  };

  const filteredTemplates = templates?.filter(template =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (!locationFilter || locationFilter === "all-locations" || (template.location && template.location === locationFilter)) &&
    (departmentFilter === "all-departments" || template.department === departmentFilter)
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header title={t('templates.taskTemplates')} showBackButton={true} />
      
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-20 max-w-2xl mx-auto w-full">
        <div className="mb-6 flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              className="pl-10"
              placeholder={t('templates.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 items-center">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('templates.filterByDepartment')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-departments">{t('templates.allDepartments')}</SelectItem>
                {departments?.map(dep => (
                  <SelectItem key={dep} value={dep}>
                    {dep}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              className="ml-auto"
              onClick={() => navigate('/tasks/create')}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              {t('tasks.createNew')}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTemplates?.length === 0 ? (
            <div className="text-center py-10 border rounded-lg bg-muted/20">
              <p className="text-muted-foreground">{t('templates.noTemplates')}</p>
            </div>
          ) : (
            filteredTemplates?.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={handleUseTemplate}
                onQuickAssign={handleQuickAssign}
                onEdit={handleEditTemplate}
                onDuplicate={handleDuplicateTemplate}
                onDelete={(id) => deleteTemplateMutation.mutate(id)}
                employees={employees}
                isLoadingEmployees={isLoadingEmployees}
              />
            ))
          )}
        </div>
      </div>

      <div className="h-16" />
      <BottomNavigation />
    </div>
  );
};

export default TemplateList;
