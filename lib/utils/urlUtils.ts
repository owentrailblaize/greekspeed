/**
 * Get the correct base URL for the application
 * Handles development, preview, and production environments intelligently
 */
export function getBaseUrl(): string {
  // If we're in the browser, use the current origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Server-side environment detection
  // Production URL from environment
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // Vercel preview/production URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Development fallback
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // Production fallback
  return 'https://www.trailblaize.net';
}

/**
 * Get the correct redirect URL for auth operations
 * This ensures we always use the right domain for redirects
 */
export function getAuthRedirectUrl(path: string = ''): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}${path}`;
}

/**
 * Get the correct URL for email links
 * This is specifically for server-side email generation
 */
export function getEmailBaseUrl(): string {
  // Always use production URL for emails, even in development
  // This ensures email links work regardless of where they're generated
  return process.env.NEXT_PUBLIC_APP_URL || 'https://www.trailblaize.net';
}
