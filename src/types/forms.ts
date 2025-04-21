
import { z } from "zod";
import { StepInteractionType, DepartmentType } from "./index";

const stepSchema = z.object({
  title: z.string().min(1, "Step title is required"),
  requiresPhoto: z.boolean().default(false),
  isOptional: z.boolean().default(false),
  interactionType: z.enum(["checkbox", "yes_no"] as const).default("checkbox")
});

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  location: z.string().min(1, "Location is required"),
  dueTime: z.string().min(1, "Due time is required"),
  assignedTo: z.string().min(1, "Assignee is required"),
  deadline: z.string().optional(),
  department: z.string().min(1, "Department is required"),
  steps: z.array(stepSchema)
    .min(1, "At least one step is required")
    .refine(steps => {
      const titles = steps.map(step => step.title);
      return new Set(titles).size === titles.length;
    }, {
      message: "Step titles must be unique",
      path: ["steps"]
    }),
  description: z.string().optional(),
  photoUrl: z.string().optional(),
  videoUrl: z.string().optional(),
});

export type TaskFormData = z.infer<typeof taskSchema>;
export type TaskStepData = z.infer<typeof stepSchema>;
