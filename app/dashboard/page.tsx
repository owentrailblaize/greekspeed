'use client';
export const dynamic = "force-dynamic";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { Profile } from '@/types/profile';
import { DashboardOverview } from '@/components/features/dashboard/DashboardOverview';
import { useRouter } from 'next/navigation';
import { WelcomeModal } from '@/components/shared/WelcomeModal';

export default function DashboardPage() {
  const { user, isDeveloper, loading: authLoading, profile } = useAuth();
  const router = useRouter();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // No user means not authenticated
    if (!user) {
      router.push('/sign-in');
      return;
    }

    // If we have profile data, check if it's complete
    if (profile) {
      // Check if this is a new user who hasn't seen the welcome modal
      if (!profile.welcome_seen && !isDeveloper) {
        setShowWelcomeModal(true);
      }
      
      // Check if profile is incomplete (only for non-developers)
      if (!isDeveloper && (!profile.chapter || !profile.role)) {
        router.push('/profile/complete');
        return;
      }
    }
  }, [user, profile, authLoading, isDeveloper, router]);

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // No user = will redirect (handled in useEffect)
  if (!user) {
    return null;
  }

  // Don't render dashboard if profile is incomplete (will redirect)
  if (!isDeveloper && (!profile?.chapter || !profile?.role)) {
    return null;
  }

  return (
    <div>
      <div style={{ display: 'none' }}>Dashboard Page Wrapper</div>
      <DashboardOverview userRole={profile?.role || null} />
      
      {showWelcomeModal && profile && (
        <WelcomeModal
          profile={profile}
          onClose={() => setShowWelcomeModal(false)}
        />
      )}
    </div>
  );
} 