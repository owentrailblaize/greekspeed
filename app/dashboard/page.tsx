'use client';
export const dynamic = "force-dynamic";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { Profile } from '@/types/profile';
import { DashboardOverview } from '@/components/features/dashboard/DashboardOverview';
import { useRouter } from 'next/navigation';
import { WelcomeModal } from '@/components/shared/WelcomeModal';

export default function DashboardPage() {
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
      
      if (!isDeveloper && (!profile.chapter || !profile.role)) {
        router.push('/profile/complete');
        return;
      }
    }
  }, [user, profile, authLoading, profileLoading, isDeveloper, router]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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