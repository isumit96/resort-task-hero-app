
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

interface TaskStepInputProps {
  title: string;
  onTitleChange: (value: string) => void;
  requiresPhoto: boolean;
  onRequiresPhotoChange: (value: boolean) => void;
  isOptional: boolean;
  onIsOptionalChange: (value: boolean) => void;
  interactionType: 'checkbox' | 'yes_no';
  onInteractionTypeChange: (value: 'checkbox' | 'yes_no') => void;
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
}: TaskStepInputProps) => {
  return (
    <div className="space-y-4">
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
          <Select value={interactionType} onValueChange={onInteractionTypeChange}>
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
