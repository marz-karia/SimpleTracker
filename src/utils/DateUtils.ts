/**
 * Format a date to YYYY-MM-DD string
 */
export function formatDateToInput(date: Date | null): string {
  if (!date) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Format a date to a human-readable string
 */
export function formatDateForDisplay(date: Date | null): string {
  if (!date) return 'No date set';
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | null): boolean {
  if (!date) return false;
  
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

/**
 * Check if a date is tomorrow
 */
export function isTomorrow(date: Date | null): boolean {
  if (!date) return false;
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return date.getDate() === tomorrow.getDate() &&
         date.getMonth() === tomorrow.getMonth() &&
         date.getFullYear() === tomorrow.getFullYear();
}

/**
 * Check if a date is within this week
 */
export function isThisWeek(date: Date | null): boolean {
  if (!date) return false;
  
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
  
  return date >= startOfWeek && date <= endOfWeek;
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date | null): boolean {
  if (!date) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  return date < today;
}

/**
 * Get the time remaining until a date in days
 */
export function getDaysRemaining(date: Date | null): number | null {
  if (!date) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Get a human-readable string for the time remaining
 */
export function getTimeRemainingText(date: Date | null): string {
  if (!date) return 'No due date';
  
  if (isPast(date)) {
    return 'Overdue';
  }
  
  if (isToday(date)) {
    return 'Due today';
  }
  
  if (isTomorrow(date)) {
    return 'Due tomorrow';
  }
  
  const daysRemaining = getDaysRemaining(date);
  
  if (daysRemaining !== null && daysRemaining <= 7) {
    return `Due in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`;
  }
  
  return formatDateForDisplay(date);
}

/**
 * Get CSS class for due date styling
 */
export function getDueDateClass(date: Date | null): string {
  if (!date) return '';
  
  if (isPast(date)) {
    return 'urgent';
  }
  
  if (isToday(date) || isTomorrow(date)) {
    return 'warning';
  }
  
  return '';
}
