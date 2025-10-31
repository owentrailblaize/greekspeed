import { logger } from "@/lib/utils/logger";

/**
 * Raw time utilities - display times exactly as stored in Supabase
 */

// Parse the raw UTC time string from Supabase WITHOUT JavaScript conversion
export const parseRawTime = (utcString: string): string => {
  // Supabase sends: "2025-09-01T10:00:00+00:00"
  // We want to extract just the time part: "10:00:00"
  
  // Method 1: Extract time from ISO format
  if (utcString.includes('T')) {
    const parts = utcString.split('T');
    if (parts.length >= 2) {
      const datePart = parts[0]; // "2025-09-01"
      const timePart = parts[1].split('+')[0]; // "10:00:00" (remove +00:00)
      
      // Parse date and time manually
      const [year, month, day] = datePart.split('-');
      const [hour, minute, second] = timePart.split(':');
      
      // Create date object in UTC (no timezone conversion)
      const utcDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second)));
      
      return utcDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC' // Force UTC display
      });
    }
  }
  
  // Fallback: try to parse as ISO string
  try {
    const date = new Date(utcString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC' // Force UTC display
    });
  } catch (error) {
    logger.error('Error parsing date:', { context: [utcString, error] });
    return utcString; // Return original string if parsing fails
  }
};

// Parse raw detailed time
export const parseRawDetailedTime = (utcString: string): string => {
  // Same logic but with detailed format
  if (utcString.includes('T')) {
    const parts = utcString.split('T');
    if (parts.length >= 2) {
      const datePart = parts[0];
      const timePart = parts[1].split('+')[0];
      
      const [year, month, day] = datePart.split('-');
      const [hour, minute, second] = timePart.split(':');
      
      const utcDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second)));
      
      return utcDate.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC' // Force UTC display
      });
    }
  }
  
  try {
    const date = new Date(utcString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC' // Force UTC display
    });
  } catch (error) {
    logger.error('Error parsing date:', { context: [utcString, error] });
    return utcString;
  }
};

// Get timezone info
export const getTimezoneInfo = () => {
  return {
    note: "Times displayed in UTC (as originally scheduled)"
  };
};
