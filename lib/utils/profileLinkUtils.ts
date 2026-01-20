/**
 * Options for generating profile links with tracking parameters
 */
export interface ProfileLinkOptions {
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
 * Generate a profile link using slug if available, fallback to userId
 * @param userId - The user's ID
 * @param slug - The user's profile_slug or username (optional)
 * @param options - Optional parameters for tracking (ref, UTM parameters)
 * @returns The profile URL
 */
export function generateProfileLink(
  userId: string,
  slug?: string | null,
  options?: ProfileLinkOptions
): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || 'https://trailblaize.net';
  
  // Use slug if available, otherwise use userId
  const path = slug ? `/profile/${slug}` : `/profile/${userId}`;
  
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
 * Copy profile link to clipboard
 * @param userId - The user's ID
 * @param slug - The user's profile_slug or username (optional)
 * @param options - Optional parameters for tracking (ref, UTM parameters)
 * @returns Promise that resolves to true if copy succeeded, false otherwise
 */
export async function copyProfileLink(
  userId: string,
  slug?: string | null,
  options?: ProfileLinkOptions
): Promise<boolean> {
  try {
    const link = generateProfileLink(userId, slug, options);
    
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
 * Generate a shareable profile link with tracking
 * @param userId - The user's ID
 * @param slug - The user's profile_slug or username (optional)
 * @param ref - Optional referrer source for tracking
 * @returns The shareable profile URL
 */
export function generateShareableLink(
  userId: string,
  slug?: string | null,
  ref?: string
): string {
  return generateProfileLink(userId, slug, { ref: ref || 'share' });
}

