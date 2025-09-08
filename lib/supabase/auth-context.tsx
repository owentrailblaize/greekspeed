'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './client';
import { canAccessDeveloperPortal } from '@/lib/developerPermissions';

interface ProfileData {
  fullName: string;
  firstName: string;
  lastName: string;
  chapter: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null; // ✅ Make sure session is exposed
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, profileData?: ProfileData) => Promise<void>;
  signOut: () => Promise<void>;
  profile: any | null;
  isDeveloper: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any | null>(null);
  const [isDeveloper, setIsDeveloper] = useState(false);

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
        
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Add profile loading logic
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        try {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileData) {
            setProfile(profileData);
            setIsDeveloper(canAccessDeveloperPortal(profileData));
          }
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      }
    };

    loadProfile();
  }, [user]);

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
          console.log('🔍 AuthContext: Creating missing alumni record for existing user:', userId);
          
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
            console.log('✅ AuthContext: Missing alumni record created successfully');
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
      }
    } catch (error) {
      console.error('❌ AuthContext: Sign in exception:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, profileData?: ProfileData) => {
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: profileData
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create profile with pending status
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: profileData?.fullName || '',
            first_name: profileData?.firstName || '',
            last_name: profileData?.lastName || '',
            chapter: profileData?.chapter || null,
            member_status: 'pending', // Set to pending instead of active
            role: 'pending_member', // New role for pending users
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('❌ Profile creation error:', profileError);
          throw profileError;
        }
        
        console.log('✅ Profile created with pending status for user:', data.user.id);
      }
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
      
      console.log('✅ AuthContext: Sign out successful');
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
    profile,
    isDeveloper,
    signIn,
    signUp,
    signOut
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
