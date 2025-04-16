
export type TaskStatus = 'pending' | 'inprogress' | 'completed';

export interface TaskStep {
  id: string;
  title: string;
  isCompleted: boolean;
  requiresPhoto: boolean;
  comment?: string;
  photoUrl?: string;
}

export interface Task {
  id: string;
  title: string;
  dueTime: string;
  location: string;
  status: TaskStatus;
  assignedTo: string;
  steps: TaskStep[];
  createdAt: string;
  completedAt?: string;
}
