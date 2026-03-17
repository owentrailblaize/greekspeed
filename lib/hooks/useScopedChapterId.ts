'use client';

import { useProfile } from '@/lib/contexts/ProfileContext';
import { useActiveChapter } from '@/lib/contexts/ActiveChapterContext';

/**
 * Returns the "effective" chapter id for the current UI.
 *
 * - Normal users: their own `profile.chapter_id`
 * - Developers / Governance:
 *   - if they selected a chapter via ChapterSwitcher: `activeChapterId`
 *   - otherwise: `profile.chapter_id` (if any) or null
 *
 * This is the main bridge to make "workspace style" chapter traversal work
 * without mutating the underlying user profile.
 */
export function useScopedChapterId(): string | null {
  const { profile, isDeveloper } = useProfile();
  const { activeChapterId } = useActiveChapter();

  const isGovernance = profile?.role === 'governance';
  if (isDeveloper || isGovernance) {
    return activeChapterId ?? profile?.chapter_id ?? null;
  }

  return profile?.chapter_id ?? null;
}

