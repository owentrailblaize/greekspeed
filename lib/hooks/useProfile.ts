import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { ProfileService } from '@/lib/services/profileService';
import { Profile, ProfileFormData } from '@/types/profile';

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profileData = await ProfileService.getCurrentProfile();
      setProfile(profileData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData: Partial<ProfileFormData>) => {
    try {
      setError(null);
      const updatedProfile = await ProfileService.updateProfile(profileData);
      if (updatedProfile) {
        setProfile(updatedProfile);
        return updatedProfile;
      }
      throw new Error('Failed to update profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      setError(null);
      const avatarUrl = await ProfileService.uploadAvatar(file);
      if (avatarUrl && profile) {
        setProfile({ ...profile, avatar_url: avatarUrl });
        return avatarUrl;
      }
      throw new Error('Failed to upload avatar');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
      throw err;
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadAvatar,
    refreshProfile: loadProfile
  };
} 