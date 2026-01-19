'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UnifiedUserProfile } from '@/types/user-profile';
import { fetchUserProfile } from '@/lib/services/userProfileService';
import { UserProfileView } from '@/components/features/user-profile/UserProfileView';
import { AlumniProfileView } from '@/components/features/user-profile/AlumniProfileView';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { MobileBottomNavigation } from '@/components/features/dashboard/dashboards/ui/MobileBottomNavigation';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  
  const [profile, setProfile] = useState<UnifiedUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        {/* Mobile Header with Back Button */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Profile</h1>
        </div>
        
        <div className="flex items-center justify-center h-[calc(100vh-200px)] px-4">
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

  // Render profile
  return (
    <div className="min-h-screen bg-white sm:hidden pb-20">
      {/* Mobile Header with Back Button */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">{profile.full_name}</h1>
      </div>

      {/* Profile Content */}
      <div className="pb-4">
        {profile.type === 'alumni' ? (
          <AlumniProfileView profile={profile} onClose={handleClose} hideCloseButton={true} />
        ) : (
          <UserProfileView profile={profile} onClose={handleClose} hideCloseButton={true} />
        )}
      </div>

      <MobileBottomNavigation />
    </div>
  );
}

