/**
 * Push notification prompt cooldown and denied state.
 * Persist user choice; do not re-prompt aggressively; manual re-enable path in Settings.
 */

const KEY_DISMISSED_AT = 'push_prompt_dismissed_at';
const KEY_DENIED = 'push_prompt_denied';
const KEY_COOLDOWN_CLEARED = 'push_prompt_cooldown_cleared';

/** Cooldown in days after user dismisses push explainer before showing again. */
export const PUSH_PROMPT_COOLDOWN_DAYS = 7;

function getStorage(userId: string | undefined): Storage | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage;
}

export function markPushPromptDismissed(userId: string | undefined): void {
  const storage = getStorage(userId);
  if (!storage || !userId) return;
  storage.setItem(`${KEY_DISMISSED_AT}_${userId}`, new Date().toISOString());
}

export function markPushPromptDenied(userId: string | undefined): void {
  const storage = getStorage(userId);
  if (!storage || !userId) return;
  storage.setItem(`${KEY_DENIED}_${userId}`, '1');
}

export function isPushPromptDenied(userId: string | undefined): boolean {
  const storage = getStorage(userId);
  if (!storage || !userId) return false;
  return storage.getItem(`${KEY_DENIED}_${userId}`) === '1';
}

export function isPushPromptInCooldown(userId: string | undefined): boolean {
  const storage = getStorage(userId);
  if (!storage || !userId) return true;
  const raw = storage.getItem(`${KEY_DISMISSED_AT}_${userId}`);
  if (!raw) return false;
  const then = new Date(raw).getTime();
  const now = Date.now();
  return (now - then) < PUSH_PROMPT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
}

/** User clicked "Enable notifications" in Settings to re-prompt. Clears cooldown so explainer can show again. */
export function clearPushPromptCooldown(userId: string | undefined): void {
  const storage = getStorage(userId);
  if (!storage || !userId) return;
  storage.removeItem(`${KEY_DISMISSED_AT}_${userId}`);
  storage.removeItem(`${KEY_DENIED}_${userId}`);
  storage.setItem(`${KEY_COOLDOWN_CLEARED}_${userId}`, new Date().toISOString());
}

/**
 * True when we may show the push explainer (not denied, not in cooldown).
 * Denied users are not re-prompted unless they use Settings to re-enable.
 */
export function canShowPushExplainer(
  userId: string | undefined,
  permission: 'granted' | 'denied' | 'default'
): boolean {
  if (!userId || permission !== 'default') return false;
  if (isPushPromptDenied(userId)) return false;
  return !isPushPromptInCooldown(userId);
}
