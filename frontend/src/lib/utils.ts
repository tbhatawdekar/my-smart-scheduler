import { format, parseISO } from 'date-fns';

export function formatDateTime(dateTimeString: string): string {
  try {
    const date = parseISO(dateTimeString);
    return format(date, 'MMM d, yyyy h:mm a');
  } catch {
    return dateTimeString;
  }
}

export function formatTime(dateTimeString: string): string {
  try {
    const date = parseISO(dateTimeString);
    return format(date, 'h:mm a');
  } catch {
    return dateTimeString;
  }
}

export function formatDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, 'MMM d, yyyy');
  } catch {
    return dateString;
  }
} 