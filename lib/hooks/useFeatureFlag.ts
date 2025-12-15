import { useChapterFeatures } from './useChapterFeatures';
import { isFeatureEnabled } from '@/types/featureFlags';
import type { FeatureFlagName } from '@/types/featureFlags';
import { useProfile } from '@/lib/contexts/ProfileContext';

interface UseFeatureFlagResult {
  enabled: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to check if a specific feature flag is enabled for the user's chapter.
 * 
 * @param flagName - The name of the feature flag to check
 * @returns Object with enabled status, loading state, and error state
 * 
 * @example
 * const { enabled, loading } = useFeatureFlag('financial_tools_enabled');
 * if (loading) return <Spinner />;
 * if (!enabled) return <FeatureDisabled />;
 */
export function useFeatureFlag(flagName: FeatureFlagName): UseFeatureFlagResult {
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id ?? null;
  const { flags, loading, error } = useChapterFeatures(chapterId);

  // Use isFeatureEnabled helper which defaults to true if flags are null/undefined
  const enabled = isFeatureEnabled(flags, flagName);

  return {
    enabled,
    loading,
    error,
  };
}