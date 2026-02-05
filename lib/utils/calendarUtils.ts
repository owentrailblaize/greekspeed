/**
 * Calendar utilities for generating calendar URLs and ICS files
 */

interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
}

/**
 * Format date for Google Calendar URL (YYYYMMDDTHHmmssZ format)
 */
function formatGoogleCalendarDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Format date for ICS file (YYYYMMDDTHHmmssZ format)
 */
function formatICSDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Generate Google Calendar URL
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatGoogleCalendarDate(event.start_time)}/${formatGoogleCalendarDate(event.end_time)}`,
    details: event.description || '',
    location: event.location || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Calendar URL
 */
export function generateOutlookCalendarUrl(event: CalendarEvent): string {
  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);
  
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: event.description || '',
    location: event.location || '',
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generate ICS file content for Apple Calendar / Outlook Desktop
 */
export function generateICSContent(event: CalendarEvent): string {
  const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@trailblaize.app`;
  const now = formatICSDate(new Date().toISOString());
  
  // Escape special characters in text fields
  const escapeICS = (text: string) => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Trailblaize//Event Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatICSDate(event.start_time)}`,
    `DTEND:${formatICSDate(event.end_time)}`,
    `SUMMARY:${escapeICS(event.title)}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICS(event.description)}`);
  }
  
  if (event.location) {
    lines.push(`LOCATION:${escapeICS(event.location)}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');
  
  return lines.join('\r\n');
}

/**
 * Download ICS file
 */
export function downloadICSFile(event: CalendarEvent): void {
  const icsContent = generateICSContent(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy event link to clipboard
 * @deprecated Use copyEventLinkToClipboard from eventLinkUtils.ts instead for better URL generation
 */
export async function copyEventLink(eventId: string): Promise<boolean> {
  try {
    // Use the new public event URL format
    const url = `${window.location.origin}/event/${eventId}`;
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error('Failed to copy event link:', error);
    return false;
  }
}

/**
 * Share event using Web Share API (mobile) or copy to clipboard (desktop)
 * @deprecated Use ShareEventDrawer for in-app sharing or copyEventLinkToClipboard for simple link copying
 */
export async function shareEvent(event: CalendarEvent & { id: string }): Promise<boolean> {
  // Use the new public event URL format
  const url = `${window.location.origin}/event/${event.id}`;
  const shareData = {
    title: event.title,
    text: `${event.title}${event.location ? ` at ${event.location}` : ''}`,
    url: url,
  };

  // Try native share first (mobile)
  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
      }
      return false;
    }
  }

  // Fallback to clipboard
  return copyEventLink(event.id);
}

