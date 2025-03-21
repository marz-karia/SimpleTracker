/**
 * TaskDetailsPage class - Handles all functionality for the task details page
 */

import { taskService } from '../services/TaskService';
import { Task, TaskStatus, TaskPriority } from '../models/Task';
import { 
  formatDateForDisplay, 
  formatDateToInput, 
  getTimeRemainingText,
  getDaysRemaining
} from '../utils/DateUtils';

export class TaskDetailsPage {
  private backToListBtn: HTMLElement | null;
  private editTaskBtn: HTMLElement | null;
  private completeTaskBtn: HTMLElement | null;
  private deleteTaskBtn: HTMLElement | null;
  private postponeTaskBtn: HTMLElement | null;
  private duplicateTaskBtn: HTMLElement | null;
  private editTaskModal: HTMLElement | null;
  private postponeModal: HTMLElement | null;
  private deleteConfirmModal: HTMLElement | null;
  private editTaskForm: HTMLFormElement | null;
  private postponeForm: HTMLFormElement | null;
  private successToast: HTMLElement | null;
  
  private taskId: string | null = null;
  private task: Task | null = null;

  constructor() {
    this.backToListBtn = document.getElementById('back-to-list');
    this.editTaskBtn = document.getElementById('edit-task-btn');
    this.completeTaskBtn = document.getElementById('complete-task-btn');
    this.deleteTaskBtn = document.getElementById('delete-task-btn');
    this.postponeTaskBtn = document.getElementById('postpone-task-btn');
    this.duplicateTaskBtn = document.getElementById('duplicate-task-btn');
    this.editTaskModal = document.getElementById('edit-task-modal');
    this.postponeModal = document.getElementById('postpone-modal');
    this.deleteConfirmModal = document.getElementById('delete-confirm-modal');
    this.editTaskForm = document.getElementById('edit-task-form') as HTMLFormElement;
    this.postponeForm = document.getElementById('postpone-form') as HTMLFormElement;
    this.successToast = document.getElementById('success-toast');
    
    // Get task ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    this.taskId = urlParams.get('id');
  }

  /**
   * Initialize the task details page
   */
  public initialize(): void {
    if (!this.taskId) {
      // Redirect to task list if no task ID
      window.location.href = 'tasks.html';
      return;
    }
    
    this.loadTask();
    this.setupEventListeners();
  }

  /**
   * Load task from the task service
   */
  private loadTask(): void {
    if (!this.taskId) return;
    
    const task = taskService.getTaskById(this.taskId);
    if (task) {
      this.task = task;
    } else {
      this.task = null;
    }
    
    if (!this.task) {
      // Redirect to task list if task not found
      window.location.href = 'tasks.html';
      return;
    }
    
    // Check if task is completed and redirect if needed
    if (this.task.status === TaskStatus.COMPLETED) {
      window.location.href = 'completed-tasks.html';
      return;
    }
    
    this.renderTaskDetails();
  }

  /**
   * Set up all event listeners for the task details page
   */
  private setupEventListeners(): void {
    // Back to list button
    if (this.backToListBtn) {
      this.backToListBtn.addEventListener('click', () => {
        window.location.href = 'tasks.html';
      });
    }
    
    // Edit task button
    if (this.editTaskBtn) {
      this.editTaskBtn.addEventListener('click', () => {
        this.showEditTaskModal();
      });
    }
    
    // Complete task button
    if (this.completeTaskBtn) {
      this.completeTaskBtn.addEventListener('click', () => {
        if (this.taskId) {
          this.completeTask();
        }
      });
    }
    
    // Delete task button
    if (this.deleteTaskBtn) {
      this.deleteTaskBtn.addEventListener('click', () => {
        this.showDeleteConfirmation();
      });
    }
    
    // Postpone task button
    if (this.postponeTaskBtn) {
      this.postponeTaskBtn.addEventListener('click', () => {
        this.showPostponeModal();
      });
    }
    
    // Duplicate task button
    if (this.duplicateTaskBtn) {
      this.duplicateTaskBtn.addEventListener('click', () => {
        this.duplicateTask();
      });
    }
    
    // Edit task form submission
    if (this.editTaskForm) {
      this.editTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleEditTaskSubmit();
      });
    }
    
    // Postpone form submission
    if (this.postponeForm) {
      this.postponeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handlePostponeSubmit();
      });
    }
    
    // Custom date toggle in postpone modal
    const postponeOption = document.getElementById('postpone-option') as HTMLSelectElement;
    const customDateGroup = document.getElementById('custom-date-group');
    
    if (postponeOption && customDateGroup) {
      postponeOption.addEventListener('change', () => {
        customDateGroup.style.display = postponeOption.value === 'custom' ? 'block' : 'none';
      });
    }
    
    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.editTaskModal) this.editTaskModal.style.display = 'none';
        if (this.postponeModal) this.postponeModal.style.display = 'none';
        if (this.deleteConfirmModal) this.deleteConfirmModal.style.display = 'none';
      });
    });
    
    // Cancel modal buttons
    document.querySelectorAll('.cancel-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.editTaskModal) this.editTaskModal.style.display = 'none';
        if (this.postponeModal) this.postponeModal.style.display = 'none';
        if (this.deleteConfirmModal) this.deleteConfirmModal.style.display = 'none';
      });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
      if (this.editTaskModal && e.target === this.editTaskModal) {
        this.editTaskModal.style.display = 'none';
      }
      if (this.postponeModal && e.target === this.postponeModal) {
        this.postponeModal.style.display = 'none';
      }
      if (this.deleteConfirmModal && e.target === this.deleteConfirmModal) {
        this.deleteConfirmModal.style.display = 'none';
      }
    });
    
    // Confirm delete button
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', () => {
        this.deleteTask();
      });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
      
      if (!isInput) {
        // E - Edit task
        if (e.key === 'e' || e.key === 'E') {
          e.preventDefault();
          this.showEditTaskModal();
        }
        
        // C - Complete task
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          this.completeTask();
        }
        
        // D - Delete task
        if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          this.showDeleteConfirmation();
        }
        
        // B - Back to list
        if (e.key === 'b' || e.key === 'B') {
          e.preventDefault();
          window.location.href = 'tasks.html';
        }
      }
    });
  }

  /**
   * Render task details to the page
   */
  private renderTaskDetails(): void {
    if (!this.task) return;
    
    // Update page title and breadcrumb
    document.title = `Task: ${this.task.title} - Simple Task Tracker`;
    
    const breadcrumbTaskTitle = document.getElementById('breadcrumb-task-title');
    if (breadcrumbTaskTitle) breadcrumbTaskTitle.textContent = this.task.title;
    
    // Update task title header
    const taskTitleHeader = document.getElementById('task-title-header');
    if (taskTitleHeader) taskTitleHeader.textContent = this.task.title;
    
    // Set task details
    const detailTitle = document.getElementById('detail-title');
    const detailDueDate = document.getElementById('detail-due-date');
    const dueBadge = document.getElementById('due-badge');
    const priorityIndicator = document.getElementById('priority-indicator');
    const detailPriority = document.getElementById('detail-priority');
    const detailCreated = document.getElementById('detail-created');
    const detailNotes = document.getElementById('detail-notes');
    
    if (detailTitle) detailTitle.textContent = this.task.title;
    
    if (detailDueDate) {
      detailDueDate.textContent = this.task.dueDate 
        ? formatDateForDisplay(this.task.dueDate) 
        : 'No due date';
    }
    
    if (dueBadge && this.task.dueDate) {
      const timeRemainingText = getTimeRemainingText(this.task.dueDate);
      dueBadge.textContent = timeRemainingText;
      
      if (timeRemainingText === 'Overdue') {
        dueBadge.classList.add('urgent');
      } else if (timeRemainingText === 'Due today' || timeRemainingText === 'Due tomorrow') {
        dueBadge.classList.add('warning');
      }
    } else if (dueBadge) {
      dueBadge.style.display = 'none';
    }
    
    if (priorityIndicator) {
      priorityIndicator.className = `priority-indicator ${this.task.priority}`;
    }
    
    if (detailPriority) {
      detailPriority.textContent = this.task.priority.charAt(0).toUpperCase() + this.task.priority.slice(1);
    }
    
    if (detailCreated) {
      detailCreated.textContent = formatDateForDisplay(this.task.createdAt);
    }
    
    if (detailNotes) {
      // Convert notes to HTML with line breaks
      detailNotes.innerHTML = this.task.notes
        ? this.task.notes.replace(/\n/g, '<br>')
        : 'No notes added';
    }
    
    // Update time remaining
    this.updateTimeRemaining();
  }

  /**
   * Update the time remaining display
   */
  private updateTimeRemaining(): void {
    if (!this.task) return;
    
    const timeRemainingCard = document.getElementById('time-remaining-card');
    const countdownValue = document.getElementById('countdown-value');
    const countdownLabel = document.getElementById('countdown-label');
    
    if (!this.task.dueDate) {
      // Hide time remaining card if no due date
      if (timeRemainingCard) timeRemainingCard.style.display = 'none';
      return;
    }
    
    // Show time remaining card
    if (timeRemainingCard) timeRemainingCard.style.display = 'block';
    
    const daysRemaining = getDaysRemaining(this.task.dueDate);
    
    if (countdownValue && countdownLabel && daysRemaining !== null) {
      if (daysRemaining < 0) {
        // Overdue
        countdownValue.textContent = Math.abs(daysRemaining).toString();
        countdownLabel.textContent = `day${Math.abs(daysRemaining) !== 1 ? 's' : ''} overdue`;
        countdownValue.style.color = 'var(--danger-color)';
      } else if (daysRemaining === 0) {
        // Due today
        countdownValue.textContent = 'Today';
        countdownLabel.textContent = 'due';
        countdownValue.style.color = 'var(--warning-color)';
      } else {
        // Future due date
        countdownValue.textContent = daysRemaining.toString();
        countdownLabel.textContent = `day${daysRemaining !== 1 ? 's' : ''} remaining`;
        
        if (daysRemaining <= 2) {
          countdownValue.style.color = 'var(--warning-color)';
        } else {
          countdownValue.style.color = 'var(--primary-color)';
        }
      }
    }
  }

  /**
   * Show the edit task modal
   */
  private showEditTaskModal(): void {
    if (!this.editTaskModal || !this.editTaskForm || !this.task) return;
    
    // Set form values
    const editTaskId = document.getElementById('edit-task-id') as HTMLInputElement;
    const editTaskTitle = document.getElementById('edit-task-title') as HTMLInputElement;
    const editTaskDueDate = document.getElementById('edit-task-due-date') as HTMLInputElement;
    const editTaskPriority = document.getElementById('edit-task-priority') as HTMLSelectElement;
    const editTaskNotes = document.getElementById('edit-task-notes') as HTMLTextAreaElement;
    
    if (editTaskId) editTaskId.value = this.task.id;
    if (editTaskTitle) editTaskTitle.value = this.task.title;
    if (editTaskDueDate) editTaskDueDate.value = this.task.dueDate ? formatDateToInput(this.task.dueDate) : '';
    if (editTaskPriority) editTaskPriority.value = this.task.priority;
    if (editTaskNotes) editTaskNotes.value = this.task.notes || '';
    
    // Show modal
    this.editTaskModal.style.display = 'flex';
    
    // Focus on title input
    if (editTaskTitle) {
      setTimeout(() => {
        editTaskTitle.focus();
      }, 100);
    }
  }

  /**
   * Show the postpone task modal
   */
  private showPostponeModal(): void {
    if (!this.postponeModal || !this.task) return;
    
    // Reset form
    const postponeOption = document.getElementById('postpone-option') as HTMLSelectElement;
    const customDateGroup = document.getElementById('custom-date-group');
    const customDate = document.getElementById('postpone-custom-date') as HTMLInputElement;
    
    if (postponeOption) postponeOption.value = 'tomorrow';
    if (customDateGroup) customDateGroup.style.display = 'none';
    
    // Set default custom date to a week from now
    if (customDate) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      customDate.value = formatDateToInput(nextWeek);
    }
    
    // Show modal
    this.postponeModal.style.display = 'flex';
  }

  /**
   * Show delete confirmation modal
   */
  private showDeleteConfirmation(): void {
    if (!this.deleteConfirmModal || !this.task) return;
    
    // Set task title in confirmation
    const deleteTaskTitle = document.getElementById('delete-task-title');
    if (deleteTaskTitle) deleteTaskTitle.textContent = this.task.title;
    
    // Show modal
    this.deleteConfirmModal.style.display = 'flex';
  }

  /**
   * Handle edit task form submission
   */
  private handleEditTaskSubmit(): void {
    if (!this.editTaskForm || !this.task) return;
    
    const editTaskTitle = document.getElementById('edit-task-title') as HTMLInputElement;
    const editTaskDueDate = document.getElementById('edit-task-due-date') as HTMLInputElement;
    const editTaskPriority = document.getElementById('edit-task-priority') as HTMLSelectElement;
    const editTaskNotes = document.getElementById('edit-task-notes') as HTMLTextAreaElement;
    
    // Validate form
    if (!editTaskTitle.value.trim()) {
      const titleError = document.getElementById('edit-title-error');
      if (titleError) titleError.textContent = 'Title is required';
      return;
    }
    
    const title = editTaskTitle.value.trim();
    const dueDate = editTaskDueDate.value ? new Date(editTaskDueDate.value) : null;
    const priority = editTaskPriority.value as TaskPriority;
    const notes = editTaskNotes.value.trim();
    
    // Update task
    const updatedTask: Task = {
      ...this.task,
      title,
      dueDate,
      priority,
      notes
    };
    
    taskService.updateTask(updatedTask);
    
    // Close modal
    if (this.editTaskModal) this.editTaskModal.style.display = 'none';
    
    // Show success toast
    this.showSuccessToast('Task updated successfully!');
    
    // Reload task
    this.loadTask();
  }

  /**
   * Handle postpone form submission
   */
  private handlePostponeSubmit(): void {
    if (!this.postponeForm || !this.task) return;
    
    const postponeOption = document.getElementById('postpone-option') as HTMLSelectElement;
    const customDate = document.getElementById('postpone-custom-date') as HTMLInputElement;
    
    let newDueDate: Date | null = null;
    
    switch (postponeOption.value) {
      case 'tomorrow':
        newDueDate = new Date();
        newDueDate.setDate(newDueDate.getDate() + 1);
        break;
      case 'next-week':
        newDueDate = new Date();
        newDueDate.setDate(newDueDate.getDate() + 7);
        break;
      case 'custom':
        if (customDate.value) {
          newDueDate = new Date(customDate.value);
        }
        break;
    }
    
    if (newDueDate) {
      // Update task
      const updatedTask: Task = {
        ...this.task,
        dueDate: newDueDate
      };
      
      taskService.updateTask(updatedTask);
      
      // Close modal
      if (this.postponeModal) this.postponeModal.style.display = 'none';
      
      // Show success toast
      this.showSuccessToast('Task postponed successfully!');
      
      // Reload task
      this.loadTask();
    }
  }

  /**
   * Complete the current task
   */
  private completeTask(): void {
    if (!this.taskId) return;
    
    taskService.completeTask(this.taskId);
    
    // Show success toast and redirect
    this.showSuccessToast('Task completed successfully!');
    
    // Redirect after a short delay to allow toast to be seen
    setTimeout(() => {
      window.location.href = 'tasks.html';
    }, 1500);
  }

  /**
   * Delete the current task
   */
  private deleteTask(): void {
    if (!this.taskId) return;
    
    taskService.deleteTask(this.taskId);
    
    // Close modal
    if (this.deleteConfirmModal) this.deleteConfirmModal.style.display = 'none';
    
    // Show success toast and redirect
    this.showSuccessToast('Task deleted successfully!');
    
    // Redirect after a short delay to allow toast to be seen
    setTimeout(() => {
      window.location.href = 'tasks.html';
    }, 1500);
  }

  /**
   * Duplicate the current task
   */
  private duplicateTask(): void {
    if (!this.task) return;
    
    // Create a new task with the same details
    const newTitle = `Copy of ${this.task.title}`;
    const newTask = taskService.addTask(
      newTitle, 
      this.task.dueDate, 
      this.task.priority, 
      this.task.notes || ''
    );
    
    // Show success toast
    this.showSuccessToast('Task duplicated successfully!');
    
    // Redirect to the new task after a short delay
    setTimeout(() => {
      window.location.href = `task-details.html?id=${newTask.id}`;
    }, 1500);
  }

  /**
   * Show a success toast message
   */
  private showSuccessToast(message: string): void {
    if (!this.successToast) return;
    
    const toast = this.successToast; // Store reference to the toast element
    const messageElement = document.getElementById('toast-message');
    
    if (messageElement) {
      messageElement.textContent = message;
    }
    
    // Add visible class
    toast.classList.add('visible');
    
    // Set a timeout to remove the visible class
    setTimeout(() => {
      toast.classList.remove('visible');
    }, 3000);
  }
}
