// Reserved words that cannot be used as usernames
const RESERVED_WORDS = [
  'admin', 'api', 'dashboard', 'profile', 'settings', 'messages',
  'network', 'alumni', 'members', 'events', 'posts', 'notifications',
  'auth', 'login', 'signup', 'sign-in', 'sign-up', 'logout', 'sign-out',
  'help', 'support', 'about', 'contact', 'privacy', 'terms',
  'developer', 'root', 'system', 'test', 'demo', 'www',
  'mail', 'email', 'ftp', 'localhost', 'null', 'undefined', 'true', 'false'
];

/**
 * Sanitize a string to be URL-safe
 * Converts to lowercase, removes special characters, allows hyphens and dots
 */
export function sanitizeUsername(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9.-]/g, '') // Remove all non-alphanumeric except hyphens and dots
    .replace(/[-.]+/g, (match) => match[0]) // Replace multiple hyphens/dots with single character
    .replace(/^[-.]|[-.]$/g, ''); // Remove leading/trailing hyphens or dots
}

/**
 * Generate a base username from first and last name
 * Format: firstname.lastname
 */
export function generateBaseUsername(firstName: string | null, lastName: string | null): string {
  const first = (firstName || '').trim();
  const last = (lastName || '').trim();
  
  if (!first && !last) {
    throw new Error('Cannot generate username: both first and last name are missing');
  }
  
  const firstPart = sanitizeUsername(first || 'user');
  const lastPart = sanitizeUsername(last || 'name');
  
  // If both parts are empty after sanitization, use fallback
  if (!firstPart && !lastPart) {
    return 'user';
  }
  
  // Combine: firstname.lastname
  const base = firstPart && lastPart 
    ? `${firstPart}.${lastPart}`
    : firstPart || lastPart;
  
  return base;
}

/**
 * Check if a username is reserved
 */
export function isReservedWord(username: string): boolean {
  const normalized = username.toLowerCase().trim();
  return RESERVED_WORDS.includes(normalized);
}

/**
 * Validate username format
 * Rules:
 * - 3-50 characters
 * - Lowercase alphanumeric, hyphens, and dots only
 * - Cannot start or end with hyphen or dot
 * - Cannot have consecutive dots or hyphens
 * - Cannot be a reserved word
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || username.trim().length === 0) {
    return { valid: false, error: 'Username is required' };
  }
  
  const trimmed = username.trim();
  
  // Length check
  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (trimmed.length > 50) {
    return { valid: false, error: 'Username must be 50 characters or less' };
  }
  
  // Format check (lowercase, alphanumeric, hyphens, and dots only)
  if (!/^[a-z0-9.-]+$/.test(trimmed)) {
    return { valid: false, error: 'Username can only contain lowercase letters, numbers, hyphens, and dots' };
  }
  
  // Cannot start or end with hyphen or dot
  if (trimmed.startsWith('-') || trimmed.endsWith('-') || trimmed.startsWith('.') || trimmed.endsWith('.')) {
    return { valid: false, error: 'Username cannot start or end with a hyphen or dot' };
  }
  
  // Cannot have consecutive dots or hyphens
  if (/\.{2,}/.test(trimmed) || /-{2,}/.test(trimmed)) {
    return { valid: false, error: 'Username cannot contain consecutive dots or hyphens' };
  }
  
  // Cannot be reserved word
  if (isReservedWord(trimmed)) {
    return { valid: false, error: 'This username is reserved and cannot be used' };
  }
  
  return { valid: true };
}

/**
 * Check if username exists in database
 * @param supabseClient - The supabase client to use
 * @param username - The username to check
 * @param excludeUserId - The user ID to exclude from the check
 */
export async function usernameExists(
  supabseClient: any,
  username: string,
  excludeUserId?: string
): Promise<boolean> {
  let query = supabseClient
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase().trim())
    .limit(1);
  
  if (excludeUserId) {
    query = query.neq('id', excludeUserId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error checking username existence:', error);
    throw error;
  }
  
  return (data?.length || 0) > 0;
}

/**
 * Generate a unique username with duplicate handling
 * Tries: john.doe, john.doe1, john.doe2, etc.
 * @param supabaseClient - The Supabase client instance to use
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @param excludeUserId - Optional user ID to exclude from check
 */
export async function generateUniqueUsername(
  supabaseClient: any,
  firstName: string | null,
  lastName: string | null,
  excludeUserId?: string
): Promise<string> {
  let baseUsername = generateBaseUsername(firstName, lastName);
  
  // If base username is reserved, add a number
  if (isReservedWord(baseUsername)) {
    baseUsername = `${baseUsername}1`;
  }

  let username = baseUsername;
  let counter = 0;
  const maxAttempts = 1000; // Safety limit
  
  while (await usernameExists(supabaseClient, username, excludeUserId)) {
    counter++;
    if (counter > maxAttempts) {
      // Fallback: use timestamp if we can't find a unique name
      const timestamp = Date.now().toString().slice(-6);
      username = `${baseUsername}${timestamp}`;
      break;
    }
    
    // Try: baseUsername1, baseUsername2, etc.
    username = `${baseUsername}${counter}`;
  }

  return username;
}

/**
 * Generate profile slug from username
 * For now, slug is same as username, but can be customized later
 */
export function generateProfileSlug(username: string): string {
  return username.toLowerCase().trim();
}

