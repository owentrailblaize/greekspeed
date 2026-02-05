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
  // Always returns a string (never null) due to fallback to '/logo.png'
  // Use type assertion for DEFAULT_BRANDING_THEME.primaryLogo since we know it's always '/logo.png' at runtime
  const logoUrl = useMemo((): string => {
    // DEFAULT_BRANDING_THEME.primaryLogo is always '/logo.png' at runtime, but typed as string | null
    // Assert it as string for type safety
    const defaultLogo: string = (DEFAULT_BRANDING_THEME.primaryLogo ?? '/logo.png') as string;
    
    if (variant === 'secondary') {
      // Ensure result is always string by using nullish coalescing with explicitly typed defaultLogo
      return (branding.secondaryLogo ?? defaultLogo) as string;
    }

    // Ensure result is always string by using nullish coalescing with explicitly typed defaultLogo
    return (branding.primaryLogo ?? defaultLogo) as string;
  }, [branding.primaryLogo, branding.secondaryLogo, variant]);

  return logoUrl;
}

