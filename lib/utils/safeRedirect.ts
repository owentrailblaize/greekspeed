/**
 * Allowed path prefixes for post-login redirect.
 * Prevents open-redirect vulnerabilities.
 */
const ALLOWED_REDIRECT_PREFIXES = [
    '/check-in',
    '/dashboard',
    '/onboarding',
    '/profile',
    '/join/',
    '/alumni-join/',
] as const;
  
/**
 * Returns the path (including query) if it's an allowed same-origin redirect; otherwise null.
 * Use for post-login redirect param (e.g. ?redirect=...) and OAuth redirect_to.
 */
export function getSafeRedirect(redirectParam: string | null): string | null {
    if (!redirectParam || typeof redirectParam !== 'string') {
        return null;
    }
    const trimmed = redirectParam.trim();
    if (!trimmed) return null;
    // Must be a relative path: single leading slash, no protocol
    if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
        return null;
    }
    const pathname = trimmed.split('?')[0];
    const hasAllowedPrefix = ALLOWED_REDIRECT_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
    );
    return hasAllowedPrefix ? trimmed : null;
}