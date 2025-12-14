import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import type { ChapterFeatureFlags } from '@/types/featureFlags';

interface UseChapterFeaturesResult {
  flags: ChapterFeatureFlags | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useChapterFeatures(chapterId: string | null): UseChapterFeaturesResult {
  const { getAuthHeaders, session } = useAuth();
  const [flags, setFlags] = useState<ChapterFeatureFlags | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = async () => {
    if (!chapterId || !session) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const headers = getAuthHeaders(); // This provides Bearer token!
      
      const response = await fetch(`/api/chapters/${chapterId}/features`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch feature flags');
      }

      const data = await response.json();
      setFlags(data.feature_flags || {});
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch feature flags';
      setError(message);
      console.error('Error fetching feature flags:', err);
      setFlags(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, [chapterId, session?.access_token]); // Re-fetch if chapterId or session changes

  return {
    flags,
    loading,
    error,
    refetch: fetchFlags,
  };
}