
import { Task, TaskStatus } from '../types';

// Generate a unique ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// Mock tasks data
export const mockTasks: Task[] = [
  {
    id: generateId(),
    title: 'Before Checkin',
    dueTime: '10:00 AM',
    location: 'Room 101',
    status: 'pending',
    assignedTo: 'emp123',
    createdAt: new Date().toISOString(),
    steps: [
      {
        id: generateId(),
        title: 'Dust window sills and surfaces',
        isCompleted: false,
        requiresPhoto: false,
      },
      {
        id: generateId(),
        title: 'Vacuum carpet and rugs',
        isCompleted: false,
        requiresPhoto: false,
      },
      {
        id: generateId(),
        title: 'Mop floor',
        isCompleted: false,
        requiresPhoto: true,
      },
      {
        id: generateId(),
        title: 'Replace shampoo & handwash',
        isCompleted: false,
        requiresPhoto: false,
      },
      {
        id: generateId(),
        title: 'Make bed with fresh linens',
        isCompleted: false,
        requiresPhoto: true,
      }
    ],
  },
  {
    id: generateId(),
    title: 'At Checkout',
    dueTime: '12:00 PM',
    location: 'Room 102',
    status: 'inprogress',
    assignedTo: 'emp123',
    createdAt: new Date().toISOString(),
    steps: [
      {
        id: generateId(),
        title: 'Strip bed linens',
        isCompleted: true,
        requiresPhoto: false,
      },
      {
        id: generateId(),
        title: 'Check for lost items',
        isCompleted: true,
        requiresPhoto: false,
      },
      {
        id: generateId(),
        title: 'Clean bathroom thoroughly',
        isCompleted: false,
        requiresPhoto: true,
      },
      {
        id: generateId(),
        title: 'Report any damages',
        isCompleted: false,
        requiresPhoto: true,
      }
    ],
  },
  {
    id: generateId(),
    title: 'Weekly Deep Clean',
    dueTime: '2:00 PM',
    location: 'Room 103',
    status: 'pending',
    assignedTo: 'emp123',
    createdAt: new Date().toISOString(),
    steps: [
      {
        id: generateId(),
        title: 'Clean air conditioning filters',
        isCompleted: false,
        requiresPhoto: true,
      },
      {
        id: generateId(),
        title: 'Wash curtains',
        isCompleted: false,
        requiresPhoto: false,
      },
      {
        id: generateId(),
        title: 'Sanitize remote controls',
        isCompleted: false,
        requiresPhoto: false,
      },
      {
        id: generateId(),
        title: 'Clean inside drawers and wardrobes',
        isCompleted: false,
        requiresPhoto: true,
      }
    ],
  },
  {
    id: generateId(),
    title: 'Pest Control Check',
    dueTime: '3:00 PM',
    location: 'Room 104',
    status: 'completed',
    assignedTo: 'emp123',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    completedAt: new Date().toISOString(),
    steps: [
      {
        id: generateId(),
        title: 'Check for signs of pests',
        isCompleted: true,
        requiresPhoto: false,
      },
      {
        id: generateId(),
        title: 'Apply pest control solution',
        isCompleted: true,
        requiresPhoto: true,
        photoUrl: 'https://picsum.photos/200/300', // Placeholder image
      },
      {
        id: generateId(),
        title: 'Document treatment in logbook',
        isCompleted: true,
        requiresPhoto: false,
        comment: 'Applied standard treatment as per protocol',
      }
    ],
  },
  {
    id: generateId(),
    title: 'Daily Cleaning',
    dueTime: '4:30 PM',
    location: 'Room 105',
    status: 'completed',
    assignedTo: 'emp123',
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    completedAt: new Date(Date.now() - 158400000).toISOString(), // 2 days ago + 4 hours
    steps: [
      {
        id: generateId(),
        title: 'Replace towels',
        isCompleted: true,
        requiresPhoto: false,
      },
      {
        id: generateId(),
        title: 'Take out trash',
        isCompleted: true,
        requiresPhoto: false,
      },
      {
        id: generateId(),
        title: 'Wipe bathroom surfaces',
        isCompleted: true,
        requiresPhoto: false,
      }
    ],
  }
];

// Get current user's tasks for today
export const getCurrentUserTasks = (userId: string): Task[] => {
  return mockTasks.filter(task => 
    task.assignedTo === userId && 
    (task.status === 'pending' || task.status === 'inprogress')
  );
};

// Get tasks history
export const getTaskHistory = (userId: string): Task[] => {
  return mockTasks.filter(task => 
    task.assignedTo === userId && 
    task.status === 'completed'
  );
};

// Get a specific task by ID
export const getTaskById = (taskId: string): Task | undefined => {
  return mockTasks.find(task => task.id === taskId);
};

// Update a task's status
export const updateTaskStatus = (taskId: string, status: TaskStatus): void => {
  const task = mockTasks.find(task => task.id === taskId);
  if (task) {
    task.status = status;
    if (status === 'completed') {
      task.completedAt = new Date().toISOString();
    }
  }
};

// Update a task step
export const updateTaskStep = (
  taskId: string, 
  stepId: string, 
  isCompleted: boolean, 
  comment?: string, 
  photoUrl?: string
): void => {
  const task = mockTasks.find(task => task.id === taskId);
  if (task) {
    const step = task.steps.find(step => step.id === stepId);
    if (step) {
      step.isCompleted = isCompleted;
      if (comment) step.comment = comment;
      if (photoUrl) step.photoUrl = photoUrl;
    }
    
    // Check if all steps are completed to update task status
    const allStepsCompleted = task.steps.every(step => step.isCompleted);
    if (allStepsCompleted) {
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
    } else if (task.steps.some(step => step.isCompleted)) {
      task.status = 'inprogress';
    }
  }
};

// Mock authentication function
export const authenticateUser = (credential: string): string | null => {
  // In a real app, this would validate against a database
  // For demo purposes, we'll accept any non-empty string
  if (credential && credential.length > 0) {
    return 'emp123'; // Return a mock user ID
  }
  return null;
};
