'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Profile } from '@/types/profile';
import { canAccessDeveloperPortal } from '@/lib/developerPermissions';
import { ProfileService } from '@/lib/services/profileService';

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  isDeveloper: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeveloper, setIsDeveloper] = useState(false);

  const fetchProfile = async () => {
    if (!user?.id) {
      setProfile(null);
      setIsDeveloper(false);
      setError(null);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;
      
      setProfile(data);
      setIsDeveloper(canAccessDeveloperPortal(data));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      console.error('Error fetching profile:', err);
      setError(errorMessage);
      setIsDeveloper(false);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    
    try {
      setError(null);
      
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      
      setProfile(data);
      setIsDeveloper(canAccessDeveloperPortal(data));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      console.error('Error updating profile:', err);
      setError(errorMessage);
      throw err;
    }
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    
    try {
      setError(null);
      const avatarUrl = await ProfileService.uploadAvatar(file);
      
      if (!avatarUrl) {
        throw new Error('Failed to upload avatar');
      }
      
      // Update profile with new avatar URL
      if (profile) {
        const updatedProfile = { ...profile, avatar_url: avatarUrl };
        setProfile(updatedProfile);
        setIsDeveloper(canAccessDeveloperPortal(updatedProfile));
      }
      
      return avatarUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload avatar';
      console.error('Error uploading avatar:', err);
      setError(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  return (
    <ProfileContext.Provider value={{ 
      profile, 
      loading, 
      error,
      isDeveloper, 
      refreshProfile, 
      updateProfile,
      uploadAvatar
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
