const PREFS_KEY_PREFIX = 'profile-update-prefs';

export type ProfileUpdatePrefs = {
  dontShowAgain?: boolean;
  preferredTemplateType?: string; // e.g. "career", "role_transition", "generic"
};

function getKey(userId: string) {
  return `${PREFS_KEY_PREFIX}-${userId}`;
}

export function getProfileUpdatePrefs(userId: string): ProfileUpdatePrefs {
  if (!userId || typeof window === 'undefined') return {};

  try {
    const raw = localStorage.getItem(getKey(userId));
    return raw ? (JSON.parse(raw) as ProfileUpdatePrefs) : {};
  } catch (error) {
    console.error('Error reading profile update preferences:', error);
    return {};
  }
}

export function saveProfileUpdatePrefs(userId: string, prefs: ProfileUpdatePrefs) {
  if (!userId || typeof window === 'undefined') return;

  try {
    const existing = getProfileUpdatePrefs(userId);
    const merged = { ...existing, ...prefs };
    localStorage.setItem(getKey(userId), JSON.stringify(merged));
  } catch (error) {
    console.error('Error saving profile update preferences:', error);
  }
}


