'use client';

import { useCallback, useEffect, useMemo } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import {
  clearAuth,
  initializeAuth,
  setError,
  setLoading,
  setSession,
  setUser,
  signIn as signInThunk,
  signOut as signOutThunk,
} from '@/lib/store/slices/authSlice';
import { clearConnections, fetchConnections } from '@/lib/store/slices/connectionsSlice';
import { clearProfile, fetchProfile } from '@/lib/store/slices/profileSlice';
import { ActivityTypes, trackActivity } from '@/lib/utils/activityUtils';
import { supabase } from './client';

interface ProfileData {
  fullName: string;
  firstName: string;
  lastName: string;
  chapter: string;
  role: 'Admin / Executive' | 'Active Member' | 'Alumni';
  phone?: string;
  smsConsent?: boolean;
}

export function AuthBootstrapper() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.id);

  useEffect(() => {
    dispatch(initializeAuth());

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      dispatch(setSession(currentSession ?? null));
      dispatch(setUser(currentSession?.user ?? null));
      dispatch(setLoading(false));

      if (event === 'SIGNED_IN' && currentSession?.user) {
        try {
          await trackActivity(currentSession.user.id, ActivityTypes.LOGIN, {
            loginMethod: 'session_restore',
            timestamp: new Date().toISOString(),
          });
        } catch (activityError) {
          console.error('Failed to track automatic login activity:', activityError);
        }

        void dispatch(fetchProfile({ force: true }));
        void dispatch(fetchConnections({ force: true }));
      }

      if (event === 'SIGNED_OUT') {
        dispatch(clearAuth());
        dispatch(clearConnections());
        dispatch(clearProfile());
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  useEffect(() => {
    if (userId) {
      void dispatch(fetchProfile({ force: false }));
      void dispatch(fetchConnections({ force: false }));
    } else {
      dispatch(clearProfile());
      dispatch(clearConnections());
    }
  }, [dispatch, userId]);

  return null;
}

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, session, loading } = useAppSelector((state) => state.auth);

  const signIn = useCallback(async (email: string, password: string) => {
    const action = await dispatch(signInThunk({ email, password }));

    if (signInThunk.rejected.match(action)) {
      throw action.payload ?? action.error;
    }
  }, [dispatch]);

  const signUp = useCallback(async (email: string, password: string, profileData?: ProfileData) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        console.error('❌ AuthContext: Sign up failed:', error);
        throw error;
      }

      if (data.user) {
        try {
          const fullName = profileData
            ? `${profileData.firstName} ${profileData.lastName}`
            : data.user.email?.split('@')[0] || 'User';

          const { error: profileError } = await supabase
            .from('profiles')
            .upsert(
              {
                id: data.user.id,
                email: data.user.email,
                full_name: fullName,
                first_name: profileData?.firstName || null,
                last_name: profileData?.lastName || null,
                chapter: profileData?.chapter || null,
                role: profileData?.role || null,
                phone: profileData?.phone || null,
                sms_consent: profileData?.smsConsent || false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                onConflict: 'id',
              }
            );

          if (profileError) {
            console.error('❌ AuthContext: Profile creation failed:', profileError);
          } else if (profileData?.role?.toLowerCase() === 'alumni') {
            try {
              const { error: alumniError } = await supabase
                .from('alumni')
                .upsert(
                  {
                    user_id: data.user.id,
                    first_name: profileData.firstName,
                    last_name: profileData.lastName,
                    full_name: fullName,
                    chapter: profileData.chapter,
                    industry: 'Not specified',
                    graduation_year: new Date().getFullYear(),
                    company: 'Not specified',
                    job_title: 'Not specified',
                    email: data.user.email,
                    phone: null,
                    location: 'Not specified',
                    description: `Alumni from ${profileData.chapter}`,
                    avatar_url: null,
                    verified: false,
                    is_actively_hiring: false,
                    last_contact: null,
                    tags: null,
                    mutual_connections: [],
                  },
                  {
                    onConflict: 'user_id',
                    ignoreDuplicates: false,
                  }
                );

              if (alumniError) {
                console.error('❌ AuthContext: Alumni record creation failed:', alumniError);
              }
            } catch (alumniError) {
              console.error('❌ AuthContext: Alumni record creation exception:', alumniError);
            }
          }
        } catch (profileError) {
          console.error('❌ AuthContext: Profile creation exception:', profileError);
        }

        try {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            console.error('❌ AuthContext: Auto sign-in failed:', signInError);
          }
        } catch (signInError) {
          console.error('❌ AuthContext: Auto sign-in exception:', signInError);
        }
      }
    } catch (error) {
      console.error('❌ AuthContext: Sign up exception:', error);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const signOut = useCallback(async () => {
    const action = await dispatch(signOutThunk());

    if (signOutThunk.rejected.match(action)) {
      throw action.payload ?? action.error;
    }
  }, [dispatch]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }, []);

  return useMemo(
    () => ({
      user: user as User | null,
      session: session as Session | null,
      loading,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
    }),
    [loading, session, signIn, signInWithGoogle, signOut, signUp, user]
  );
}
