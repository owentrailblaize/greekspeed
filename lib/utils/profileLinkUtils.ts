/**
 * Generate a profile link using slug if available, fallback to userId
 * @param userId - The user's ID
 * @param slug - The user's profile_slug or username (optional)
 * @param options - Optional parameters like ref tracking
 * @returns The profile URL
 */
export function generateProfileLink(
  userId: string,
  slug?: string | null,
  options?: { ref?: string }
): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || 'https://trailblaize.net';
  
  // Use slug if available, otherwise use userId
  const path = slug ? `/profile/${slug}` : `/profile/${userId}`;
  const params = options?.ref ? `?ref=${encodeURIComponent(options.ref)}` : '';
  
  return `${baseUrl}${path}${params}`;
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

