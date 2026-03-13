/**
 * PWA install prompt timing and cooldown.
 * Show A2HS after: onboarding completion OR X sessions OR meaningful action.
 * Do not show on first visit.
 */

const KEY_FIRST_VISIT = 'pwa_install_first_visit';
const KEY_SESSION_COUNT = 'pwa_install_session_count';
const KEY_LAST_DISMISSED = 'pwa_install_last_dismissed';
const KEY_SHOWN_AFTER_ONBOARDING = 'pwa_install_shown_after_onboarding';
const KEY_FROM_ONBOARDING = 'pwa_install_from_onboarding';

/** Min dashboard sessions before showing install prompt (skip first visit). */
export const MIN_SESSIONS_BEFORE_PROMPT = 2;
/** Cooldown in days after user dismisses install prompt. */
export const INSTALL_PROMPT_COOLDOWN_DAYS = 7;

function getStorage(userId: string | undefined): Storage | undefined {
  if (typeof window === 'undefined' || !userId) return undefined;
  return window.localStorage;
}

export function markFirstVisit(userId: string | undefined): void {
  const storage = getStorage(userId);
  if (!storage) return;
  const key = `${KEY_FIRST_VISIT}_${userId}`;
  if (storage.getItem(key) === null) {
    storage.setItem(key, new Date().toISOString());
  }
}

export function isFirstVisit(userId: string | undefined): boolean {
  const storage = getStorage(userId);
  if (!storage || !userId) return true;
  return storage.getItem(`${KEY_FIRST_VISIT}_${userId}`) === null;
}

export function incrementSessionCount(userId: string | undefined): number {
  const storage = getStorage(userId);
  if (!storage || !userId) return 0;
  const key = `${KEY_SESSION_COUNT}_${userId}`;
  const raw = storage.getItem(key);
  const count = raw ? Math.max(0, parseInt(raw, 10) + 1) : 1;
  storage.setItem(key, String(count));
  return count;
}

export function getSessionCount(userId: string | undefined): number {
  const storage = getStorage(userId);
  if (!storage || !userId) return 0;
  const raw = storage.getItem(`${KEY_SESSION_COUNT}_${userId}`);
  return raw ? Math.max(0, parseInt(raw, 10)) : 0;
}

export function setShownAfterOnboarding(userId: string | undefined): void {
  const storage = getStorage(userId);
  if (!storage || !userId) return;
  storage.setItem(`${KEY_SHOWN_AFTER_ONBOARDING}_${userId}`, '1');
}

export function hasShownAfterOnboarding(userId: string | undefined): boolean {
  const storage = getStorage(userId);
  if (!storage || !userId) return false;
  return storage.getItem(`${KEY_SHOWN_AFTER_ONBOARDING}_${userId}`) === '1';
}

export function setFromOnboarding(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(KEY_FROM_ONBOARDING, '1');
}

export function consumeFromOnboarding(): boolean {
  if (typeof window === 'undefined') return false;
  const v = window.sessionStorage.getItem(KEY_FROM_ONBOARDING);
  if (v === '1') {
    window.sessionStorage.removeItem(KEY_FROM_ONBOARDING);
    return true;
  }
  return false;
}

export function markInstallPromptDismissed(userId: string | undefined): void {
  const storage = getStorage(userId);
  if (!storage || !userId) return;
  storage.setItem(`${KEY_LAST_DISMISSED}_${userId}`, new Date().toISOString());
}

export function isInstallPromptInCooldown(userId: string | undefined): boolean {
  const storage = getStorage(userId);
  if (!storage || !userId) return false;
  const raw = storage.getItem(`${KEY_LAST_DISMISSED}_${userId}`);
  if (!raw) return false;
  const then = new Date(raw).getTime();
  const now = Date.now();
  return (now - then) < INSTALL_PROMPT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * True when we should show the A2HS prompt:
 * - Not first visit (session count >= 1 after we increment, so we show when count >= MIN_SESSIONS)
 * - Either: just landed from onboarding, OR session count >= MIN_SESSIONS_BEFORE_PROMPT
 * - Not in cooldown
 */
export function shouldShowInstallPrompt(
  userId: string | undefined,
  sessionCount: number,
  fromOnboarding: boolean,
  canPrompt: boolean
): boolean {
  if (!userId || !canPrompt) return false;
  if (isInstallPromptInCooldown(userId)) return false;
  if (fromOnboarding) return true;
  return sessionCount >= MIN_SESSIONS_BEFORE_PROMPT;
}
