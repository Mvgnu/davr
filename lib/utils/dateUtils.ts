'use client';

/**
 * Format a date into localized string
 * @param date - The date to format
 * @returns Formatted date string in dd.mm.yyyy format (German locale)
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('de-DE', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
}

/**
 * Format a date with time
 * @param date - The date to format
 * @returns Formatted date and time string (German locale)
 */
export function formatDateTime(date: Date): string {
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Get a relative time string (e.g., "2 days ago")
 * @param date - The date to format
 * @returns Relative time string
 */
export function getRelativeTime(date: Date): string {
  const rtf = new Intl.RelativeTimeFormat('de', { numeric: 'auto' });
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days < -30) {
    return formatDate(date);
  } else if (days < 0) {
    return rtf.format(days, 'day');
  } else if (hours < 0) {
    return rtf.format(hours, 'hour');
  } else if (minutes < 0) {
    return rtf.format(minutes, 'minute');
  } else {
    return rtf.format(seconds, 'second');
  }
} 