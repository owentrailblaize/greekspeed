'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { DashboardOverview } from '@/components/features/dashboard/DashboardOverview';
import { useRouter } from 'next/navigation';
import { WelcomeModal } from '@/components/shared/WelcomeModal';
import type { SocialFeedInitialData } from '@/components/features/dashboard/dashboards/ui/SocialFeed';

type DashboardPageClientProps = {
  initialFeed?: SocialFeedInitialData | null;
  fallbackChapterId?: string | null;
};

export default function DashboardPageClient({
  initialFeed,
  fallbackChapterId,
}: DashboardPageClientProps) {
  const { user, loading: authLoading } = useAuth();
  const { profile, isDeveloper, loading: profileLoading } = useProfile();
  const router = useRouter();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const isOAuthUser = user?.app_metadata?.provider &&
    user?.app_metadata?.provider !== 'email';

  useEffect(() => {
    if (authLoading || profileLoading) return;

    if (!user) {
      router.push('/sign-in');
      return;
    }

    if (profile) {
      if (!profile.welcome_seen && !isDeveloper) {
        setShowWelcomeModal(true);
      }

      if (!isDeveloper && isOAuthUser && (!profile.chapter || !profile.role)) {
        router.push('/profile/complete');
        return;
      }

      if (!isDeveloper && !isOAuthUser && (!profile.chapter || !profile.role)) {
        // Give it a bit more time for the profile to fully load
        const timeoutId = setTimeout(() => {
          // Only redirect if still incomplete after waiting
          if (!profile.chapter || !profile.role) {
            console.warn('Email signup profile appears incomplete after loading delay');
            // Don't redirect - email signups should have complete profiles
          }
        }, 3000);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [authLoading, profileLoading, user, profile, isDeveloper, isOAuthUser, router]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-navy-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isDeveloper && isOAuthUser && (!profile?.chapter || !profile?.role)) {
    return null;
  }

  // Don't render DashboardOverview until we have a role (prevents placeholder flash)
  if (!profile?.role && !isDeveloper) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-navy-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'none' }}>Dashboard Page Wrapper</div>
      <DashboardOverview
        userRole={profile?.role || null}
        initialFeed={initialFeed ?? undefined}
        fallbackChapterId={fallbackChapterId}
      />

      {showWelcomeModal && profile && (
        <WelcomeModal profile={profile} onClose={() => setShowWelcomeModal(false)} />
      )}
    </div>
  );
}

