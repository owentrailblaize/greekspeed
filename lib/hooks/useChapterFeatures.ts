// lib/hooks/useChapterFeatures.ts

'use client';

import { useState, useEffect } from 'react';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { ChapterFeatureFlags, DEFAULT_FEATURE_FLAGS } from '@/types/featureFlags';

export function useChapterFeatures() {
  const { profile } = useProfile();
  const [features, setFeatures] = useState<ChapterFeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatures() {
      if (!profile?.chapter_id) {
        setFeatures(DEFAULT_FEATURE_FLAGS);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/chapters/${profile.chapter_id}/features`);
        if (response.ok) {
          const data = await response.json();
          setFeatures({
            ...DEFAULT_FEATURE_FLAGS,
            ...data,
          });
        } else {
          setFeatures(DEFAULT_FEATURE_FLAGS);
        }
      } catch (error) {
        console.error('Error fetching feature flags:', error);
        setFeatures(DEFAULT_FEATURE_FLAGS);
      } finally {
        setLoading(false);
      }
    }

    fetchFeatures();
  }, [profile?.chapter_id]);

  return { features, loading };
}