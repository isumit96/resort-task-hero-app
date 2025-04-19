
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MoveVertical } from "lucide-react";
import { useRef } from "react";

type StepInteractionType = 'checkbox' | 'yes_no';

interface TaskStepInputProps {
  title: string;
  onTitleChange: (value: string) => void;
  requiresPhoto: boolean;
  onRequiresPhotoChange: (value: boolean) => void;
  isOptional: boolean;
  onIsOptionalChange: (value: boolean) => void;
  interactionType: StepInteractionType;
  onInteractionTypeChange: (value: StepInteractionType) => void;
  index?: number;
  moveStep?: (dragIndex: number, hoverIndex: number) => void;
  totalSteps?: number;
}

const TaskStepInput = ({
  title,
  onTitleChange,
  requiresPhoto,
  onRequiresPhotoChange,
  isOptional,
  onIsOptionalChange,
  interactionType,
  onInteractionTypeChange,
  index = 0,
  moveStep,
  totalSteps = 0,
}: TaskStepInputProps) => {
  const dragRef = useRef<HTMLDivElement>(null);
  const isDraggable = moveStep && typeof index === 'number' && totalSteps > 1;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isDraggable) return;
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isDraggable) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isDraggable || !moveStep) return;
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (dragIndex !== index) {
      moveStep(dragIndex, index);
    }
  };

  return (
    <div 
      className="space-y-4 relative"
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      ref={dragRef}
    >
      {isDraggable && (
        <div className="absolute right-0 top-0 cursor-move flex items-center justify-center h-8 w-8 -mt-2 -mr-2" title="Drag to reorder">
          <MoveVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      
      <div>
        <Label>Step Title</Label>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter step description"
          className="mt-1.5"
        />
      </div>

      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <Switch
            checked={requiresPhoto}
            onCheckedChange={onRequiresPhotoChange}
          />
          <Label>Requires Photo</Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={isOptional}
            onCheckedChange={onIsOptionalChange}
          />
          <Label>Optional Step</Label>
        </div>

        <div className="flex items-center gap-2">
          <Label>Input Type</Label>
          <Select value={interactionType} onValueChange={onInteractionTypeChange as (value: string) => void}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="checkbox">Checkbox</SelectItem>
              <SelectItem value="yes_no">Yes/No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default TaskStepInput;
