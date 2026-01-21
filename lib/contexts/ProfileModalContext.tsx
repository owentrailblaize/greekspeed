'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { UnifiedUserProfile, UserProfileData } from '@/types/user-profile';
import { fetchUserProfile, alumniToUnifiedProfile } from '@/lib/services/userProfileService';
import { Alumni } from '@/lib/alumniConstants';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

interface ProfileModalContextType {
  isProfileModalOpen: boolean;
  currentProfile: UnifiedUserProfile | null;
  loading: boolean;
  error: string | null;
  openUserProfile: (userId: string) => Promise<void>;
  openUserProfileWithData: (userData: UserProfileData | Alumni) => void;
  closeUserProfile: () => void;
}

const ProfileModalContext = createContext<ProfileModalContextType | undefined>(undefined);

export function ProfileModalProvider({ children }: { children: ReactNode }) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<UnifiedUserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const isMobile = useIsMobile();

  const openUserProfile = useCallback(async (userId: string) => {
    if (!userId) return;
    
    // On mobile, navigate to profile page instead of opening modal
    if (isMobile) {
      router.push(`/dashboard/profile/${userId}`);
      return;
    }

    // Desktop: Open modal as before
    setLoading(true);
    setError(null);
    try {
      // Try to fetch the profile
      const profile = await fetchUserProfile(userId);
      if (profile) {
        setCurrentProfile(profile);
        setIsProfileModalOpen(true);
        setError(null); // Clear any previous errors
      } else {
        setError('Profile not found');
        setIsProfileModalOpen(true); // Open modal to show error
      }
    } catch (err) {
      console.error('Error opening user profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      setError(errorMessage);
      setIsProfileModalOpen(true); // Open modal to show error
    } finally {
      setLoading(false);
    }
  }, [isMobile, router]);

  const openUserProfileWithData = useCallback((userData: UserProfileData | Alumni) => {
    let profile: UnifiedUserProfile;
    
    // Check if it's an Alumni object
    if ('fullName' in userData && 'graduationYear' in userData) {
      profile = alumniToUnifiedProfile(userData as Alumni);
    } else {
      // It's already a UserProfileData or UnifiedUserProfile
      profile = userData as UnifiedUserProfile;
    }

    // On mobile, navigate to profile page
    if (isMobile) {
      router.push(`/dashboard/profile/${profile.id}`);
      return;
    }

    // Desktop: Open modal
    setCurrentProfile(profile);
    setIsProfileModalOpen(true);
  }, [isMobile, router]);

  const closeUserProfile = useCallback(() => {
    setIsProfileModalOpen(false);
    setError(null); // Clear error when closing
    // Don't clear currentProfile immediately to avoid flicker
    setTimeout(() => {
      setCurrentProfile(null);
    }, 300);
  }, []);

  return (
    <ProfileModalContext.Provider
      value={{
        isProfileModalOpen,
        currentProfile,
        loading,
        error,
        openUserProfile,
        openUserProfileWithData,
        closeUserProfile,
      }}
    >
      {children}
    </ProfileModalContext.Provider>
  );
}

export function useProfileModal() {
  const context = useContext(ProfileModalContext);
  if (context === undefined) {
    throw new Error('useProfileModal must be used within a ProfileModalProvider');
  }
  return context;
}

