
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader, PlusCircle, Search, FileEdit, CopyPlus, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TemplateCard from "@/components/TemplateCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import BottomNavigation from "@/components/BottomNavigation";

interface Template {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  created_at: string;
  step_count?: number;
}

const TemplateList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [isQuickAssignDialogOpen, setIsQuickAssignDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [locations, setLocations] = useState<string[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Fetch templates with their step counts
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

      // Transform the data to include step counts
      return templatesData.map((template: any) => ({
        ...template,
        step_count: template.template_steps[0]?.count || 0
      }));
    }
  });

  // Fetch locations for filtering
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

  // Fetch employees for assignment
  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, role");

      if (error) {
        console.error("Error fetching employees:", error);
        return;
      }

      if (data) {
        setEmployees(data);
      }
    };

    fetchEmployees();
  }, []);

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      // First delete the template steps
      const { error: stepsError } = await supabase
        .from("template_steps")
        .delete()
        .eq("template_id", templateId);

      if (stepsError) {
        throw stepsError;
      }

      // Then delete the template itself
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
        title: "Template deleted",
        description: "The template has been successfully deleted.",
      });
    },
    onError: (error) => {
      console.error("Error deleting template:", error);
      toast({
        title: "Error",
        description: "Failed to delete template.",
        variant: "destructive",
      });
    },
  });

  // Quick assign task from template mutation
  const quickAssignMutation = useMutation({
    mutationFn: async ({ templateId, employeeId }: { templateId: string, employeeId: string }) => {
      // First fetch the template details
      const { data: templateData, error: templateError } = await supabase
        .from("task_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (templateError) throw templateError;

      // Then fetch the template steps
      const { data: templateSteps, error: stepsError } = await supabase
        .from("template_steps")
        .select("*")
        .eq("template_id", templateId)
        .order("position", { ascending: true });

      if (stepsError) throw stepsError;

      // Create a new task based on the template
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .insert({
          title: templateData.title,
          description: templateData.description,
          location: templateData.location,
          assigned_to: employeeId,
          due_time: new Date().toISOString(), // Default to now, can be improved
          status: "pending",
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Create task steps based on template steps
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
      setIsQuickAssignDialogOpen(false);
      setSelectedTemplate(null);
      setSelectedEmployee("");
      toast({
        title: "Task assigned",
        description: "The task has been successfully created and assigned.",
      });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => {
      console.error("Error assigning task:", error);
      toast({
        title: "Error",
        description: "Failed to assign task.",
        variant: "destructive",
      });
    },
  });

  // Filter templates based on search query and location
  const filteredTemplates = templates?.filter(template => 
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (!locationFilter || (template.location && template.location === locationFilter))
  );

  const handleEditTemplate = (templateId: string) => {
    navigate(`/templates/edit/${templateId}`);
  };

  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      // Fetch the template to duplicate
      const { data: templateData, error: templateError } = await supabase
        .from("task_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (templateError) throw templateError;

      // Create a new template based on the original
      const { data: newTemplate, error: newTemplateError } = await supabase
        .from("task_templates")
        .insert({
          title: `${templateData.title} (Copy)`,
          description: templateData.description,
          location: templateData.location,
        })
        .select()
        .single();

      if (newTemplateError) throw newTemplateError;

      // Fetch the steps from the original template
      const { data: steps, error: stepsError } = await supabase
        .from("template_steps")
        .select("*")
        .eq("template_id", templateId);

      if (stepsError) throw stepsError;

      // Create steps for the new template
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
        title: "Template duplicated",
        description: "The template has been successfully duplicated.",
      });
    } catch (error) {
      console.error("Error duplicating template:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate template.",
        variant: "destructive",
      });
    }
  };

  const openQuickAssignDialog = (template: Template) => {
    setSelectedTemplate(template);
    setIsQuickAssignDialogOpen(true);
  };

  const handleQuickAssign = () => {
    if (!selectedTemplate || !selectedEmployee) {
      toast({
        title: "Missing information",
        description: "Please select an employee to assign this task to.",
        variant: "destructive",
      });
      return;
    }

    quickAssignMutation.mutate({ 
      templateId: selectedTemplate.id, 
      employeeId: selectedEmployee 
    });
  };

  const handleUseTemplate = (templateId: string) => {
    navigate(`/tasks/create?template=${templateId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header title="Task Templates" showBackButton={true} />
      
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-20 max-w-2xl mx-auto w-full">
        <div className="mb-6 flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              className="pl-10"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 items-center">
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Locations</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              className="ml-auto"
              onClick={() => navigate('/tasks/create')}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              New Task
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
              <p className="text-muted-foreground">No templates found</p>
            </div>
          ) : (
            filteredTemplates?.map((template) => (
              <div key={template.id} className="border rounded-lg p-4 bg-card">
                <h3 className="font-medium text-lg">{template.title}</h3>
                
                {template.description && (
                  <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{template.description}</p>
                )}
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {template.location && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {template.location}
                    </span>
                  )}
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/20 text-secondary-foreground">
                    {template.step_count} steps
                  </span>
                </div>
                
                <div className="flex mt-4 gap-2">
                  <Button 
                    onClick={() => handleUseTemplate(template.id)}
                    className="flex-1"
                    size="sm"
                  >
                    Use Template
                  </Button>
                  
                  <Button 
                    onClick={() => openQuickAssignDialog(template)}
                    variant="outline"
                    size="sm"
                  >
                    Quick Assign
                  </Button>
                  
                  <div className="flex">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0"
                      onClick={() => handleEditTemplate(template.id)}
                    >
                      <FileEdit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0"
                      onClick={() => handleDuplicateTemplate(template.id)}
                    >
                      <CopyPlus className="h-4 w-4" />
                      <span className="sr-only">Duplicate</span>
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Template</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this template? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteTemplateMutation.mutate(template.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Quick Assign Dialog */}
      <Dialog open={isQuickAssignDialogOpen} onOpenChange={setIsQuickAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Task</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-2 font-medium">Template: {selectedTemplate?.title}</p>
            <p className="mb-4 text-sm text-muted-foreground">Select an employee to assign this task to:</p>
            
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.username || 'Unnamed'} ({employee.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuickAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleQuickAssign} disabled={!selectedEmployee || quickAssignMutation.isPending}>
              {quickAssignMutation.isPending ? "Assigning..." : "Assign Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="h-16" />
      <BottomNavigation />
    </div>
  );
};

export default TemplateList;
