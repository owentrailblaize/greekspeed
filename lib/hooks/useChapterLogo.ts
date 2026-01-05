'use client';

import { useMemo } from 'react';
import { useChapterBranding } from './useChapterBranding';
import { DEFAULT_BRANDING_THEME } from '@/types/branding';

/**
 * Hook to get logo URL for the current user's chapter
 * 
 * Returns the primary logo URL from chapter branding, falling back to
 * Trailblaize logo if no branding is configured.
 * 
 * @param chapterId - Optional chapter ID. If not provided, uses chapter from profile
 * @param variant - Logo variant: 'primary' or 'secondary' (default: 'primary')
 * @returns Logo URL string
 * 
 * @example
 * ```tsx
 * const logoUrl = useChapterLogo();
 * <img src={logoUrl} alt="Chapter Logo" />
 * ```
 * 
 * @example
 * ```tsx
 * // Get secondary logo
 * const secondaryLogo = useChapterLogo(undefined, 'secondary');
 * ```
 */
export function useChapterLogo(
  chapterId?: string,
  variant: 'primary' | 'secondary' = 'primary'
): string {
  const { branding } = useChapterBranding(chapterId);

  // Memoize the logo URL to prevent unnecessary re-renders
  const logoUrl = useMemo(() => {
    if (variant === 'secondary' && branding.secondaryLogo) {
      return branding.secondaryLogo;
    }

    return branding.primaryLogo || DEFAULT_BRANDING_THEME.primaryLogo;
  }, [branding.primaryLogo, branding.secondaryLogo, variant]);

  return logoUrl;
}

