import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase/client';
import { ActivityTypes, trackActivity } from '@/lib/utils/activityUtils';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  session: null,
  loading: true,
  error: null,
};

const syncExistingAlumni = async (userId: string) => {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ AuthSlice: Profile fetch failed:', profileError);
      return;
    }

    if (profile?.role?.toLowerCase() === 'alumni') {
      const { data: existingAlumni, error: alumniCheckError } = await supabase
        .from('alumni')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (alumniCheckError && alumniCheckError.code !== 'PGRST116') {
        console.error('❌ AuthSlice: Alumni check failed:', alumniCheckError);
        return;
      }

      if (!existingAlumni) {
        const { error: alumniError } = await supabase.from('alumni').insert({
          user_id: userId,
          first_name: profile.first_name,
          last_name: profile.last_name,
          full_name: profile.full_name,
          chapter: profile.chapter,
          industry: 'Not specified',
          graduation_year: new Date().getFullYear(),
          company: 'Not specified',
          job_title: 'Not specified',
          email: profile.email,
          phone: null,
          location: 'Not specified',
          description: `Alumni from ${profile.chapter}`,
          avatar_url: null,
          verified: false,
          is_actively_hiring: false,
          last_contact: null,
          tags: null,
          mutual_connections: [],
        });

        if (alumniError) {
          console.error('❌ AuthSlice: Missing alumni record creation failed:', alumniError);
        }
      }
    }
  } catch (error) {
    console.error('❌ AuthSlice: Alumni sync exception:', error);
  }
};

// Create slice first to get actions
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
    },
    setSession(state, action: PayloadAction<Session | null>) {
      state.session = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    clearAuth(state) {
      state.user = null;
      state.session = null;
      state.error = null;
    },
  },
});

// Export actions so thunks can use them
export const { setUser, setSession, setLoading, setError, clearAuth } = authSlice.actions;

// Now create thunks that use the actions
export const initializeAuth = createAsyncThunk('auth/initialize', async (_, { dispatch }) => {
  dispatch(setLoading(true));

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      dispatch(setError(error.message));
    }

    dispatch(setSession(session ?? null));
    dispatch(setUser(session?.user ?? null));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to initialize auth session';
    dispatch(setError(message));
  } finally {
    dispatch(setLoading(false));
  }
});

export const signIn = createAsyncThunk(
  'auth/signIn',
  async (
    credentials: { email: string; password: string },
    { dispatch, rejectWithValue }
  ) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const { data, error } = await supabase.auth.signInWithPassword(credentials);

      if (error) {
        dispatch(setError(error.message));
        dispatch(setLoading(false));
        return rejectWithValue(error.message);
      }

      if (data.user) {
        await syncExistingAlumni(data.user.id);

        try {
          await trackActivity(data.user.id, ActivityTypes.LOGIN, {
            loginMethod: 'email',
            timestamp: new Date().toISOString(),
          });
        } catch (activityError) {
          console.error('AuthSlice: Failed to track login activity:', activityError);
        }
      }

      dispatch(setSession(data.session ?? null));
      dispatch(setUser(data.user ?? null));
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in';
      dispatch(setError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const signOut = createAsyncThunk('auth/signOut', async (_, { dispatch, rejectWithValue }) => {
  dispatch(setLoading(true));
  dispatch(setError(null));

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      dispatch(setError(error.message));
      dispatch(setLoading(false));
      return rejectWithValue(error.message);
    }

    dispatch(clearAuth());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sign out';
    dispatch(setError(message));
    return rejectWithValue(message);
  } finally {
    dispatch(setLoading(false));
  }
});

export default authSlice.reducer;