
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { TaskFormData } from "@/types/forms";
import { Profile } from "@/types";

interface AssigneeSelectProps {
  form: UseFormReturn<TaskFormData>;
  employees: Profile[];
  isLoading: boolean;
}

export const AssigneeSelect = ({ form, employees, isLoading }: AssigneeSelectProps) => {
  return (
    <FormField
      control={form.control}
      name="assignedTo"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Assign To</FormLabel>
          <Select 
            onValueChange={field.onChange} 
            defaultValue={field.value}
            disabled={isLoading}
          >
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {isLoading ? (
                <SelectItem value="loading-placeholder" disabled>
                  Loading employees...
                </SelectItem>
              ) : employees.length === 0 ? (
                <SelectItem value="no-employees-placeholder" disabled>
                  No employees found
                </SelectItem>
              ) : (
                employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id || "unknown-employee"}>
                    {employee.username || 'Unnamed'} ({employee.role || 'No role'})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
