'use client';

import { createContext, useContext, useEffect, useMemo, useRef, ReactNode } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { useChapterBranding } from '@/lib/hooks/useChapterBranding';
import type { BrandingTheme } from '@/types/branding';
import { DEFAULT_BRANDING_THEME } from '@/types/branding';

interface BrandingContextType {
  branding: BrandingTheme;
  loading: boolean;
  error: string | null;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

/**
 * Branding Provider
 * 
 * Provides branding theme to all children and injects CSS variables
 * into document root for dynamic theming. CSS variables are updated
 * automatically when branding changes - no component re-renders needed.
 */
export function BrandingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { profile } = useProfile();
  
  // Get chapter ID from profile
  const chapterId = profile?.chapter_id || null;
  
  // Use the branding hook to get theme
  const { branding, loading, error } = useChapterBranding(chapterId);
  
  // Track previous branding to detect changes
  const prevBrandingRef = useRef<BrandingTheme | null>(null);

  /**
   * Inject CSS variables into document root
   * This allows all components to use brand colors via Tailwind classes
   */
  const injectCSSVariables = (theme: BrandingTheme) => {
    if (typeof document === 'undefined') return; // SSR safety

    const root = document.documentElement;
    
    root.style.setProperty('--brand-primary', theme.primaryColor);
    root.style.setProperty('--brand-primary-hover', theme.primaryColorHover);
    root.style.setProperty('--brand-accent', theme.accentColor);
    root.style.setProperty('--brand-accent-light', theme.accentColorLight);
    root.style.setProperty('--brand-focus', theme.focusColor);
  };

  /**
   * Reset CSS variables to default Trailblaize values
   * Called when user logs out or has no chapter
   */
  const resetCSSVariables = () => {
    if (typeof document === 'undefined') return; // SSR safety

    const root = document.documentElement;
    
    root.style.setProperty('--brand-primary', DEFAULT_BRANDING_THEME.primaryColor);
    root.style.setProperty('--brand-primary-hover', DEFAULT_BRANDING_THEME.primaryColorHover);
    root.style.setProperty('--brand-accent', DEFAULT_BRANDING_THEME.accentColor);
    root.style.setProperty('--brand-accent-light', DEFAULT_BRANDING_THEME.accentColorLight);
    root.style.setProperty('--brand-focus', DEFAULT_BRANDING_THEME.focusColor);
  };

  // Inject CSS variables when branding changes
  useEffect(() => {
    if (typeof document === 'undefined') return; // SSR safety

    // Only update if branding actually changed (prevent unnecessary updates)
    const hasChanged = 
      prevBrandingRef.current?.primaryColor !== branding.primaryColor ||
      prevBrandingRef.current?.primaryLogo !== branding.primaryLogo;

    if (hasChanged) {
      injectCSSVariables(branding);
      prevBrandingRef.current = branding;
    }
  }, [branding]);

  // Reset to defaults when user logs out or has no chapter
  useEffect(() => {
    if (typeof document === 'undefined') return; // SSR safety

    if (!user || !chapterId) {
      resetCSSVariables();
      prevBrandingRef.current = null;
    }
  }, [user, chapterId]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    branding,
    loading,
    error,
  }), [branding, loading, error]);

  return (
    <BrandingContext.Provider value={contextValue}>
      {children}
    </BrandingContext.Provider>
  );
}

/**
 * Hook to access branding context
 * 
 * @returns BrandingContextType with branding theme, loading, and error states
 * 
 * @example
 * ```tsx
 * const { branding } = useBranding();
 * // branding.primaryColor, branding.primaryLogo, etc.
 * ```
 */
export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}

