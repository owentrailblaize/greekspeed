import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Returns the list of chapter IDs a governance user can manage.
 * Includes rows from governance_chapters plus the user's home chapter_id if not already in the table.
 * Returns [] for non-governance users.
 */
export async function getManagedChapterIds(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, chapter_id')
    .eq('id', userId)
    .single();

  if (profileError || !profile) return [];
  if (profile.role !== 'governance') return [];

  const { data: rows, error } = await supabase
    .from('governance_chapters')
    .select('chapter_id')
    .eq('user_id', userId);

  if (error) return [];

  const ids = (rows ?? []).map((r) => r.chapter_id);
  const homeId = profile.chapter_id ?? null;
  if (homeId && !ids.includes(homeId)) {
    ids.push(homeId);
  }
  return ids;
}
