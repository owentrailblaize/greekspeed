// lib/services/featureFlagsService.ts

import { createServerSupabaseClient } from '@/lib/supabase/client';
import { ChapterFeatureFlags, DEFAULT_FEATURE_FLAGS } from '@/types/featureFlags';

/**
 * Server-side: Get feature flags for a chapter
 */
export async function getChapterFeatureFlags(
  chapterId: string
): Promise<ChapterFeatureFlags> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('chapters')
    .select('feature_flags')
    .eq('id', chapterId)
    .single();

  if (error || !data?.feature_flags) {
    console.error('Error fetching feature flags:', error);
    return DEFAULT_FEATURE_FLAGS;
  }

  // Merge with defaults to ensure all flags exist
  return {
    ...DEFAULT_FEATURE_FLAGS,
    ...(data.feature_flags as Partial<ChapterFeatureFlags>),
  };
}

/**
 * Server-side: Check if a specific feature is enabled
 */
export async function isFeatureEnabled(
  chapterId: string,
  feature: keyof ChapterFeatureFlags
): Promise<boolean> {
  const flags = await getChapterFeatureFlags(chapterId);
  return flags[feature] ?? false;
}