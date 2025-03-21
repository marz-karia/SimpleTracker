/**
 * Main entry point for the Simple Task Tracker application
 * Initializes appropriate page-specific code based on current page
 */

import { HomePage } from './views/HomePage';
import { TaskListPage } from './views/TaskListPage';
import { TaskDetailsPage } from './views/TaskDetailsPage';
import { CompletedTasksPage } from './views/CompletedTasksPage';

// Initialize common elements present on all pages
const initCommonElements = (): void => {
  // Help tooltip functionality
  const helpButton = document.getElementById('help-button');
  const helpTooltip = document.getElementById('help-tooltip');
  const closeHelp = document.getElementById('close-help');
  const footerHelp = document.getElementById('footer-help');
  
  if (helpButton && helpTooltip && closeHelp) {
    helpButton.addEventListener('click', (e) => {
      e.preventDefault();
      helpTooltip.style.display = 'block';
    });
    
    closeHelp.addEventListener('click', () => {
      helpTooltip.style.display = 'none';
    });
    
    // Close help when clicking outside
    document.addEventListener('click', (e) => {
      if (e.target !== helpButton && !helpTooltip.contains(e.target as Node) && helpTooltip.style.display === 'block') {
        helpTooltip.style.display = 'none';
      }
    });
    
    // Footer help link
    if (footerHelp) {
      footerHelp.addEventListener('click', (e) => {
        e.preventDefault();
        helpTooltip.style.display = 'block';
      });
    }
  }
  
  // Add keyboard shortcut listener
  document.addEventListener('keydown', (e) => {
    // Only trigger shortcuts when not in an input field
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
    
    if (!isInput) {
      // Common shortcuts for all pages
      if (e.key === '?' || (e.key === 'h' && e.ctrlKey)) {
        e.preventDefault();
        if (helpTooltip) {
          helpTooltip.style.display = helpTooltip.style.display === 'block' ? 'none' : 'block';
        }
      }
    }
  });
};

// Initialize page based on current URL
const initCurrentPage = (): void => {
  const path = window.location.pathname;
  
  // Initialize common elements first
  initCommonElements();
  
  // Initialize page-specific code
  if (path.endsWith('/index.html') || path.endsWith('/') || path === '') {
    // Home page
    const homePage = new HomePage();
    homePage.initialize();
  } else if (path.endsWith('/tasks.html')) {
    // Task list page
    const taskListPage = new TaskListPage();
    taskListPage.initialize();
  } else if (path.endsWith('/task-details.html')) {
    // Task details page
    const taskDetailsPage = new TaskDetailsPage();
    taskDetailsPage.initialize();
  } else if (path.endsWith('/completed-tasks.html')) {
    // Completed tasks page
    const completedTasksPage = new CompletedTasksPage();
    completedTasksPage.initialize();
  }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initCurrentPage);
