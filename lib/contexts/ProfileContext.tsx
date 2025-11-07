'use client';

import { createContext, useContext, useMemo, useCallback, useEffect, ReactNode } from 'react';

import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import {
  clearProfile as clearProfileAction,
  fetchProfile,
  updateProfile as updateProfileAction,
  updateProfileAsync,
} from '@/lib/store/slices/profileSlice';
import { Profile } from '@/types/profile';
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
  const dispatch = useAppDispatch();
  const { profile, loading, error, isDeveloper } = useAppSelector((state) => state.profile);
  const userId = useAppSelector((state) => state.auth.user?.id);

  useEffect(() => {
    if (userId) {
      void dispatch(fetchProfile({ force: false }));
    } else {
      dispatch(clearProfileAction());
    }
  }, [dispatch, userId]);

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      dispatch(clearProfileAction());
      return;
    }

    const action = await dispatch(fetchProfile({ force: true }));

    if (fetchProfile.rejected.match(action)) {
      const message = typeof action.payload === 'string'
        ? action.payload
        : action.error?.message ?? 'Failed to refresh profile';
      throw new Error(message);
    }
  }, [dispatch, userId]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const action = await dispatch(updateProfileAsync(updates));

    if (updateProfileAsync.rejected.match(action)) {
      const message = typeof action.payload === 'string'
        ? action.payload
        : action.error?.message ?? 'Failed to update profile';
      throw new Error(message);
    }
  }, [dispatch, userId]);

  const uploadAvatar = useCallback(async (file: File): Promise<string> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const avatarUrl = await ProfileService.uploadAvatar(file);

    if (!avatarUrl) {
      throw new Error('Failed to upload avatar');
    }

    dispatch(updateProfileAction({ avatar_url: avatarUrl }));
    return avatarUrl;
  }, [dispatch, userId]);

  const contextValue = useMemo(
    () => ({
      profile,
      loading,
      error,
      isDeveloper,
      refreshProfile,
      updateProfile,
      uploadAvatar,
    }),
    [profile, loading, error, isDeveloper, refreshProfile, updateProfile, uploadAvatar],
  );

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
