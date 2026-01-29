/**
 * Event link utilities for generating URLs and sharing events
 * Similar to profileLinkUtils.ts but for events
 */

/**
 * Options for generating event links with tracking parameters
 */
export interface EventLinkOptions {
  /** Referrer source for tracking (e.g., 'share', 'email', 'sms') */
  ref?: string;
  /** UTM source parameter (e.g., 'linkedin', 'twitter') */
  utm_source?: string;
  /** UTM medium parameter (e.g., 'social', 'email') */
  utm_medium?: string;
  /** UTM campaign parameter (custom campaign name) */
  utm_campaign?: string;
}

/**
 * Generate an event link using slug if available, fallback to eventId
 * @param eventId - The event's ID
 * @param slug - The event's slug (optional)
 * @param options - Optional parameters for tracking (ref, UTM parameters)
 * @returns The event URL
 */
export function generateEventLink(
  eventId: string,
  slug?: string | null,
  options?: EventLinkOptions
): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || 'https://trailblaize.net';
  
  // Use slug if available, otherwise use eventId
  const path = slug ? `/event/${slug}` : `/event/${eventId}`;
  
  // Build URL with query parameters using URL class
  const url = new URL(path, baseUrl);
  
  // Add query parameters only if provided
  if (options?.ref) {
    url.searchParams.set('ref', options.ref);
  }
  if (options?.utm_source) {
    url.searchParams.set('utm_source', options.utm_source);
  }
  if (options?.utm_medium) {
    url.searchParams.set('utm_medium', options.utm_medium);
  }
  if (options?.utm_campaign) {
    url.searchParams.set('utm_campaign', options.utm_campaign);
  }
  
  return url.toString();
}

/**
 * Copy event link to clipboard
 * @param eventId - The event's ID
 * @param slug - The event's slug (optional)
 * @param options - Optional parameters for tracking (ref, UTM parameters)
 * @returns Promise that resolves to true if copy succeeded, false otherwise
 */
export async function copyEventLinkToClipboard(
  eventId: string,
  slug?: string | null,
  options?: EventLinkOptions
): Promise<boolean> {
  try {
    const link = generateEventLink(eventId, slug, options);
    
    // Check if clipboard API is available
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      console.error('Clipboard API not available');
      return false;
    }
    
    await navigator.clipboard.writeText(link);
    return true;
  } catch (error) {
    console.error('Failed to copy link:', error);
    return false;
  }
}

/**
 * Generate a shareable event link with tracking
 * @param eventId - The event's ID
 * @param slug - The event's slug (optional)
 * @param ref - Optional referrer source for tracking
 * @returns The shareable event URL
 */
export function generateShareableEventLink(
  eventId: string,
  slug?: string | null,
  ref?: string
): string {
  return generateEventLink(eventId, slug, { ref: ref || 'share' });
}

