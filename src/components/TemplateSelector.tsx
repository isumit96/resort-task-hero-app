
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { FileSearch, Loader } from "lucide-react";

interface Template {
  id: string;
  title: string;
  location: string | null;
  step_count?: number;
}

interface TemplateSelectorProps {
  onSelectTemplate: (templateId: string) => void;
}

const TemplateSelector = ({ onSelectTemplate }: TemplateSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("task_templates")
        .select(`
          *,
          template_steps:template_steps(count)
        `);

      if (error) throw error;

      // Transform the data to include step counts
      const formattedTemplates = data.map((template: any) => ({
        id: template.id,
        title: template.title,
        location: template.location || "No location", // Provide default value for null locations
        step_count: template.template_steps[0]?.count || 0
      }));

      setTemplates(formattedTemplates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Error",
        description: "Failed to fetch templates.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    onSelectTemplate(templateId);
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => setIsOpen(true)}
      >
        <FileSearch className="mr-2 h-4 w-4" />
        Load from template
      </Button>
      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <Command className="rounded-lg border shadow-md">
          <CommandInput placeholder="Search templates..." />
          <CommandList>
            <CommandEmpty>No templates found.</CommandEmpty>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <CommandGroup heading="Available templates">
                {templates.map((template) => (
                  <CommandItem
                    key={template.id}
                    onSelect={() => handleSelectTemplate(template.id)}
                  >
                    <div className="flex flex-col">
                      <span>{template.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {template.location && `${template.location} • `}
                        {template.step_count} steps
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
};

export default TemplateSelector;
