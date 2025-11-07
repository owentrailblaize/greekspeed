'use client';

import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

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

export function ProfileProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useProfile(): ProfileContextType {
  const dispatch = useAppDispatch();
  const { profile, loading, error, isDeveloper } = useAppSelector((state) => state.profile);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      dispatch(clearProfileAction());
      return;
    }

    const action = await dispatch(fetchProfile({ force: true }));

    if (fetchProfile.rejected.match(action)) {
      const message =
        typeof action.payload === 'string'
          ? action.payload
          : action.error?.message ?? 'Failed to refresh profile';
      throw new Error(message);
    }
  }, [dispatch, userId]);

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const action = await dispatch(updateProfileAsync(updates));

      if (updateProfileAsync.rejected.match(action)) {
        const message =
          typeof action.payload === 'string'
            ? action.payload
            : action.error?.message ?? 'Failed to update profile';
        throw new Error(message);
      }
    },
    [dispatch, userId],
  );

  const uploadAvatar = useCallback(
    async (file: File): Promise<string> => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const avatarUrl = await ProfileService.uploadAvatar(file);

      if (!avatarUrl) {
        throw new Error('Failed to upload avatar');
      }

      dispatch(updateProfileAction({ avatar_url: avatarUrl }));
      return avatarUrl;
    },
    [dispatch, userId],
  );

  return useMemo(
    () => ({
      profile,
      loading,
      error,
      isDeveloper,
      refreshProfile,
      updateProfile,
      uploadAvatar,
    }),
    [error, isDeveloper, loading, profile, refreshProfile, updateProfile, uploadAvatar],
  );
}
