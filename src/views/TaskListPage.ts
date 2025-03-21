/**
 * TaskListPage class - Handles all functionality for the task list page
 */

import { taskService } from '../services/TaskService';
import { Task, TaskStatus, TaskPriority } from '../models/Task';
import { formatDateForDisplay, getDueDateClass, isToday, isThisWeek, isPast, formatDateToInput } from '../utils/DateUtils';

export class TaskListPage {
  private tasksContainer: HTMLElement | null;
  private emptyState: HTMLElement | null;
  private addTaskBtn: HTMLElement | null;
  private emptyAddTaskBtn: HTMLElement | null;
  private taskModal: HTMLElement | null;
  private taskDetailsModal: HTMLElement | null;
  private deleteConfirmModal: HTMLElement | null;
  private taskForm: HTMLFormElement | null;
  private successToast: HTMLElement | null;
  private searchInput: HTMLInputElement | null;
  private filterPriority: HTMLSelectElement | null;
  private filterDue: HTMLSelectElement | null;
  private clearFiltersBtn: HTMLElement | null;
  
  private activeTasks: Task[] = [];
  private filteredTasks: Task[] = [];
  private currentTaskId: string | null = null;
  private sortField: string = 'due-date';
  private sortDirection: 'asc' | 'desc' = 'asc';

  constructor() {
    this.tasksContainer = document.getElementById('tasks-container');
    this.emptyState = document.getElementById('empty-state');
    this.addTaskBtn = document.getElementById('add-task-btn');
    this.emptyAddTaskBtn = document.getElementById('empty-add-task-btn');
    this.taskModal = document.getElementById('task-modal');
    this.taskDetailsModal = document.getElementById('task-details-modal');
    this.deleteConfirmModal = document.getElementById('delete-confirm-modal');
    this.taskForm = document.getElementById('task-form') as HTMLFormElement;
    this.successToast = document.getElementById('success-toast');
    this.searchInput = document.getElementById('search-tasks') as HTMLInputElement;
    this.filterPriority = document.getElementById('filter-priority') as HTMLSelectElement;
    this.filterDue = document.getElementById('filter-due') as HTMLSelectElement;
    this.clearFiltersBtn = document.getElementById('clear-filters');
  }

  /**
   * Initialize the task list page
   */
  public initialize(): void {
    this.loadTasks();
    this.setupEventListeners();
  }

  /**
   * Load tasks from the task service
   */
  private loadTasks(): void {
    this.activeTasks = taskService.getActiveTasks();
    this.filteredTasks = [...this.activeTasks];
    this.renderTasks();
  }

  /**
   * Set up all event listeners for the task list page
   */
  private setupEventListeners(): void {
    // Add task buttons
    if (this.addTaskBtn) {
      this.addTaskBtn.addEventListener('click', () => this.showAddTaskModal());
    }
    
    if (this.emptyAddTaskBtn) {
      this.emptyAddTaskBtn.addEventListener('click', () => this.showAddTaskModal());
    }
    
    // Task form submission
    if (this.taskForm) {
      this.taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleTaskFormSubmit();
      });
    }
    
    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.taskModal) this.taskModal.style.display = 'none';
        if (this.taskDetailsModal) this.taskDetailsModal.style.display = 'none';
        if (this.deleteConfirmModal) this.deleteConfirmModal.style.display = 'none';
      });
    });
    
    // Cancel modal buttons
    document.querySelectorAll('.cancel-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.taskModal) this.taskModal.style.display = 'none';
        if (this.taskDetailsModal) this.taskDetailsModal.style.display = 'none';
        if (this.deleteConfirmModal) this.deleteConfirmModal.style.display = 'none';
      });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
      if (this.taskModal && e.target === this.taskModal) {
        this.taskModal.style.display = 'none';
      }
      if (this.taskDetailsModal && e.target === this.taskDetailsModal) {
        this.taskDetailsModal.style.display = 'none';
      }
      if (this.deleteConfirmModal && e.target === this.deleteConfirmModal) {
        this.deleteConfirmModal.style.display = 'none';
      }
    });
    
    // Edit from details button
    const editFromDetailsBtn = document.getElementById('edit-from-details');
    if (editFromDetailsBtn) {
      editFromDetailsBtn.addEventListener('click', () => {
        if (this.currentTaskId) {
          if (this.taskDetailsModal) this.taskDetailsModal.style.display = 'none';
          this.showEditTaskModal(this.currentTaskId);
        }
      });
    }
    
    // Complete from details button
    const completeFromDetailsBtn = document.getElementById('complete-from-details');
    if (completeFromDetailsBtn) {
      completeFromDetailsBtn.addEventListener('click', () => {
        if (this.currentTaskId) {
          this.completeTask(this.currentTaskId);
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
    if (this.filterPriority) {
      this.filterPriority.addEventListener('change', () => {
        this.filterTasks();
      });
    }
    
    if (this.filterDue) {
      this.filterDue.addEventListener('change', () => {
        this.filterTasks();
      });
    }
    
    // Clear filters button
    if (this.clearFiltersBtn) {
      this.clearFiltersBtn.addEventListener('click', () => {
        if (this.searchInput) this.searchInput.value = '';
        if (this.filterPriority) this.filterPriority.value = 'all';
        if (this.filterDue) this.filterDue.value = 'all';
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
        // N - New task
        if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          this.showAddTaskModal();
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
    
    // Create due date div
    const dueDateDiv = document.createElement('div');
    dueDateDiv.className = `task-due-date ${task.dueDate ? getDueDateClass(task.dueDate) : ''}`;
    dueDateDiv.textContent = task.dueDate ? formatDateForDisplay(task.dueDate) : 'No due date';
    
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
    
    // Complete button
    const completeBtn = document.createElement('button');
    completeBtn.className = 'task-action-btn complete-btn';
    completeBtn.title = 'Mark as Complete';
    completeBtn.innerHTML = '<i class="fas fa-check"></i>';
    completeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.completeTask(task.id);
    });
    
    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'task-action-btn edit-btn';
    editBtn.title = 'Edit Task';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showEditTaskModal(task.id);
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
    
    actionsDiv.appendChild(completeBtn);
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);
    
    // Add all elements to task
    taskElement.appendChild(titleDiv);
    taskElement.appendChild(dueDateDiv);
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
        case 'due-date':
          // Handle null due dates
          if (a.dueDate === null && b.dueDate === null) {
            result = 0;
          } else if (a.dueDate === null) {
            result = 1;
          } else if (b.dueDate === null) {
            result = -1;
          } else {
            result = a.dueDate.getTime() - b.dueDate.getTime();
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
    const priorityFilter = this.filterPriority?.value || 'all';
    const dueFilter = this.filterDue?.value || 'all';
    
    this.filteredTasks = this.activeTasks.filter(task => {
      // Search filter
      const matchesSearch = task.title.toLowerCase().includes(searchTerm) || 
                           (task.notes && task.notes.toLowerCase().includes(searchTerm));
      
      // Priority filter
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      
      // Due date filter
      let matchesDue = true;
      if (dueFilter !== 'all') {
        if (dueFilter === 'today') {
          matchesDue = task.dueDate !== null && isToday(task.dueDate);
        } else if (dueFilter === 'this-week') {
          matchesDue = task.dueDate !== null && isThisWeek(task.dueDate);
        } else if (dueFilter === 'overdue') {
          matchesDue = task.dueDate !== null && isPast(task.dueDate);
        }
      }
      
      return matchesSearch && matchesPriority && matchesDue;
    });
    
    this.renderTasks();
  }

  /**
   * Show the add task modal
   */
  private showAddTaskModal(): void {
    if (!this.taskModal || !this.taskForm) return;
    
    // Reset form
    this.taskForm.reset();
    
    // Set modal title
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) modalTitle.textContent = 'Add New Task';
    
    // Set button text
    const saveTaskBtn = document.getElementById('save-task-btn');
    if (saveTaskBtn) saveTaskBtn.textContent = 'Add Task';
    
    // Clear task ID
    const taskIdInput = document.getElementById('task-id') as HTMLInputElement;
    if (taskIdInput) taskIdInput.value = '';
    
    // Show modal
    this.taskModal.style.display = 'flex';
    
    // Focus on title input
    const titleInput = document.getElementById('task-title') as HTMLInputElement;
    if (titleInput) {
      setTimeout(() => {
        titleInput.focus();
      }, 100);
    }
  }

  /**
   * Show the edit task modal
   */
  private showEditTaskModal(taskId: string): void {
    if (!this.taskModal || !this.taskForm) return;
    
    const task = taskService.getTaskById(taskId);
    if (!task) return;
    
    // Set current task ID
    this.currentTaskId = taskId;
    
    // Set task ID input
    const taskIdInput = document.getElementById('task-id') as HTMLInputElement;
    if (taskIdInput) taskIdInput.value = taskId;
    
    // Set form values
    const titleInput = document.getElementById('task-title') as HTMLInputElement;
    const dueDateInput = document.getElementById('task-due-date') as HTMLInputElement;
    const prioritySelect = document.getElementById('task-priority') as HTMLSelectElement;
    const notesTextarea = document.getElementById('task-notes') as HTMLTextAreaElement;
    
    if (titleInput) titleInput.value = task.title;
    if (dueDateInput) dueDateInput.value = task.dueDate ? formatDateToInput(task.dueDate) : '';
    if (prioritySelect) prioritySelect.value = task.priority;
    if (notesTextarea) notesTextarea.value = task.notes || '';
    
    // Set modal title
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) modalTitle.textContent = 'Edit Task';
    
    // Set button text
    const saveTaskBtn = document.getElementById('save-task-btn');
    if (saveTaskBtn) saveTaskBtn.textContent = 'Save Changes';
    
    // Show modal
    this.taskModal.style.display = 'flex';
    
    // Focus on title input
    if (titleInput) {
      setTimeout(() => {
        titleInput.focus();
      }, 100);
    }
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
    const detailsDueDate = document.getElementById('details-due-date');
    const detailsPriority = document.getElementById('details-priority');
    const detailsCreated = document.getElementById('details-created');
    const detailsNotes = document.getElementById('details-notes');
    
    if (detailsTitle) detailsTitle.textContent = task.title;
    if (detailsDueDate) detailsDueDate.textContent = task.dueDate ? formatDateForDisplay(task.dueDate) : 'No due date';
    
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
   * Handle task form submission (add or edit)
   */
  private handleTaskFormSubmit(): void {
    if (!this.taskForm) return;
    
    const taskIdInput = document.getElementById('task-id') as HTMLInputElement;
    const titleInput = document.getElementById('task-title') as HTMLInputElement;
    const dueDateInput = document.getElementById('task-due-date') as HTMLInputElement;
    const prioritySelect = document.getElementById('task-priority') as HTMLSelectElement;
    const notesTextarea = document.getElementById('task-notes') as HTMLTextAreaElement;
    
    // Validate form
    if (!titleInput.value.trim()) {
      const titleError = document.getElementById('title-error');
      if (titleError) titleError.textContent = 'Title is required';
      return;
    }
    
    const title = titleInput.value.trim();
    const dueDate = dueDateInput.value ? new Date(dueDateInput.value) : null;
    const priority = prioritySelect.value as TaskPriority;
    const notes = notesTextarea.value.trim();
    
    if (taskIdInput.value) {
      // Update existing task
      const task = taskService.getTaskById(taskIdInput.value);
      if (task) {
        const updatedTask: Task = {
          ...task,
          title,
          dueDate,
          priority,
          notes
        };
        
        taskService.updateTask(updatedTask);
        this.showSuccessToast('Task updated successfully!');
      }
    } else {
      // Add new task
      taskService.addTask(title, dueDate, priority, notes);
      this.showSuccessToast('Task added successfully!');
    }
    
    // Close modal
    if (this.taskModal) this.taskModal.style.display = 'none';
    
    // Reload tasks
    this.loadTasks();
  }

  /**
   * Complete a task
   */
  private completeTask(taskId: string): void {
    taskService.completeTask(taskId);
    this.showSuccessToast('Task completed successfully!');
    this.loadTasks();
  }

  /**
   * Delete a task
   */
  private deleteTask(taskId: string): void {
    taskService.deleteTask(taskId);
    this.showSuccessToast('Task deleted successfully!');
    this.loadTasks();
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