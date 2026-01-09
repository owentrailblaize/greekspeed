'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { BrandingService } from '@/lib/services/brandingService';
import type { BrandingTheme } from '@/types/branding';
import { DEFAULT_BRANDING_THEME } from '@/types/branding';

interface UseChapterBrandingResult {
  branding: BrandingTheme;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to get branding theme for the current user's chapter
 * 
 * Automatically detects chapter from user profile and resolves branding
 * with fallback chain: chapter → organization → default
 * 
 * @param chapterId - Optional chapter ID. If not provided, uses chapter from profile
 * @returns Object with branding theme, loading state, error state, and refetch function
 * 
 * @example
 * ```tsx
 * const { branding, loading } = useChapterBranding();
 * if (loading) return <Spinner />;
 * 
 * // Use branding colors
 * <button className="bg-brand-primary">Click me</button>
 * ```
 */
export function useChapterBranding(chapterId?: string): UseChapterBrandingResult {
  const { profile } = useProfile();
  const [branding, setBranding] = useState<BrandingTheme>(DEFAULT_BRANDING_THEME);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine which chapter ID to use
  const targetChapterId = useMemo(() => {
    return chapterId || profile?.chapter_id || null;
  }, [chapterId, profile?.chapter_id]);

  const fetchBranding = useCallback(async () => {
    if (!targetChapterId) {
      // No chapter ID available, use default theme
      setBranding(DEFAULT_BRANDING_THEME);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const theme = await BrandingService.resolveBrandingForChapter(targetChapterId);
      
      // Only update if theme actually changed (prevent unnecessary re-renders)
      setBranding(prevTheme => {
        // Simple comparison - if primary color changed, update
        if (prevTheme.primaryColor !== theme.primaryColor || 
            prevTheme.primaryLogo !== theme.primaryLogo) {
          return theme;
        }
        return prevTheme; // Return same reference if unchanged
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load branding';
      console.error('Error fetching branding:', err);
      setError(errorMessage);
      // Fall back to default theme on error
      setBranding(DEFAULT_BRANDING_THEME);
    } finally {
      setLoading(false);
    }
  }, [targetChapterId]);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  // Memoize the result to prevent unnecessary re-renders
  const result = useMemo(() => ({
    branding,
    loading,
    error,
    refetch: fetchBranding,
  }), [branding, loading, error, fetchBranding]);

  return result;
}

