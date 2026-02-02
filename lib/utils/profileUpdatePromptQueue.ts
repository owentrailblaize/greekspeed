const QUEUE_KEY_PREFIX = 'profile-update-prompt-queue';

export interface PendingPrompt {
  userId: string;
  changes: any[]; // DetectedChange[]
  timestamp: number;
}

export function queueProfileUpdatePrompt(userId: string, changes: any[]): void {
    if (!userId || typeof window === 'undefined' || changes.length === 0) return;
    
    try {
      const pending: PendingPrompt = {
        userId,
        changes,
        timestamp: Date.now(),
      };
      localStorage.setItem(`${QUEUE_KEY_PREFIX}-${userId}`, JSON.stringify(pending));
      console.log('📬 Queued profile update prompt:', pending);
      
      // Dispatch custom event for same-tab detection (storage events only work across tabs)
      window.dispatchEvent(new CustomEvent('profileUpdatePromptQueued', {
        detail: { userId, changes }
      }));
    } 
    catch (error) {
      console.error('Error queueing profile update prompt:', error);
    }
}
export function getPendingPrompt(userId: string): PendingPrompt | null {
  if (!userId || typeof window === 'undefined') return null;
  
  try {
    const raw = localStorage.getItem(`${QUEUE_KEY_PREFIX}-${userId}`);
    if (!raw) return null;
    
    const pending = JSON.parse(raw) as PendingPrompt;
    
    // Only return if less than 5 minutes old (safety check)
    const age = Date.now() - pending.timestamp;
    if (age > 5 * 60 * 1000) {
      clearPendingPrompt(userId);
      return null;
    }
    
    return pending;
  } catch (error) {
    console.error('Error reading pending prompt:', error);
    return null;
  }
}

export function clearPendingPrompt(userId: string): void {
  if (!userId || typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(`${QUEUE_KEY_PREFIX}-${userId}`);
    console.log('🗑️ Cleared pending prompt for user:', userId);
  } catch (error) {
    console.error('Error clearing pending prompt:', error);
  }
}

