import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import { supabase } from '@/lib/supabase/client';
import { canAccessDeveloperPortal } from '@/lib/developerPermissions';
import type { RootState } from '@/lib/store/types';
import type { Profile } from '@/types/profile';

const CACHE_TTL_MS = 5 * 60 * 1000;

export interface ProfileState {
  profile: Profile | null;
  isDeveloper: boolean;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialState: ProfileState = {
  profile: null,
  isDeveloper: false,
  loading: false,
  error: null,
  lastFetched: null,
};

export const fetchProfile = createAsyncThunk<
  Profile | null,
  { force?: boolean } | undefined,
  { state: RootState; rejectValue: string }
>(
  'profile/fetchProfile',
  async ({ force } = {}, { getState, rejectWithValue }) => {
    const state = getState();
    const userId = state.auth.user?.id;

    if (!userId) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return rejectWithValue(error.message ?? 'Failed to fetch profile');
      }

      return data as Profile;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch profile';
      return rejectWithValue(message);
    }
  },
  {
    condition: ({ force } = {}, { getState }) => {
      const state = getState();
      const userId = state.auth.user?.id;

      if (!userId) {
        return false;
      }

      if (force) {
        return true;
      }

      const { lastFetched } = state.profile;

      if (!lastFetched) {
        return true;
      }

      const isFresh = Date.now() - lastFetched < CACHE_TTL_MS;
      return !isFresh;
    },
  },
);

export const updateProfileAsync = createAsyncThunk<
  Profile,
  Partial<Profile>,
  { state: RootState; rejectValue: string }
>('profile/updateProfile', async (updates, { getState, rejectWithValue }) => {
  const state = getState();
  const userId = state.auth.user?.id;

  if (!userId) {
    return rejectWithValue('User not authenticated');
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      return rejectWithValue(error.message ?? 'Failed to update profile');
    }

    return data as Profile;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    return rejectWithValue(message);
  }
});

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfile(state, action: PayloadAction<Profile | null>) {
      state.profile = action.payload;
      state.isDeveloper = action.payload ? canAccessDeveloperPortal(action.payload) : false;
      state.lastFetched = action.payload ? Date.now() : null;
      state.error = null;
    },
    updateProfile(state, action: PayloadAction<Partial<Profile>>) {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload } as Profile;
      } else {
        state.profile = action.payload as Profile;
      }
      state.isDeveloper = state.profile ? canAccessDeveloperPortal(state.profile) : false;
      state.lastFetched = Date.now();
    },
    clearProfile(state) {
      state.profile = null;
      state.isDeveloper = false;
      state.loading = false;
      state.error = null;
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.profile = action.payload;
        state.isDeveloper = action.payload ? canAccessDeveloperPortal(action.payload) : false;
        state.lastFetched = action.payload ? Date.now() : null;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? action.error?.message ?? 'Failed to fetch profile';
      })
      .addCase(updateProfileAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfileAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.profile = action.payload;
        state.isDeveloper = canAccessDeveloperPortal(action.payload);
        state.lastFetched = Date.now();
      })
      .addCase(updateProfileAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? action.error?.message ?? 'Failed to update profile';
      });
  },
});

export const { setProfile, updateProfile, clearProfile } = profileSlice.actions;
export default profileSlice.reducer;

export { CACHE_TTL_MS };

