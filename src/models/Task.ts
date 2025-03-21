/**
 * Represents a task priority level
 */
export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high"
}

/**
 * Represents a task status
 */
export enum TaskStatus {
  ACTIVE = "active",
  COMPLETED = "completed"
}

/**
 * Interface representing a Task
 */
export interface Task {
  id: string;
  title: string;
  dueDate: Date | null;
  priority: TaskPriority;
  notes: string;
  createdAt: Date;
  completedAt: Date | null;
  status: TaskStatus;
}

/**
 * Helper function to create a new task
 */
export function createTask(
  title: string,
  dueDate: Date | null = null,
  priority: TaskPriority = TaskPriority.MEDIUM,
  notes: string = ""
): Task {
  return {
    id: generateId(),
    title,
    dueDate,
    priority,
    notes,
    createdAt: new Date(),
    completedAt: null,
    status: TaskStatus.ACTIVE
  };
}

/**
 * Helper function to generate a unique ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
