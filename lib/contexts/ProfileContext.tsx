'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
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

const profilesEqual = (a: Profile | null, b: Profile | null): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  
  // Compare key fields that matter for re-renders
  return (
    a.id === b.id &&
    a.chapter === b.chapter &&
    a.email === b.email &&
    a.first_name === b.first_name &&
    a.last_name === b.last_name &&
    a.role === b.role &&
    a.avatar_url === b.avatar_url
  );
};

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const fetchingRef = useRef(false); // Prevent concurrent fetches

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setIsDeveloper(false);
      setError(null);
      setLoading(false);
      return;
    }
    
    // Prevent concurrent fetches
    if (fetchingRef.current) {
      return;
    }
    
    try {
      fetchingRef.current = true;
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;
      
      // Only update if data actually changed (deep comparison)
      setProfile(prevProfile => {
        if (prevProfile && profilesEqual(prevProfile, data)) {
          return prevProfile; // Return same reference if data unchanged
        }
        return data;
      });
      setIsDeveloper(canAccessDeveloperPortal(data));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      console.error('Error fetching profile:', err);
      setError(errorMessage);
      setIsDeveloper(false);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [user?.id]);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
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
  }, [user?.id]);

  const uploadAvatar = useCallback(async (file: File): Promise<string> => {
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
      setProfile(prevProfile => {
        if (!prevProfile) return prevProfile;
        const updatedProfile = { ...prevProfile, avatar_url: avatarUrl };
        setIsDeveloper(canAccessDeveloperPortal(updatedProfile));
        return updatedProfile;
      });
      
      return avatarUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload avatar';
      console.error('Error uploading avatar:', err);
      setError(errorMessage);
      throw err;
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    profile,
    loading,
    error,
    isDeveloper,
    refreshProfile,
    updateProfile,
    uploadAvatar
  }), [profile, loading, error, isDeveloper, refreshProfile, updateProfile, uploadAvatar]);

  return (
    <ProfileContext.Provider value={contextValue}>
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
