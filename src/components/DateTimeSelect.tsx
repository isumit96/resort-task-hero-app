
import { useState, useEffect } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";
import { TaskFormData } from "@/types/forms";

interface DateTimeSelectProps {
  form: UseFormReturn<TaskFormData>;
  isDeadline: boolean;
  label: string;
  required: boolean;
}

export const DateTimeSelect = ({ form, isDeadline, label, required }: DateTimeSelectProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");

  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  });

  useEffect(() => {
    if (selectedDate && (selectedTime || !required)) {
      try {
        const dateObj = new Date(selectedDate);
        if (selectedTime) {
          const [hours, minutes] = selectedTime.split(':').map(Number);
          dateObj.setHours(hours, minutes);
        } else {
          dateObj.setHours(23, 59, 59, 999);
        }
        
        form.setValue(isDeadline ? 'deadline' : 'dueTime', dateObj.toISOString());
        if (!isDeadline) {
          form.clearErrors('dueTime');
        }
      } catch (err) {
        console.error("Error combining date and time:", err);
      }
    }
  }, [selectedDate, selectedTime, form, isDeadline, required]);

  return (
    <FormField
      control={form.control}
      name={isDeadline ? "deadline" : "dueTime"}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal flex-1",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Select 
              value={selectedTime} 
              onValueChange={setSelectedTime}
            >
              <SelectTrigger className="w-[140px]">
                <Clock className="mr-2 h-4 w-4" />
                {selectedTime || "Select time"}
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
