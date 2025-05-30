
import { Button } from "@/components/ui/button";
import { FileEdit, CopyPlus, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { QuickAssignDialog } from "@/components/QuickAssignDialog";
import { useState } from "react";
import { Profile } from "@/types";
import DepartmentLabel from "./DepartmentLabel";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  
  const handleQuickAssign = ({
    employeeId,
    dueDate
  }: {
    employeeId: string;
    dueDate: Date;
  }) => {
    onQuickAssign(template.id, employeeId, dueDate);
    setIsQuickAssignOpen(false);
  };

  return (
    <div className="border rounded-lg p-4 bg-card overflow-hidden flex flex-col justify-between h-full">
      {/* Card Content */}
      <div className="flex-1">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-medium text-lg">{template.title}</h3>
        </div>
        {template.description && (
          <>
            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{template.description}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {template.location && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground whitespace-nowrap">
                  {template.location}
                </span>
              )}
              {template.step_count !== undefined && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/20 text-secondary-foreground whitespace-nowrap">
                  {template.step_count} {t('tasks.steps')}
                </span>
              )}
            </div>
          </>
        )}
        {!template.description && (
          <>
            <div className="flex flex-wrap gap-2 mt-2">
              {template.location && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground whitespace-nowrap">
                  {template.location}
                </span>
              )}
              {template.step_count !== undefined && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/20 text-secondary-foreground whitespace-nowrap">
                  {template.step_count} {t('tasks.steps')}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2 mt-4 w-full">
        {/* CTAs (always side by side) */}
        <div className="flex flex-row gap-2 w-full">
          <Button onClick={() => onUse(template.id)} className="flex-1" size="sm">
            {t('templates.useTemplate')}
          </Button>
          <Button onClick={() => setIsQuickAssignOpen(true)} variant="outline" size="sm" className="flex-1">
            {t('templates.quickAssign')}
          </Button>
        </div>

        <div className="flex justify-between items-center">
          {/* Department label on the left with icon */}
          <DepartmentLabel department={template.department} />

          {/* Icons Buttons on the right */}
          <div className="flex justify-end gap-2" aria-label="Template Actions">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => onEdit(template.id)} title={t('common.edit')}>
              <FileEdit className="h-4 w-4" />
              <span className="sr-only">{t('common.edit')}</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => onDuplicate(template.id)} title={t('templates.duplicate')}>
              <CopyPlus className="h-4 w-4" />
              <span className="sr-only">{t('templates.duplicate')}</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  title={t('common.delete')}>
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">{t('common.delete')}</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('templates.deleteTemplate')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('templates.deleteTemplateConfirm')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => onDelete(template.id)}>
                    {t('common.delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <QuickAssignDialog isOpen={isQuickAssignOpen} onClose={() => setIsQuickAssignOpen(false)} onAssign={handleQuickAssign} template={template} employees={employees} isLoading={isLoadingEmployees} />
    </div>
  );
};

export default TemplateCard;
