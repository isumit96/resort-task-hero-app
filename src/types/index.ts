
export type TaskStatus = "pending" | "inprogress" | "completed";
export type UserRole = "employee" | "manager" | "admin";
export type StepInteractionType = "checkbox" | "yes_no";

export interface TaskStep {
  id: string;
  title: string;
  isCompleted: boolean;
  requiresPhoto: boolean;
  comment?: string | null;
  photoUrl?: string | null;
  isOptional: boolean;
  interactionType?: StepInteractionType;
}

export interface Task {
  id: string;
  title: string;
  dueTime: string;
  location: string;
  status: TaskStatus;
  assignedTo: string;
  assigneeName?: string;
  createdAt: string;
  completedAt?: string | null;
  deadline?: string | null;
  steps: TaskStep[];
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface Profile {
  id: string;
  username?: string;
  role: UserRole;
}
