/**
 * HomePage class - Handles all functionality for the home page
 */

import { taskService } from '../services/TaskService';
import { Task, TaskStatus, TaskPriority } from '../models/Task';
import { formatDateToInput, isToday, isThisWeek } from '../utils/DateUtils';

export class HomePage {
  private quickAddBtn: HTMLElement | null;
  private quickAddModal: HTMLElement | null;
  private closeModalBtns: NodeListOf<HTMLElement>;
  private cancelModalBtns: NodeListOf<HTMLElement>;
  private quickAddForm: HTMLFormElement | null;
  private successToast: HTMLElement | null;

  constructor() {
    this.quickAddBtn = document.getElementById('quick-add-btn');
    this.quickAddModal = document.getElementById('quick-add-modal');
    this.closeModalBtns = document.querySelectorAll('.close-modal');
    this.cancelModalBtns = document.querySelectorAll('.cancel-modal');
    this.quickAddForm = document.getElementById('quick-add-form') as HTMLFormElement;
    this.successToast = document.getElementById('success-toast');
  }

  /**
   * Initialize the home page
   */
  public initialize(): void {
    this.updateTaskStats();
    this.setupEventListeners();
  }

  /**
   * Set up all event listeners for the home page
   */
  private setupEventListeners(): void {
    // Quick add task button
    if (this.quickAddBtn && this.quickAddModal) {
      this.quickAddBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showQuickAddModal();
      });
    }

    // Close modal buttons
    this.closeModalBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.quickAddModal) {
          this.quickAddModal.style.display = 'none';
        }
      });
    });

    // Cancel modal buttons
    this.cancelModalBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.quickAddModal) {
          this.quickAddModal.style.display = 'none';
        }
      });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
      if (this.quickAddModal && e.target === this.quickAddModal) {
        this.quickAddModal.style.display = 'none';
      }
    });

    // Quick add form submission
    if (this.quickAddForm) {
      this.quickAddForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleQuickAddSubmit();
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

      if (!isInput) {
        // N - New task
        if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          this.showQuickAddModal();
        }
      }
    });
  }

  /**
   * Show the quick add modal
   */
  private showQuickAddModal(): void {
    if (this.quickAddModal && this.quickAddForm) {
      // Reset form
      this.quickAddForm.reset();
      
      // Set default due date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dueDateInput = document.getElementById('task-due-date') as HTMLInputElement;
      if (dueDateInput) {
        dueDateInput.value = formatDateToInput(tomorrow);
      }
      
      // Show modal
      this.quickAddModal.style.display = 'flex';
      
      // Focus on title input
      const titleInput = document.getElementById('task-title') as HTMLInputElement;
      if (titleInput) {
        setTimeout(() => {
          titleInput.focus();
        }, 100);
      }
    }
  }

  /**
   * Handle the submission of the quick add form
   */
  private handleQuickAddSubmit(): void {
    if (this.quickAddForm) {
      const titleInput = document.getElementById('task-title') as HTMLInputElement;
      const dueDateInput = document.getElementById('task-due-date') as HTMLInputElement;
      const prioritySelect = document.getElementById('task-priority') as HTMLSelectElement;
      const notesTextarea = document.getElementById('task-notes') as HTMLTextAreaElement;
      
      if (titleInput && dueDateInput && prioritySelect && notesTextarea) {
        const title = titleInput.value.trim();
        const dueDate = dueDateInput.value ? new Date(dueDateInput.value) : null;
        const priority = prioritySelect.value as TaskPriority;
        const notes = notesTextarea.value.trim();
        
        if (title) {
          // Add the task
          taskService.addTask(title, dueDate, priority, notes);
          
          // Close modal
          if (this.quickAddModal) {
            this.quickAddModal.style.display = 'none';
          }
          
          // Show success toast
          this.showSuccessToast('Task added successfully!');
          
          // Update stats
          this.updateTaskStats();
        }
      }
    }
  }

  /**
   * Update task statistics on the home page
   */
  private updateTaskStats(): void {
    const tasks = taskService.getTasks();
    const activeTasks = tasks.filter(task => task.status === TaskStatus.ACTIVE);
    const completedTasks = tasks.filter(task => task.status === TaskStatus.COMPLETED);
    
    // Update stats on the page
    const dueTodayElement = document.getElementById('due-today');
    const dueWeekElement = document.getElementById('due-week');
    const highPriorityElement = document.getElementById('high-priority');
    const completedTotalElement = document.getElementById('completed-total');
    
    if (dueTodayElement) {
      const dueToday = activeTasks.filter(task => task.dueDate && isToday(task.dueDate)).length;
      dueTodayElement.textContent = dueToday.toString();
    }
    
    if (dueWeekElement) {
      const dueThisWeek = activeTasks.filter(task => task.dueDate && isThisWeek(task.dueDate)).length;
      dueWeekElement.textContent = dueThisWeek.toString();
    }
    
    if (highPriorityElement) {
      const highPriority = activeTasks.filter(task => task.priority === TaskPriority.HIGH).length;
      highPriorityElement.textContent = highPriority.toString();
    }
    
    if (completedTotalElement) {
      completedTotalElement.textContent = completedTasks.length.toString();
    }
  }

  /**
   * Show a success toast message
   */
  private showSuccessToast(message: string): void {
    if (this.successToast) {
      const messageElement = document.getElementById('toast-message');
      if (messageElement) {
        messageElement.textContent = message;
      }
      
      this.successToast.classList.add('visible');
      
      if (this.successToast) {
        this.successToast.classList.add('visible');
      }
    }
  }
}
