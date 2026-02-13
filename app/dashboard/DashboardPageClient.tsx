'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { DashboardOverview } from '@/components/features/dashboard/DashboardOverview';
import { useRouter } from 'next/navigation';
import { WelcomeModal } from '@/components/shared/WelcomeModal';
import type { SocialFeedInitialData } from '@/components/features/dashboard/dashboards/ui/SocialFeed';
import { queueProfileUpdatePrompt } from '@/lib/utils/profileUpdatePromptQueue';
import type { DetectedChange } from '@/components/features/profile/ProfileUpdatePromptModal';
import { useModal } from '@/lib/contexts/ModalContext';

/** Lightweight profile shape from the server RSC — just the fields we need to render. */
export interface ServerProfile {
  id: string;
  role: string | null;
  chapter_id: string | null;
  chapter: string | null;
  welcome_seen: boolean;
  first_name: string | null;
  last_name: string | null;
  is_developer: boolean;
}

type DashboardPageClientProps = {
  initialFeed?: SocialFeedInitialData | null;
  fallbackChapterId?: string | null;
  serverProfile?: ServerProfile | null;
};

export default function DashboardPageClient({
  initialFeed,
  fallbackChapterId,
  serverProfile
}: DashboardPageClientProps) {
  const { user, loading: authLoading } = useAuth();
  const { profile, isDeveloper, loading: profileLoading } = useProfile();
  const router = useRouter();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const { openEditProfileModal } = useModal();

  // ---------------------------------------------------------------------------
  // Derive "effective" values: prefer live context, fall back to server snapshot
  // ---------------------------------------------------------------------------
  const effectiveRole = profile?.role ?? serverProfile?.role ?? null;
  const effectiveChapterId =
    profile?.chapter_id ?? serverProfile?.chapter_id ?? fallbackChapterId ?? null;
  const effectiveIsDeveloper = isDeveloper || (serverProfile?.is_developer ?? false);

  // We can render immediately if the server gave us a usable profile
  const hasServerData = Boolean(serverProfile && (serverProfile.role || serverProfile.is_developer));

  // Context is "ready" when either server data lets us render or contexts finished loading
  const contextReady = hasServerData || (!authLoading && !profileLoading);

  const isOAuthUser =
    user?.app_metadata?.provider && user?.app_metadata?.provider !== 'email';

  // Handler for sharing an introduction post from welcome modal
  const handleShareIntroduction = () => {
    if (!profile?.id) return;
    
    const introductionChange: DetectedChange = {
      type: 'welcome_introduction',
      field: 'introduction',
      newValue: profile.chapter || 'the chapter',
    };
    
    // Queue the introduction prompt - will be picked up by layout.tsx
    queueProfileUpdatePrompt(profile.id, [introductionChange]);
  };

 // ---------------------------------------------------------------------------
  // Side-effects: redirects & welcome modal (still gated on full context)
  // ---------------------------------------------------------------------------
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
        const timeoutId = setTimeout(() => {
          if (!profile.chapter || !profile.role) {
            console.warn('Email signup profile appears incomplete after loading delay');
            router.push('/profile/complete');
          }
        }, 3000);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [authLoading, profileLoading, user, profile, isDeveloper, isOAuthUser, router]);

  // ---------------------------------------------------------------------------
  // Render gates
  // ---------------------------------------------------------------------------

  // Show spinner ONLY when we have no server data AND client is still loading
  if (!contextReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // After client context loads: if no user, return null (redirect fires via effect)
  if (!authLoading && !user && !hasServerData) {
    return null;
  }

  // Incomplete OAuth profile guard (only after context has resolved)
  if (
    !authLoading &&
    !profileLoading &&
    !effectiveIsDeveloper &&
    isOAuthUser &&
    (!profile?.chapter || !profile?.role)
  ) {
    return null;
  }

  // No role and not developer — show spinner (edge case: no server data, no role)
  if (!effectiveRole && !effectiveIsDeveloper) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'none' }}>Dashboard Page Wrapper</div>
      <DashboardOverview
        userRole={effectiveRole}
        initialFeed={initialFeed ?? undefined}
        fallbackChapterId={effectiveChapterId}
        isDeveloper={effectiveIsDeveloper}
      />

      {showWelcomeModal && profile && (
        <WelcomeModal
          profile={profile}
          onClose={() => setShowWelcomeModal(false)}
          onShareIntroduction={handleShareIntroduction}
          onEditProfile={openEditProfileModal}
        />
      )}
    </div>
  );
}

