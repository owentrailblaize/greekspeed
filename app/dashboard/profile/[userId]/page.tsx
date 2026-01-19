'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UnifiedUserProfile } from '@/types/user-profile';
import { fetchUserProfile } from '@/lib/services/userProfileService';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { MobileBottomNavigation } from '@/components/features/dashboard/dashboards/ui/MobileBottomNavigation';
import { ProfileSummary } from '@/components/features/user-profile/mobile/ProfileSummary';
import { ContentNavigationTabs } from '@/components/features/profile/mobile/ContentNavigationTabs';
import { PostsTab } from '@/components/features/user-profile/mobile/PostsTab';
import { AboutTab } from '@/components/features/user-profile/mobile/AboutTab';
import { useAuth } from '@/lib/supabase/auth-context';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const userId = params.userId as string;
  
  const [profile, setProfile] = useState<UnifiedUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    if (!userId) {
      setError('Invalid user ID');
      setLoading(false);
      return;
    }

    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);
        const fetchedProfile = await fetchUserProfile(userId);
        
        if (fetchedProfile) {
          setProfile(fetchedProfile);
        } else {
          setError('Profile not found');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [userId]);

  const handleClose = () => {
    router.back(); // Use browser back navigation
  };

  const isOwnProfile = user?.id === userId;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white sm:hidden pb-20">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
        <MobileBottomNavigation />
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-white sm:hidden pb-20">
        {/* Error state with back button */}
        <div className="relative">
          <div className="h-32 bg-gradient-to-r from-navy-100 via-blue-100 to-blue-50 relative">
            {/* Back Button - Positioned in top-left of banner */}
            <button
              onClick={handleClose}
              className="absolute top-3 left-3 z-10 h-10 w-10 rounded-full flex items-center justify-center cursor-pointer group"
              style={{
                background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 25%, #3b82f6 50%, #60a5fa 75%, #93c5fd 100%)',
                boxShadow: `
                  0 6px 12px rgba(30, 64, 175, 0.4),
                  0 2px 4px rgba(30, 64, 175, 0.3),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.2)
                `,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
              title="Go back"
            >
              <div 
                className="absolute inset-0 rounded-full opacity-40"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), transparent 70%)',
                }}
              />
              <ArrowLeft 
                className="h-5 w-5 text-white relative z-10 drop-shadow-lg transition-transform duration-200 group-hover:scale-110"
                style={{
                  filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4))',
                }}
              />
              <div 
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.3), transparent 60%)',
                }}
              />
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-center h-[calc(100vh-200px)] px-4 pt-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Profile not found'}</p>
            <Button onClick={handleClose} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
        <MobileBottomNavigation />
      </div>
    );
  }

  // Define tabs
  const tabs = [
    { id: 'posts', label: 'Posts' },
    { id: 'about', label: 'About' },
  ];

  // Render profile with new structure
  return (
    <div className="min-h-screen bg-white sm:hidden pb-20">
      {/* Profile Summary Section */}
      <ProfileSummary profile={profile} onClose={handleClose} />

      {/* Sticky Tab Navigation */}
      <ContentNavigationTabs 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={tabs}
        stickyTop="0"
      />

      {/* Scrollable Content Area */}
      <div className="bg-gray-50 min-h-[400px]">
        {activeTab === 'posts' && (
          <PostsTab userId={userId} isOwnProfile={isOwnProfile} />
        )}
        {activeTab === 'about' && (
          <AboutTab profile={profile} />
        )}
      </div>

      <MobileBottomNavigation />
    </div>
  );
}

