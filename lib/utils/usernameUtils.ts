import { createClient } from '@supabase/supabase-js';

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
 * Converts to lowercase, removes special characters, allows hyphens
 */
export function sanitizeUsername(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '') // Remove all non-alphanumeric except hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
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
 * - Lowercase alphanumeric and hyphens only
 * - Cannot start or end with hyphen
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
  
  // Format check (lowercase, alphanumeric, hyphens only)
  if (!/^[a-z0-9-]+$/.test(trimmed)) {
    return { valid: false, error: 'Username can only contain lowercase letters, numbers, and hyphens' };
  }
  
  // Cannot start or end with hyphen
  if (trimmed.startsWith('-') || trimmed.endsWith('-')) {
    return { valid: false, error: 'Username cannot start or end with a hyphen' };
  }
  
  // Cannot be reserved word
  if (isReservedWord(trimmed)) {
    return { valid: false, error: 'This username is reserved and cannot be used' };
  }
  
  return { valid: true };
}

/**
 * Check if username exists in database
 */
export async function usernameExists(
  username: string,
  excludeUserId?: string
): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  let query = supabase
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
 */
export async function generateUniqueUsername(
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
  
  while (await usernameExists(username, excludeUserId)) {
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

