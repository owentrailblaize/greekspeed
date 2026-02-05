'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { Loader2 } from 'lucide-react';
import { STEP_CONFIG, needsRoleChapterStep } from '@/types/onboarding';

/**
 * Onboarding Entry Point
 * 
 * This page redirects users to the appropriate step:
 * - If onboarding is complete → redirect to dashboard
 * - If not authenticated → redirect to sign-in
 * - If OAuth user without role/chapter → redirect to role-chapter step
 * - Otherwise → redirect to linkedin-import step
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

    // Check if user needs to select role/chapter first (OAuth without invitation)
    if (needsRoleChapterStep(profile)) {
      router.replace(STEP_CONFIG['role-chapter'].path);
      return;
    }

    // Otherwise, redirect to linkedin-import step
    router.replace(STEP_CONFIG['linkedin-import'].path);
  }, [user, profile, authLoading, profileLoading, router]);

  // Show loading state while determining redirect
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-brand-primary mb-4" />
      <p className="text-gray-600">Setting up your profile...</p>
    </div>
  );
}
