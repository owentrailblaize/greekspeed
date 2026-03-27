/**
 * Display and sort helpers for events with optional start/end times.
 */
import { parseRawTime } from '@/lib/utils/timezoneUtils';

export const EVENT_TIME_TBD = 'Time TBD';

export function isValidIsoDateTime(value: string | null | undefined): boolean {
  if (value == null || String(value).trim() === '') return false;
  const t = new Date(value).getTime();
  return !Number.isNaN(t);
}

/** Normalize API/form values before persist: empty string → null */
export function normalizeEventTimeField(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  if (typeof value === 'string') return value;
  return null;
}

/**
 * Card/list line: formatted schedule or Time TBD when start is missing.
 */
export function formatEventCardSchedule(
  start: string | null | undefined,
  end: string | null | undefined
): string {
  if (!isValidIsoDateTime(start)) return EVENT_TIME_TBD;
  const startFmt = parseRawTime(start!);
  if (!isValidIsoDateTime(end)) return startFmt;
  return `${startFmt} – ${parseRawTime(end!)}`;
}

/** Modal/detail: date + time range, or Time TBD */
export function formatEventDetailSchedule(
  start: string | null | undefined,
  end: string | null | undefined
): string {
  if (!isValidIsoDateTime(start)) return EVENT_TIME_TBD;

  const startDate = new Date(start!);
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  const dateStr = startDate.toLocaleDateString('en-US', dateOptions);
  const startTimeStr = startDate.toLocaleTimeString('en-US', timeOptions);

  if (!isValidIsoDateTime(end)) {
    return `${dateStr} | ${startTimeStr}`;
  }

  const endDate = new Date(end!);
  const endTimeStr = endDate.toLocaleTimeString('en-US', timeOptions);
  return `${dateStr} | ${startTimeStr} – ${endTimeStr}`;
}

export function compareEventsByStartDesc(
  a: { start_time: string | null; created_at?: string },
  b: { start_time: string | null; created_at?: string }
): number {
  return -compareEventsByStartAsc(a, b);
}

export function compareEventsByStartAsc(
  a: { start_time: string | null; created_at?: string },
  b: { start_time: string | null; created_at?: string }
): number {
  const ta = isValidIsoDateTime(a.start_time) ? new Date(a.start_time!).getTime() : null;
  const tb = isValidIsoDateTime(b.start_time) ? new Date(b.start_time!).getTime() : null;
  if (ta != null && tb != null) return ta - tb;
  if (ta != null && tb == null) return -1;
  if (ta == null && tb != null) return 1;
  const ca = a.created_at ? new Date(a.created_at).getTime() : 0;
  const cb = b.created_at ? new Date(b.created_at).getTime() : 0;
  return ca - cb;
}

/** Published-only: whether the event should appear in “upcoming” lists */
export function isPublishedEventUpcoming(
  e: { status: string; start_time: string | null; end_time: string | null },
  nowIso: string
): boolean {
  if (e.status !== 'published') return false;
  const now = new Date(nowIso).getTime();

  if (isValidIsoDateTime(e.start_time)) {
    const start = new Date(e.start_time!).getTime();
    if (isValidIsoDateTime(e.end_time)) {
      const end = new Date(e.end_time!).getTime();
      return start >= now || (start <= now && end >= now);
    }
    return start >= now;
  }

  if (isValidIsoDateTime(e.end_time)) {
    return new Date(e.end_time!).getTime() >= now;
  }

  return true;
}

/** Whether the event has ended (for public UI / past styling) */
export function isEventPastBySchedule(event: {
  start_time: string | null;
  end_time: string | null;
}): boolean {
  const now = Date.now();
  if (isValidIsoDateTime(event.end_time)) {
    return new Date(event.end_time!).getTime() < now;
  }
  if (isValidIsoDateTime(event.start_time)) {
    return new Date(event.start_time!).getTime() < now;
  }
  return false;
}

/**
 * RSVP allowed before start when start exists (unchanged vs legacy).
 * If no start, open until end passes when only end is set.
 */
export function isRsvpWindowOpen(event: {
  start_time: string | null;
  end_time: string | null;
}): boolean {
  const now = Date.now();
  if (isValidIsoDateTime(event.start_time)) {
    return now < new Date(event.start_time!).getTime();
  }
  if (isValidIsoDateTime(event.end_time)) {
    return now <= new Date(event.end_time!).getTime();
  }
  return true;
}
