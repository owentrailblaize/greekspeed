'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { Loader2 } from 'lucide-react';
import { STEP_CONFIG } from '@/types/onboarding';

/**
 * Onboarding Entry Point
 * 
 * This page redirects users to the appropriate step:
 * - If onboarding is complete → redirect to dashboard
 * - If not authenticated → redirect to sign-in
 * - Otherwise → redirect to role-chapter step (first step in unified 5-step flow)
 * 
 * The role-chapter page handles both:
 * - Selection mode: for users without role/chapter
 * - Confirmation mode: for invitation users who already have role/chapter
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  useEffect(() => {
    // Wait for auth and profile to load
    if (authLoading || profileLoading) return;

    // If not authenticated, redirect to sign-in
    if (!user) {
      router.replace('/sign-in');
      return;
    }

    // If onboarding is already complete, redirect to dashboard
    if (profile?.onboarding_completed) {
      router.replace('/dashboard');
      return;
    }

    // Always start at role-chapter step (first step in unified 5-step flow)
    // The page handles showing confirmation mode if user already has role/chapter
    router.replace(STEP_CONFIG['role-chapter'].path);
  }, [user, profile, authLoading, profileLoading, router]);

  // Show loading state while determining redirect
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-brand-primary mb-4" />
      <p className="text-gray-600">Setting up your profile...</p>
    </div>
  );
}
