'use client';
export const dynamic = "force-dynamic";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { ProfileService } from '@/lib/services/profileService';
import { Profile } from '@/types/profile';
import { DashboardOverview } from '@/components/features/dashboard/DashboardOverview';
import { useRouter } from 'next/navigation';
import { WelcomeModal } from '@/components/shared/WelcomeModal';

export default function DashboardPage() {
  // DashboardPage: Component rendering
  
  const { user, isDeveloper } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        try {
          const profileData = await ProfileService.getCurrentProfile();
          setProfile(profileData);
          
          // Check if this is a new user who hasn't seen the welcome modal
          if (profileData && !profileData.welcome_seen && !isDeveloper) {
            setShowWelcomeModal(true);
          }
          
          // Check if profile is incomplete and redirect if needed
          // Skip this check for developers
          if (!isDeveloper && (!profileData?.chapter || !profileData?.role)) {
            router.push('/profile/complete');
            return;
          }
        } catch (error) {
          console.error('Error loading profile:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, router, isDeveloper]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if profile is incomplete (will redirect)
  // Skip this check for developers
  if (!isDeveloper && (!profile?.chapter || !profile?.role)) {
    return null;
  }

  return (
    <div>
      <div style={{ display: 'none' }}>Dashboard Page Wrapper</div>
      <DashboardOverview userRole={profile?.role || null} />
      
      {/* Welcome Modal for New Users */}
      {showWelcomeModal && profile && (
        <WelcomeModal
          profile={profile}
          onClose={() => setShowWelcomeModal(false)}
        />
      )}
    </div>
  );
} 