'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { useProfile } from '@/lib/contexts/ProfileContext';
import type { ChapterFeatureFlags } from '@/types/featureFlags';

interface ChapterFeaturesContextType {
  flags: ChapterFeatureFlags | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const ChapterFeaturesContext = createContext<ChapterFeaturesContextType | undefined>(undefined);

export function ChapterFeaturesProvider({ children }: { children: ReactNode }) {
  const { getAuthHeaders, session } = useAuth();
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id ?? null;
  const [flags, setFlags] = useState<ChapterFeatureFlags | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    if (!chapterId || !session) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const headers = getAuthHeaders();
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
      setFlags(null);
    } finally {
      setLoading(false);
    }
  }, [chapterId, session?.access_token, getAuthHeaders]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const value = useMemo(
    () => ({
      flags,
      loading,
      error,
      refetch: fetchFlags,
    }),
    [flags, loading, error, fetchFlags],
  );

  return (
    <ChapterFeaturesContext.Provider value={value}>{children}</ChapterFeaturesContext.Provider>
  );
}

export function useChapterFeaturesContext() {
  const context = useContext(ChapterFeaturesContext);
  if (!context) {
    throw new Error('useChapterFeaturesContext must be used within ChapterFeaturesProvider');
  }
  return context;
}
