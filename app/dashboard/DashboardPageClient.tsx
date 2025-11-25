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
    }
  }, [authLoading, profileLoading, user, profile, isDeveloper, router]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-navy-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return null;
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

