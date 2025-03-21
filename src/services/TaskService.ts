import { Task, TaskStatus, createTask, TaskPriority } from '../models/Task';

/**
 * Service for managing tasks
 */
export class TaskService {
  private storageKey = 'simple-task-tracker-tasks';
  
  /**
   * Get all tasks
   */
  getTasks(): Task[] {
    const tasksJson = localStorage.getItem(this.storageKey);
    if (!tasksJson) {
      return this.initializeWithSampleTasks();
    }
    
    try {
      // Parse the JSON and convert date strings back to Date objects
      const tasks = JSON.parse(tasksJson);
      return tasks.map((task: any) => ({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        createdAt: new Date(task.createdAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : null
      }));
    } catch (error) {
      console.error('Error parsing tasks from localStorage', error);
      return this.initializeWithSampleTasks();
    }
  }
  
  /**
   * Get active tasks (not completed)
   */
  getActiveTasks(): Task[] {
    return this.getTasks().filter(task => task.status === TaskStatus.ACTIVE);
  }
  
  /**
   * Get completed tasks
   */
  getCompletedTasks(): Task[] {
    return this.getTasks().filter(task => task.status === TaskStatus.COMPLETED);
  }
  
  /**
   * Get a task by ID
   */
  getTaskById(id: string): Task | undefined {
    return this.getTasks().find(task => task.id === id);
  }
  
  /**
   * Add a new task
   */
  addTask(title: string, dueDate: Date | null, priority: TaskPriority, notes: string): Task {
    const tasks = this.getTasks();
    const newTask = createTask(title, dueDate, priority, notes);
    
    tasks.push(newTask);
    this.saveTasks(tasks);
    
    return newTask;
  }
  
  /**
   * Update an existing task
   */
  updateTask(updatedTask: Task): Task {
    const tasks = this.getTasks();
    const index = tasks.findIndex(task => task.id === updatedTask.id);
    
    if (index !== -1) {
      tasks[index] = updatedTask;
      this.saveTasks(tasks);
    }
    
    return updatedTask;
  }
  
  /**
   * Mark a task as complete
   */
  completeTask(id: string): Task | undefined {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(task => task.id === id);
    
    if (taskIndex !== -1) {
      tasks[taskIndex].status = TaskStatus.COMPLETED;
      tasks[taskIndex].completedAt = new Date();
      this.saveTasks(tasks);
      return tasks[taskIndex];
    }
    
    return undefined;
  }
  
  /**
   * Restore a completed task to active
   */
  restoreTask(id: string): Task | undefined {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(task => task.id === id);
    
    if (taskIndex !== -1) {
      tasks[taskIndex].status = TaskStatus.ACTIVE;
      tasks[taskIndex].completedAt = null;
      this.saveTasks(tasks);
      return tasks[taskIndex];
    }
    
    return undefined;
  }
  
  /**
   * Delete a task
   */
  deleteTask(id: string): boolean {
    const tasks = this.getTasks();
    const filteredTasks = tasks.filter(task => task.id !== id);
    
    if (filteredTasks.length < tasks.length) {
      this.saveTasks(filteredTasks);
      return true;
    }
    
    return false;
  }
  
  /**
   * Save tasks to localStorage
   */
  private saveTasks(tasks: Task[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(tasks));
  }
  
  /**
   * Initialize with sample tasks if no tasks exist
   */
  private initializeWithSampleTasks(): Task[] {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const sampleTasks = [
      createTask(
        "Complete website project",
        tomorrow,
        TaskPriority.HIGH,
        "This task involves completing the Simple Task Tracker website project for the HCI class. Need to:\n\n- Design all required pages\n- Implement the 8 HCI concepts\n- Create the summary report\n- Submit all files to GitHub\n\nRemember to follow the requirements document closely."
      ),
      createTask(
        "Prepare presentation slides",
        nextWeek,
        TaskPriority.MEDIUM,
        "Create slides for the final project presentation. Include screenshots of the website and explanations of HCI principles used."
      ),
      createTask(
        "Research HCI principles",
        new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10),
        TaskPriority.LOW,
        "Find examples of good HCI implementation in popular websites and applications."
      ),
      createTask(
        "Submit project proposal",
        tomorrow,
        TaskPriority.HIGH,
        "Finalize and submit the project proposal document with timeline and deliverables."
      ),
      createTask(
        "Schedule team meeting",
        new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
        TaskPriority.MEDIUM,
        "Coordinate with team members to schedule a project planning meeting."
      )
    ];
    
    this.saveTasks(sampleTasks);
    return sampleTasks;
  }
}

// Create a singleton instance
export const taskService = new TaskService();
