'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { UnifiedUserProfile, UserProfileData } from '@/types/user-profile';
import { fetchUserProfile, alumniToUnifiedProfile } from '@/lib/services/userProfileService';
import { Alumni } from '@/lib/alumniConstants';

interface ProfileModalContextType {
  isProfileModalOpen: boolean;
  currentProfile: UnifiedUserProfile | null;
  loading: boolean;
  openUserProfile: (userId: string) => Promise<void>;
  openUserProfileWithData: (userData: UserProfileData | Alumni) => void;
  closeUserProfile: () => void;
}

const ProfileModalContext = createContext<ProfileModalContextType | undefined>(undefined);

export function ProfileModalProvider({ children }: { children: ReactNode }) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<UnifiedUserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const openUserProfile = useCallback(async (userId: string) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Try to fetch the profile
      const profile = await fetchUserProfile(userId);
      if (profile) {
        setCurrentProfile(profile);
        setIsProfileModalOpen(true);
      } else {
        console.error('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Error opening user profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const openUserProfileWithData = useCallback((userData: UserProfileData | Alumni) => {
    let profile: UnifiedUserProfile;
    
    // Check if it's an Alumni object
    if ('fullName' in userData && 'graduationYear' in userData) {
      profile = alumniToUnifiedProfile(userData as Alumni);
    } else {
      // It's already a UserProfileData or UnifiedUserProfile
      profile = userData as UnifiedUserProfile;
    }
    
    setCurrentProfile(profile);
    setIsProfileModalOpen(true);
  }, []);

  const closeUserProfile = useCallback(() => {
    setIsProfileModalOpen(false);
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

