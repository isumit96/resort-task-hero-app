
import { Button } from "@/components/ui/button";
import { FileEdit, CopyPlus, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { QuickAssignDialog } from "@/components/QuickAssignDialog";
import { useState } from "react";
import { Profile } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";

interface TemplateCardProps {
  template: {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    step_count?: number;
    department?: string;
  };
  onUse: (templateId: string) => void;
  onQuickAssign: (templateId: string, employeeId: string, dueDate: Date) => void;
  onEdit: (templateId: string) => void;
  onDuplicate: (templateId: string) => void;
  onDelete: (templateId: string) => void;
  employees: Profile[];
  isLoadingEmployees: boolean;
}

const TemplateCard = ({
  template, 
  onUse, 
  onQuickAssign, 
  onEdit, 
  onDuplicate, 
  onDelete,
  employees,
  isLoadingEmployees
}: TemplateCardProps) => {
  const [isQuickAssignOpen, setIsQuickAssignOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleQuickAssign = ({ employeeId, dueDate }: { employeeId: string; dueDate: Date }) => {
    onQuickAssign(template.id, employeeId, dueDate);
    setIsQuickAssignOpen(false);
  };

  return (
    <div className="border rounded-lg p-4 bg-card overflow-hidden flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-medium text-lg">{template.title}</h3>
        </div>
        {template.description && (
          <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{template.description}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-2">
          {template.location && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {template.location}
            </span>
          )}
          {template.step_count !== undefined && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/20 text-secondary-foreground">
              {template.step_count} steps
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Button 
            onClick={() => onUse(template.id)}
            className={`${isMobile ? 'flex-1 min-w-0' : 'flex-1'}`}
            size={isMobile ? "sm" : "sm"}
          >
            Use Template
          </Button>
          
          <Button 
            onClick={() => setIsQuickAssignOpen(true)}
            variant="outline"
            size={isMobile ? "sm" : "sm"}
            className={`${isMobile ? 'flex-1 min-w-0' : ''}`}
          >
            Quick Assign
          </Button>
        </div>

        <div className={`flex ${isMobile ? 'w-full justify-end mt-2' : ''} gap-2`}>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => onEdit(template.id)}
            title="Edit"
          >
            <FileEdit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => onDuplicate(template.id)}
            title="Duplicate"
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
                title="Delete"
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
                  onClick={() => onDelete(template.id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {template.department && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground whitespace-nowrap mt-4">
          {template.department}
        </span>
      )}

      <QuickAssignDialog
        isOpen={isQuickAssignOpen}
        onClose={() => setIsQuickAssignOpen(false)}
        onAssign={handleQuickAssign}
        template={template}
        employees={employees}
        isLoading={isLoadingEmployees}
      />
    </div>
  );
};

export default TemplateCard;

