'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './client';
import { trackActivity, ActivityTypes } from '@/lib/utils/activityUtils';

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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, profileData?: ProfileData) => Promise<void>;
  signOut: () => Promise<void>;
  // REMOVED: profile and isDeveloper - use ProfileContext instead
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // REMOVED: profile and isDeveloper state

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ AuthProvider: Session check error:', error);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('❌ AuthProvider: Session check exception:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Track login activity for automatic logins
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            await trackActivity(session.user.id, ActivityTypes.LOGIN, {
              loginMethod: 'session_restore',
              timestamp: new Date().toISOString()
            });
          } catch (activityError) {
            console.error('Failed to track automatic login activity:', activityError);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // REMOVED: Profile loading useEffect (lines 88-109)

  const syncExistingAlumni = async (userId: string) => {
    try {
      // Check if user has role 'alumni' in profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('❌ AuthContext: Profile fetch failed:', profileError);
        return;
      }

      // If profile has role 'alumni' and no alumni record exists
      if (profile.role?.toLowerCase() === 'alumni') {
        const { data: existingAlumni, error: alumniCheckError } = await supabase
          .from('alumni')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (alumniCheckError && alumniCheckError.code !== 'PGRST116') {
          console.error('❌ AuthContext: Alumni check failed:', alumniCheckError);
          return;
        }

        // If no alumni record exists, create one
        if (!existingAlumni) {
          // AuthContext: Creating missing alumni record for existing user
          
          const { error: alumniError } = await supabase
            .from('alumni')
            .insert({
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
          } else {
            // AuthContext: Missing alumni record created successfully
          }
        }
      }
    } catch (error) {
      console.error('❌ AuthContext: Alumni sync exception:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('❌ AuthContext: Sign in failed:', error);
        throw error;
      }
      
      if (!error && data.user) {
        // Sync existing alumni after successful sign in
        await syncExistingAlumni(data.user.id);
        
        // Track login activity
        try {
          await trackActivity(data.user.id, ActivityTypes.LOGIN, {
            loginMethod: 'email',
            timestamp: new Date().toISOString()
          });
        } catch (activityError) {
          console.error('Failed to track login activity:', activityError);
          // Don't throw - login was successful
        }
      }
    } catch (error) {
      console.error('❌ AuthContext: Sign in exception:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, profileData?: ProfileData) => {
    
    try {
      // First, sign up the user
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) {
        console.error('❌ AuthContext: Sign up failed:', error);
        throw error;
      }

      // If signup successful and user exists, create profile
      if (data.user) {
        // AuthContext: Creating profile for user
        
        try {
          const fullName = profileData 
            ? `${profileData.firstName} ${profileData.lastName}`
            : data.user.email?.split('@')[0] || 'User';

          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
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
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            });

          if (profileError) {
            console.error('❌ AuthContext: Profile creation failed:', profileError);
          } else {
            // AuthContext: Profile created successfully

            // NEW CODE: If role is "Alumni", also create an alumni record
            if (profileData?.role?.toLowerCase() === 'alumni') {
              // AuthContext: Creating alumni record for user
              
              try {
                const { error: alumniError } = await supabase
                  .from('alumni')
                  .upsert({
                    user_id: data.user.id,
                    first_name: profileData.firstName,
                    last_name: profileData.lastName,
                    full_name: fullName,
                    chapter: profileData.chapter,
                    industry: 'Not specified', // Default value
                    graduation_year: new Date().getFullYear(), // Default to current year
                    company: 'Not specified', // Default value
                    job_title: 'Not specified', // Default value
                    email: data.user.email,
                    phone: null,
                    location: 'Not specified', // Default value
                    description: `Alumni from ${profileData.chapter}`,
                    avatar_url: null,
                    verified: false,
                    is_actively_hiring: false,
                    last_contact: null,
                    tags: null,
                    mutual_connections: [], // Empty array for new alumni
                  }, {
                    onConflict: 'user_id', // Handle conflicts on user_id
                    ignoreDuplicates: false // Update if exists, insert if not
                  });

                if (alumniError) {
                  console.error('❌ AuthContext: Alumni record creation failed:', alumniError);
                  // Don't throw here - profile was created successfully
                  // We can handle alumni creation later if needed
                } else {
                  // AuthContext: Alumni record created/updated successfully
                }
              } catch (alumniError) {
                console.error('❌ AuthContext: Alumni record creation exception:', alumniError);
                // Don't throw here - profile was created successfully
              }
            }
          }
        } catch (profileError) {
          console.error('❌ AuthContext: Profile creation exception:', profileError);
        }

        // Auto sign-in after successful sign-up
        // AuthContext: Attempting auto sign-in...
        
        try {
          const { error: signInError } = await supabase.auth.signInWithPassword({ 
            email, 
            password 
          });
          
          if (signInError) {
            console.error('❌ AuthContext: Auto sign-in failed:', signInError);
          } else {
            // AuthContext: Auto sign-in successful
          }
        } catch (signInError) {
          console.error('❌ AuthContext: Auto sign-in exception:', signInError);
        }
      }
      
      // AuthContext: Sign up process completed
    } catch (error) {
      console.error('❌ AuthContext: Sign up exception:', error);
      throw error;
    }
  };

  const signOut = async () => {
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ AuthContext: Sign out failed:', error);
        throw error;
      }
      
      // AuthContext: Sign out successful
    } catch (error) {
      console.error('❌ AuthContext: Sign out exception:', error);
      throw error;
    }
  };

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

      return data;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut
    // REMOVED: profile and isDeveloper
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
