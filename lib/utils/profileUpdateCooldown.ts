const STORAGE_KEY_PREFIX = 'profile-update-prompt-cooldown';
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Check if profile update prompt is in cooldown period for this user
 * Returns true if prompt was shown recently (should NOT show prompt)
 */
export function isPromptInCooldown(userId: string): boolean {
  if (!userId || typeof window === 'undefined') return false;
  
  try {
    const key = `${STORAGE_KEY_PREFIX}-${userId}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) return false;
    
    const lastPromptTime = parseInt(stored, 10);
    
    if (isNaN(lastPromptTime)) {
      // Invalid data, clear it
      localStorage.removeItem(key);
      return false;
    }
    
    // Check if within cooldown period
    const timeSinceLastPrompt = Date.now() - lastPromptTime;
    return timeSinceLastPrompt < COOLDOWN_MS;
  } catch (error) {
    console.error('Error checking prompt cooldown:', error);
    return false;
  }
}

/**
 * Record that a prompt was shown (starts cooldown period)
 */
export function recordPromptShown(userId: string): void {
  if (!userId || typeof window === 'undefined') return;
  
  try {
    const key = `${STORAGE_KEY_PREFIX}-${userId}`;
    localStorage.setItem(key, Date.now().toString());
  } catch (error) {
    console.error('Error recording prompt:', error);
  }
}

/**
 * Clear cooldown for a user (useful for testing)
 */
export function clearCooldown(userId: string): void {
  if (!userId || typeof window === 'undefined') return;
  
  try {
    const key = `${STORAGE_KEY_PREFIX}-${userId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing cooldown:', error);
  }
}

