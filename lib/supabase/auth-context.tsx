'use client';

import { createContext, useContext, useEffect, useMemo, useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { ActivityTypes, trackActivity } from '@/lib/utils/activityUtils';
import { generateUniqueUsername, generateProfileSlug } from '@/lib/utils/usernameUtils';
import { supabase } from './client';

// Helper function to log to server terminal
async function logToServer(level: 'log' | 'warn' | 'error', message: string, data?: any) {
  try {
    // Fire and forget - don't await to avoid blocking
    fetch('/api/debug/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, data }),
    }).catch(() => {
      // Silently fail if logging endpoint is unavailable
    });
  } catch (error) {
    // Silently fail
  }
}

interface ProfileData {
  fullName: string;
  firstName: string;
  lastName: string;
  chapter: string;
  role: 'Admin / Executive' | 'Active Member' | 'Alumni';
  phone?: string;
  smsConsent?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, profileData?: ProfileData) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithLinkedIn: () => Promise<void>;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const syncExistingAlumni = async (userId: string) => {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ AuthContext: Profile fetch failed:', profileError);
      return;
    }

    if (profile?.role?.toLowerCase() === 'alumni') {
      const { data: existingAlumni, error: alumniCheckError } = await supabase
        .from('alumni')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (alumniCheckError && alumniCheckError.code !== 'PGRST116') {
        console.error('❌ AuthContext: Alumni check failed:', alumniCheckError);
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
          console.error('❌ AuthContext: Missing alumni record creation failed:', alumniError);
        }
      }
    }
  } catch (error) {
    console.error('❌ AuthContext: Alumni sync exception:', error);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeAuth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        setError(error.message);
      }

      setSession(session ?? null);
      setUser(session?.user ?? null);
    } catch (authError) {
      const message =
        authError instanceof Error ? authError.message : 'Failed to initialize auth session';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession ?? null);
      setUser(currentSession?.user ?? null);
      setLoading(false);

      if (event === 'SIGNED_IN' && currentSession?.user) {
        try {
          await trackActivity(currentSession.user.id, ActivityTypes.LOGIN, {
            loginMethod: 'session_restore',
            timestamp: new Date().toISOString(),
          });
        } catch (activityError) {
          console.error('Failed to track automatic login activity:', activityError);
        }
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [initializeAuth]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          setError(error.message);
          throw error;
        }

        if (data.user) {
          await syncExistingAlumni(data.user.id);

          try {
            await trackActivity(data.user.id, ActivityTypes.LOGIN, {
              loginMethod: 'email',
              timestamp: new Date().toISOString(),
            });
          } catch (activityError) {
            console.error('AuthContext: Failed to track login activity:', activityError);
          }
        }

        setSession(data.session ?? null);
        setUser(data.user ?? null);
      } catch (signInError) {
        const message = signInError instanceof Error ? signInError.message : 'Failed to sign in';
        setError(message);
        throw signInError;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const signUp = useCallback(async (email: string, password: string, profileData?: ProfileData) => {
    await logToServer('log', '🚀 [SIGNUP] Starting signup process', { email, hasProfileData: !!profileData });
    await logToServer('log', '👤 [SIGNUP] Profile Data Received', profileData);
    
    setLoading(true);
    setError(null);

    try {
      await logToServer('log', '🔐 [SIGNUP] Step 1: Creating auth user...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        await logToServer('error', '❌ [SIGNUP] Step 1 FAILED - Auth signup error', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        setError(error.message);
        throw error;
      }

      await logToServer('log', '✅ [SIGNUP] Step 1 SUCCESS - Auth user created', {
        userId: data.user?.id,
        email: data.user?.email
      });

      if (data.user) {
        try {
          await logToServer('log', '📝 [SIGNUP] Step 2: Preparing profile data...');
          
          const fullName = profileData
            ? `${profileData.firstName} ${profileData.lastName}`
            : data.user.email?.split('@')[0] || 'User';
          
          const normalizedRole = profileData?.role
            ? (profileData.role.toLowerCase() === 'alumni' ? 'alumni' : profileData.role.toLowerCase())
            : null;
          
          await logToServer('log', '📝 [SIGNUP] Profile data prepared', {
            fullName,
            normalizedRole,
            originalRole: profileData?.role
          });

          // Generate username
          await logToServer('log', '🔤 [SIGNUP] Step 3: Generating username...', {
            firstName: profileData?.firstName || null,
            lastName: profileData?.lastName || null,
            userId: data.user.id
          });
          
          const username = await generateUniqueUsername(
            supabase,
            profileData?.firstName || null,
            profileData?.lastName || null,
            data.user.id
          );
          const profileSlug = generateProfileSlug(username);
          
          await logToServer('log', '✅ [SIGNUP] Step 3 SUCCESS - Username generated', {
            username,
            profileSlug
          });

          const profilePayload = {
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
            first_name: profileData?.firstName || null,
            last_name: profileData?.lastName || null,
            username: username,
            profile_slug: profileSlug,
            chapter: profileData?.chapter || null,
            role: normalizedRole,
            phone: profileData?.phone || null,
            sms_consent: profileData?.smsConsent || false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          await logToServer('log', '📦 [SIGNUP] Step 4: Creating profile in database...', {
            payload: profilePayload
          });

          const { data: profileResult, error: profileError } = await supabase
            .from('profiles')
            .upsert(
              profilePayload,
              {
                onConflict: 'id',
              }
            )
            .select();

          if (profileError) {
            await logToServer('error', '❌ [SIGNUP] Step 4 FAILED - Profile creation error', {
              code: profileError.code,
              message: profileError.message,
              details: profileError.details,
              hint: profileError.hint,
              fullError: profileError
            });
          } else {
            await logToServer('log', '✅ [SIGNUP] Step 4 SUCCESS - Profile created/updated', {
              profileResult
            });
            
            if (profileResult && profileResult.length > 0) {
              const savedProfile = profileResult[0];
              await logToServer('log', '✅ [SIGNUP] Saved Profile Data', {
                savedProfile,
                verification: {
                  username: savedProfile.username ? `✅ ${savedProfile.username}` : '❌ NULL',
                  profile_slug: savedProfile.profile_slug ? `✅ ${savedProfile.profile_slug}` : '❌ NULL',
                  role: savedProfile.role ? `✅ ${savedProfile.role}` : '❌ NULL',
                  chapter: savedProfile.chapter ? `✅ ${savedProfile.chapter}` : '❌ NULL',
                  first_name: savedProfile.first_name ? `✅ ${savedProfile.first_name}` : '❌ NULL',
                  last_name: savedProfile.last_name ? `✅ ${savedProfile.last_name}` : '❌ NULL',
                }
              });
            } else {
              await logToServer('warn', '⚠️ [SIGNUP] Profile result is empty - no data returned from upsert');
            }
          }

          if (!profileError && profileData?.role?.toLowerCase() === 'alumni') {
            await logToServer('log', '🎓 [SIGNUP] Step 5: Creating alumni record...');
            
            const cleanPhone = profileData?.phone 
              ? profileData.phone.replace(/\D/g, '') 
              : null;

            const alumniPayload = {
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
              phone: cleanPhone || null,
              location: 'Not specified',
              description: `Alumni from ${profileData.chapter}`,
              avatar_url: null,
              verified: false,
              is_actively_hiring: false,
              last_contact: null,
              tags: null,
              mutual_connections: [],
            };

            await logToServer('log', '📦 [SIGNUP] Alumni Payload', {
              alumniPayload
            });

            const { data: alumniResult, error: alumniError } = await supabase
              .from('alumni')
              .upsert(
                alumniPayload,
                {
                  onConflict: 'user_id',
                  ignoreDuplicates: false,
                }
              )
              .select();

            if (alumniError) {
              await logToServer('error', '❌ [SIGNUP] Step 5 FAILED - Alumni record creation error', {
                code: alumniError.code,
                message: alumniError.message,
                details: alumniError.details,
                hint: alumniError.hint
              });
            } else {
              await logToServer('log', '✅ [SIGNUP] Step 5 SUCCESS - Alumni record created/updated', {
                alumniResult
              });
            }
          } else if (profileData?.role?.toLowerCase() !== 'alumni') {
            await logToServer('log', '⏭️ [SIGNUP] Step 5 SKIPPED - Not an alumni role', {
              role: profileData?.role
            });
          }

          // Verify profile was saved correctly by fetching it back
          await logToServer('log', '🔍 [SIGNUP] Step 6: Verifying profile was saved...');
          const { data: verifyProfile, error: verifyError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (verifyError) {
            await logToServer('error', '❌ [SIGNUP] Step 6 FAILED - Could not verify profile', {
              error: verifyError
            });
          } else {
            await logToServer('log', '✅ [SIGNUP] Step 6 SUCCESS - Profile verification', {
              verifiedProfile: verifyProfile,
              fieldCheck: {
                id: verifyProfile.id,
                username: verifyProfile.username || '❌ MISSING',
                profile_slug: verifyProfile.profile_slug || '❌ MISSING',
                role: verifyProfile.role || '❌ MISSING',
                chapter: verifyProfile.chapter || '❌ MISSING',
                first_name: verifyProfile.first_name || '❌ MISSING',
                last_name: verifyProfile.last_name || '❌ MISSING',
                email: verifyProfile.email || '❌ MISSING',
              }
            });
          }

        } catch (profileError) {
          await logToServer('error', '❌ [SIGNUP] Profile creation exception caught', {
            error: profileError,
            errorType: typeof profileError,
            errorConstructor: profileError?.constructor?.name,
            errorMessage: profileError instanceof Error ? profileError.message : 'Unknown',
            errorStack: profileError instanceof Error ? profileError.stack : undefined
          });
        }

        try {
          await logToServer('log', '🔐 [SIGNUP] Step 7: Auto sign-in after profile creation...');
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            await logToServer('error', '❌ [SIGNUP] Step 7 FAILED - Auto sign-in error', {
              message: signInError.message,
              status: signInError.status,
              name: signInError.name
            });
            setError(signInError.message);
          } else {
            await logToServer('log', '✅ [SIGNUP] Step 7 SUCCESS - Auto sign-in completed', {
              userId: signInData.user?.id
            });
          }
        } catch (signInError) {
          await logToServer('error', '❌ [SIGNUP] Auto sign-in exception', {
            error: signInError
          });
          setError(signInError instanceof Error ? signInError.message : 'Auto sign-in failed');
        }
      } else {
        await logToServer('warn', '⚠️ [SIGNUP] No user returned from auth.signUp()');
      }
    } catch (error) {
      await logToServer('error', '❌ [SIGNUP] Top-level exception', {
        error: error,
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : 'Unknown',
        errorStack: error instanceof Error ? error.stack : undefined
      });
      setError(error instanceof Error ? error.message : 'Failed to sign up');
      throw error;
    } finally {
      await logToServer('log', '🏁 [SIGNUP] Signup process completed');
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setError(error.message);
        throw error;
      }

      setUser(null);
      setSession(null);
    } catch (signOutError) {
      const message = signOutError instanceof Error ? signOutError.message : 'Failed to sign out';
      setError(message);
      throw signOutError;
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
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

    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const signInWithLinkedIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'openid profile email',
        },
      });

      if (error) {
        throw error;
      }

    } catch (error) {
      console.error('LinkedIn sign-in error:', error);
      throw error;
    }
  };

  const getAuthHeaders = useCallback(() => {
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

    return {
      Authorization: `Bearer ${session.access_token}`,
    };
  }, [session?.access_token]);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      error,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      signInWithLinkedIn,
      getAuthHeaders,
    }),
    [error, getAuthHeaders, loading, session, signIn, signInWithGoogle, signInWithLinkedIn, signOut, signUp, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
