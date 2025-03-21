/**
 * CompletedTasksPage class - Handles all functionality for the completed tasks page
 */

import { taskService } from '../services/TaskService';
import { Task, TaskStatus, TaskPriority } from '../models/Task';
import { formatDateForDisplay, formatDateToInput, isToday, isThisWeek } from '../utils/DateUtils';

export class CompletedTasksPage {
  private tasksContainer: HTMLElement | null;
  private emptyState: HTMLElement | null;
  private taskDetailsModal: HTMLElement | null;
  private deleteConfirmModal: HTMLElement | null;
  private successToast: HTMLElement | null;
  private searchInput: HTMLInputElement | null;
  private filterCompleted: HTMLSelectElement | null;
  private filterPriority: HTMLSelectElement | null;
  private clearFiltersBtn: HTMLElement | null;
  
  private completedTasks: Task[] = [];
  private filteredTasks: Task[] = [];
  private currentTaskId: string | null = null;
  private sortField: string = 'completed-date';
  private sortDirection: 'asc' | 'desc' = 'desc'; // Default to newest first

  constructor() {
    this.tasksContainer = document.getElementById('completed-tasks-container');
    this.emptyState = document.getElementById('empty-state');
    this.taskDetailsModal = document.getElementById('task-details-modal');
    this.deleteConfirmModal = document.getElementById('delete-confirm-modal');
    this.successToast = document.getElementById('success-toast');
    this.searchInput = document.getElementById('search-tasks') as HTMLInputElement;
    this.filterCompleted = document.getElementById('filter-completed') as HTMLSelectElement;
    this.filterPriority = document.getElementById('filter-priority') as HTMLSelectElement;
    this.clearFiltersBtn = document.getElementById('clear-filters');
  }

  /**
   * Initialize the completed tasks page
   */
  public initialize(): void {
    this.loadTasks();
    this.updateCompletionStats();
    this.setupEventListeners();
  }

  /**
   * Load completed tasks from the task service
   */
  private loadTasks(): void {
    this.completedTasks = taskService.getCompletedTasks();
    this.filteredTasks = [...this.completedTasks];
    this.renderTasks();
  }

  /**
   * Set up all event listeners for the completed tasks page
   */
  private setupEventListeners(): void {
    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.taskDetailsModal) this.taskDetailsModal.style.display = 'none';
        if (this.deleteConfirmModal) this.deleteConfirmModal.style.display = 'none';
      });
    });
    
    // Cancel modal buttons
    document.querySelectorAll('.cancel-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.taskDetailsModal) this.taskDetailsModal.style.display = 'none';
        if (this.deleteConfirmModal) this.deleteConfirmModal.style.display = 'none';
      });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
      if (this.taskDetailsModal && e.target === this.taskDetailsModal) {
        this.taskDetailsModal.style.display = 'none';
      }
      if (this.deleteConfirmModal && e.target === this.deleteConfirmModal) {
        this.deleteConfirmModal.style.display = 'none';
      }
    });
    
    // Restore from details button
    const restoreFromDetailsBtn = document.getElementById('restore-from-details');
    if (restoreFromDetailsBtn) {
      restoreFromDetailsBtn.addEventListener('click', () => {
        if (this.currentTaskId) {
          this.restoreTask(this.currentTaskId);
          if (this.taskDetailsModal) this.taskDetailsModal.style.display = 'none';
        }
      });
    }
    
    // Delete from details button
    const deleteFromDetailsBtn = document.getElementById('delete-from-details');
    if (deleteFromDetailsBtn) {
      deleteFromDetailsBtn.addEventListener('click', () => {
        if (this.currentTaskId) {
          if (this.taskDetailsModal) this.taskDetailsModal.style.display = 'none';
          this.showDeleteConfirmation(this.currentTaskId);
        }
      });
    }
    
    // Confirm delete button
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', () => {
        if (this.currentTaskId) {
          this.deleteTask(this.currentTaskId);
          if (this.deleteConfirmModal) this.deleteConfirmModal.style.display = 'none';
        }
      });
    }
    
    // Search input
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => {
        this.filterTasks();
      });
    }
    
    // Filter dropdowns
    if (this.filterCompleted) {
      this.filterCompleted.addEventListener('change', () => {
        this.filterTasks();
      });
    }
    
    if (this.filterPriority) {
      this.filterPriority.addEventListener('change', () => {
        this.filterTasks();
      });
    }
    
    // Clear filters button
    if (this.clearFiltersBtn) {
      this.clearFiltersBtn.addEventListener('click', () => {
        if (this.searchInput) this.searchInput.value = '';
        if (this.filterCompleted) this.filterCompleted.value = 'all';
        if (this.filterPriority) this.filterPriority.value = 'all';
        this.filterTasks();
      });
    }
    
    // Sorting
    document.querySelectorAll('.sortable').forEach(header => {
      header.addEventListener('click', () => {
        const sortBy = header.getAttribute('data-sort');
        if (sortBy) {
          if (this.sortField === sortBy) {
            // Toggle direction if already sorting by this field
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
          } else {
            // Set new sort field and default to ascending
            this.sortField = sortBy;
            this.sortDirection = 'asc';
          }
          this.renderTasks();
        }
      });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
      
      if (!isInput) {
        // R - Restore task (with focus on task)
        if ((e.key === 'r' || e.key === 'R') && this.currentTaskId) {
          e.preventDefault();
          this.restoreTask(this.currentTaskId);
        }
      }
    });
  }

  /**
   * Render tasks to the page
   */
  private renderTasks(): void {
    if (!this.tasksContainer) return;
    
    // Sort tasks
    this.sortTasks();
    
    // Clear container
    this.tasksContainer.innerHTML = '';
    
    // Show empty state if no tasks
    if (this.filteredTasks.length === 0) {
      if (this.tasksContainer) this.tasksContainer.style.display = 'none';
      if (this.emptyState) this.emptyState.style.display = 'block';
      return;
    }
    
    // Hide empty state if has tasks
    if (this.tasksContainer) this.tasksContainer.style.display = 'block';
    if (this.emptyState) this.emptyState.style.display = 'none';
    
    // Create task elements
    this.filteredTasks.forEach(task => {
      const taskElement = this.createTaskElement(task);
      this.tasksContainer?.appendChild(taskElement);
    });
  }

  /**
   * Create a task element for the list
   */
  private createTaskElement(task: Task): HTMLElement {
    const taskElement = document.createElement('div');
    taskElement.className = 'task-item';
    taskElement.setAttribute('data-id', task.id);
    
    // Create title div
    const titleDiv = document.createElement('div');
    titleDiv.className = 'task-title';
    titleDiv.textContent = task.title;
    
    // Create completed date div
    const completedDateDiv = document.createElement('div');
    completedDateDiv.className = 'task-completed-date';
    completedDateDiv.textContent = task.completedAt ? formatDateForDisplay(task.completedAt) : 'Unknown';
    
    // Create priority div
    const priorityDiv = document.createElement('div');
    priorityDiv.className = `task-priority ${task.priority}`;
    
    const priorityIndicator = document.createElement('span');
    priorityIndicator.className = `priority-indicator ${task.priority}`;
    
    priorityDiv.appendChild(priorityIndicator);
    priorityDiv.appendChild(document.createTextNode(
      task.priority.charAt(0).toUpperCase() + task.priority.slice(1)
    ));
    
    // Create actions div
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'task-actions';
    
    // Restore button
    const restoreBtn = document.createElement('button');
    restoreBtn.className = 'task-action-btn restore-btn';
    restoreBtn.title = 'Restore Task';
    restoreBtn.innerHTML = '<i class="fas fa-undo"></i>';
    restoreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.restoreTask(task.id);
    });
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-action-btn delete-btn';
    deleteBtn.title = 'Delete Task';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showDeleteConfirmation(task.id);
    });
    
    actionsDiv.appendChild(restoreBtn);
    actionsDiv.appendChild(deleteBtn);
    
    // Add all elements to task
    taskElement.appendChild(titleDiv);
    taskElement.appendChild(completedDateDiv);
    taskElement.appendChild(priorityDiv);
    taskElement.appendChild(actionsDiv);
    
    // Add click event to show details
    taskElement.addEventListener('click', () => {
      this.showTaskDetails(task.id);
    });
    
    return taskElement;
  }

  /**
   * Sort tasks based on current sort field and direction
   */
  private sortTasks(): void {
    this.filteredTasks.sort((a, b) => {
      let result = 0;
      
      switch (this.sortField) {
        case 'title':
          result = a.title.localeCompare(b.title);
          break;
        case 'completed-date':
          // Handle null completion dates (shouldn't happen but just in case)
          if (a.completedAt === null && b.completedAt === null) {
            result = 0;
          } else if (a.completedAt === null) {
            result = 1;
          } else if (b.completedAt === null) {
            result = -1;
          } else {
            result = a.completedAt.getTime() - b.completedAt.getTime();
          }
          break;
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          result = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
      }
      
      return this.sortDirection === 'asc' ? result : -result;
    });
  }

  /**
   * Filter tasks based on search and filter criteria
   */
  private filterTasks(): void {
    const searchTerm = this.searchInput?.value.toLowerCase() || '';
    const completedFilter = this.filterCompleted?.value || 'all';
    const priorityFilter = this.filterPriority?.value || 'all';
    
    this.filteredTasks = this.completedTasks.filter(task => {
      // Search filter
      const matchesSearch = task.title.toLowerCase().includes(searchTerm) || 
                           (task.notes && task.notes.toLowerCase().includes(searchTerm));
      
      // Priority filter
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      
      // Completed date filter
      let matchesCompleted = true;
      if (completedFilter !== 'all' && task.completedAt) {
        const today = new Date();
        const completionDate = new Date(task.completedAt);
        
        if (completedFilter === 'today') {
          matchesCompleted = isToday(completionDate);
        } else if (completedFilter === 'this-week') {
          matchesCompleted = isThisWeek(completionDate);
        } else if (completedFilter === 'this-month') {
          matchesCompleted = completionDate.getMonth() === today.getMonth() && 
                             completionDate.getFullYear() === today.getFullYear();
        }
      }
      
      return matchesSearch && matchesPriority && matchesCompleted;
    });
    
    this.renderTasks();
  }

  /**
   * Show task details modal
   */
  private showTaskDetails(taskId: string): void {
    if (!this.taskDetailsModal) return;
    
    const task = taskService.getTaskById(taskId);
    if (!task) return;
    
    // Set current task ID
    this.currentTaskId = taskId;
    
    // Set details values
    const detailsTitle = document.getElementById('details-task-title');
    const detailsCompletedDate = document.getElementById('details-completed-date');
    const detailsDueDate = document.getElementById('details-due-date');
    const detailsPriority = document.getElementById('details-priority');
    const detailsCreated = document.getElementById('details-created');
    const detailsNotes = document.getElementById('details-notes');
    
    if (detailsTitle) detailsTitle.textContent = task.title;
    
    if (detailsCompletedDate) {
      detailsCompletedDate.textContent = task.completedAt 
        ? formatDateForDisplay(task.completedAt) 
        : 'Unknown';
    }
    
    if (detailsDueDate) {
      detailsDueDate.textContent = task.dueDate 
        ? formatDateForDisplay(task.dueDate) 
        : 'No due date';
    }
    
    if (detailsPriority) {
      const priorityText = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
      detailsPriority.innerHTML = `
        <span class="priority-indicator ${task.priority}"></span>
        ${priorityText}
      `;
    }
    
    if (detailsCreated) {
      detailsCreated.textContent = formatDateForDisplay(task.createdAt);
    }
    
    if (detailsNotes) {
      // Convert notes to HTML with line breaks
      detailsNotes.innerHTML = task.notes
        ? task.notes.replace(/\n/g, '<br>')
        : 'No notes added';
    }
    
    // Show modal
    this.taskDetailsModal.style.display = 'flex';
  }

  /**
   * Show delete confirmation modal
   */
  private showDeleteConfirmation(taskId: string): void {
    if (!this.deleteConfirmModal) return;
    
    const task = taskService.getTaskById(taskId);
    if (!task) return;
    
    // Set current task ID
    this.currentTaskId = taskId;
    
    // Set task title in confirmation
    const deleteTaskTitle = document.getElementById('delete-task-title');
    if (deleteTaskTitle) deleteTaskTitle.textContent = task.title;
    
    // Show modal
    this.deleteConfirmModal.style.display = 'flex';
  }

  /**
   * Restore a task to active status
   */
  private restoreTask(taskId: string): void {
    taskService.restoreTask(taskId);
    this.showSuccessToast('Task restored successfully!');
    this.loadTasks();
    this.updateCompletionStats();
  }

  /**
   * Delete a task
   */
  private deleteTask(taskId: string): void {
    taskService.deleteTask(taskId);
    this.showSuccessToast('Task deleted successfully!');
    this.loadTasks();
    this.updateCompletionStats();
  }

  /**
   * Update completion statistics
   */
  private updateCompletionStats(): void {
    const completedTasks = taskService.getCompletedTasks();
    
    // Count tasks completed today, this week, and this month
    const today = new Date();
    
    const completedToday = completedTasks.filter(task => 
      task.completedAt && isToday(task.completedAt)
    ).length;
    
    const completedThisWeek = completedTasks.filter(task => 
      task.completedAt && isThisWeek(task.completedAt)
    ).length;
    
    const completedThisMonth = completedTasks.filter(task => {
      if (!task.completedAt) return false;
      return task.completedAt.getMonth() === today.getMonth() && 
             task.completedAt.getFullYear() === today.getFullYear();
    }).length;
    
    // Update the stats display
    const completedTodayElement = document.getElementById('completed-today');
    const completedWeekElement = document.getElementById('completed-week');
    const completedMonthElement = document.getElementById('completed-month');
    
    if (completedTodayElement) completedTodayElement.textContent = completedToday.toString();
    if (completedWeekElement) completedWeekElement.textContent = completedThisWeek.toString();
    if (completedMonthElement) completedMonthElement.textContent = completedThisMonth.toString();
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
