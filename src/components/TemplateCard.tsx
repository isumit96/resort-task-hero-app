
import { Button } from "@/components/ui/button";
import { FileEdit, CopyPlus, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface TemplateCardProps {
  template: {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    step_count?: number;
  };
  onUse: (templateId: string) => void;
  onQuickAssign: (templateId: string) => void;
  onEdit: (templateId: string) => void;
  onDuplicate: (templateId: string) => void;
  onDelete: (templateId: string) => void;
}

const TemplateCard = ({ 
  template, 
  onUse, 
  onQuickAssign, 
  onEdit, 
  onDuplicate, 
  onDelete 
}: TemplateCardProps) => {
  return (
    <div className="border rounded-lg p-4 bg-card">
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
        {template.step_count !== undefined && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/20 text-secondary-foreground">
            {template.step_count} steps
          </span>
        )}
      </div>
      
      <div className="flex mt-4 gap-2">
        <Button 
          onClick={() => onUse(template.id)}
          className="flex-1"
          size="sm"
        >
          Use Template
        </Button>
        
        <Button 
          onClick={() => onQuickAssign(template.id)}
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
            onClick={() => onEdit(template.id)}
          >
            <FileEdit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => onDuplicate(template.id)}
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
                  onClick={() => onDelete(template.id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;
