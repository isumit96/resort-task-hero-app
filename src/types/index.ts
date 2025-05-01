
export type TaskStatus = "pending" | "inprogress" | "completed";
export type UserRole = "employee" | "manager" | "admin";
export type StepInteractionType = "checkbox" | "yes_no";

export type DepartmentType = 
  | "Housekeeping"
  | "Front Office"
  | "Kitchen"
  | "Activities"
  | "Gardening";

export interface TaskStep {
  id: string;
  title: string;
  title_hi?: string | null;
  title_kn?: string | null;
  isCompleted: boolean;
  requiresPhoto: boolean;
  comment?: string | null;
  comment_hi?: string | null;
  comment_kn?: string | null;
  photoUrl?: string | null;
  isOptional: boolean;
  interactionType?: StepInteractionType;
}

export interface Task {
  id: string;
  title: string;
  title_hi?: string | null;
  title_kn?: string | null;
  dueTime: string;
  location: string;
  location_hi?: string | null;
  location_kn?: string | null;
  status: TaskStatus;
  assignedTo: string;
  assigneeName?: string;
  createdAt: string;
  completedAt?: string | null;
  deadline?: string | null;
  steps: TaskStep[];
  department?: DepartmentType;
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
  department?: DepartmentType;
}

export interface TaskTemplate {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  created_at: string;
  step_count?: number;
  department?: DepartmentType;
}
