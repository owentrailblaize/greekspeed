'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { DashboardOverview } from '@/components/features/dashboard/DashboardOverview';
import { useRouter } from 'next/navigation';
import { WelcomeModal } from '@/components/shared/WelcomeModal';
import type { SocialFeedInitialData } from '@/components/features/dashboard/dashboards/ui/SocialFeed';
import { queueProfileUpdatePrompt } from '@/lib/utils/profileUpdatePromptQueue';
import type { DetectedChange } from '@/components/features/profile/ProfileUpdatePromptModal';
import { useModal } from '@/lib/contexts/ModalContext';
import type { Profile } from '@/types/profile';

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
  serverProfile?: Profile | null;
};

export default function DashboardPageClient({
  initialFeed,
  fallbackChapterId,
  serverProfile,
}: DashboardPageClientProps) {
  const { user, loading: authLoading } = useAuth();
  const { profile, isDeveloper, loading: profileLoading, hydrateFromServer } = useProfile();
  const router = useRouter();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const { openEditProfileModal } = useModal();

  // ---- NEW: Hydrate ProfileContext with server data ASAP ----
  // useLayoutEffect fires synchronously after DOM mutations but before paint,
  // so every useProfile() consumer sees data on the very first render frame.
  useLayoutEffect(() => {
    if (serverProfile) {
      hydrateFromServer(serverProfile);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only on mount

  // Derive "effective" values: prefer live context, fall back to server snapshot
  const effectiveRole = profile?.role ?? serverProfile?.role ?? null;
  const effectiveChapterId =
    profile?.chapter_id ?? serverProfile?.chapter_id ?? fallbackChapterId ?? null;
  const effectiveIsDeveloper = isDeveloper || (serverProfile?.is_developer ?? false);


  // We can render immediately if the server gave us a usable profile
  const hasServerData = Boolean(serverProfile && (serverProfile.role || serverProfile.is_developer));

  // Context is "ready" when either server data lets us render or contexts finished loading
  const contextReady = hasServerData || (!authLoading && !profileLoading);

  const isOAuthUser = user?.app_metadata?.provider &&
    user?.app_metadata?.provider !== 'email';

  // Handler for sharing an introduction post from welcome modal
  const handleShareIntroduction = () => {
    if (!profile?.id) return;
    
    const introductionChange: DetectedChange = {
      type: 'welcome_introduction',
      field: 'introduction',
      newValue: profile.chapter || 'the chapter',
      profile: profile,
    };
    
    // Queue the introduction prompt - will be picked up by layout.tsx
    queueProfileUpdatePrompt(profile.id, [introductionChange]);
  };

  // Side-effects: redirects and welcome modal (only fire once context is fully ready)
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
  // RENDER GATES — only show spinner when we have NO server data AND client is
  // still loading. With serverProfile, the DashboardOverview renders immediately.
  // ---------------------------------------------------------------------------
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

  // After context is ready and there's no user at all, bail
  if (!user && !hasServerData) {
    return null;
  }

  // OAuth incomplete-profile guard (only when live context is ready)
  if (!effectiveIsDeveloper && isOAuthUser && (!profile?.chapter || !profile?.role) && !hasServerData) {
    return null;
  }

  // No role and not developer — only show spinner when we truly have no data
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
      <DashboardOverview
        userRole={effectiveRole}
        isDeveloper={effectiveIsDeveloper}
        initialFeed={initialFeed ?? undefined}
        fallbackChapterId={effectiveChapterId}
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

