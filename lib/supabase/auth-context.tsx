'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './client';

interface ProfileData {
  fullName: string;
  firstName: string;
  lastName: string;
  chapter: string;
  role: 'Admin / Executive' | 'Active Member' | 'Alumni';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, profileData?: ProfileData) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 AuthProvider: Initializing...');
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🔍 AuthProvider: Initial session check:', { 
          session: !!session, 
          error: error?.message,
          userId: session?.user?.id 
        });
        
        if (error) {
          console.error('❌ AuthProvider: Session check error:', error);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        console.log('🔍 AuthProvider: State updated:', { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          userId: session?.user?.id 
        });
      } catch (error) {
        console.error('❌ AuthProvider: Session check exception:', error);
      } finally {
        setLoading(false);
        console.log('🔍 AuthProvider: Loading set to false');
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 AuthProvider: Auth state changed:', { 
          event, 
          session: !!session, 
          userId: session?.user?.id 
        });
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        console.log('🔄 AuthProvider: State updated after auth change:', { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          userId: session?.user?.id 
        });
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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
    console.log('🔍 AuthContext: Attempting sign in for:', email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      console.log('🔍 AuthContext: Sign in result:', { 
        success: !error, 
        error: error?.message,
        userId: data.user?.id,
        session: !!data.session 
      });
      
      if (error) {
        console.error('❌ AuthContext: Sign in failed:', error);
        throw error;
      }
      
      console.log('✅ AuthContext: Sign in successful');
      
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
    console.log('🔍 AuthContext: Attempting sign up for:', email, 'with profile data:', profileData);
    
    try {
      // First, sign up the user
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      console.log('🔍 AuthContext: Sign up result:', { 
        success: !error, 
        error: error?.message,
        userId: data.user?.id,
        session: !!data.session 
      });
      
      if (error) {
        console.error('❌ AuthContext: Sign up failed:', error);
        throw error;
      }

      // If signup successful and user exists, create profile
      if (data.user) {
        console.log('🔍 AuthContext: Creating profile for user:', data.user.id);
        
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
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            });

          if (profileError) {
            console.error('❌ AuthContext: Profile creation failed:', profileError);
          } else {
            console.log('✅ AuthContext: Profile created successfully with data:', {
              fullName,
              chapter: profileData?.chapter,
              role: profileData?.role
            });

            // NEW CODE: If role is "Alumni", also create an alumni record
            if (profileData?.role?.toLowerCase() === 'alumni') {
              console.log('🔍 AuthContext: Creating alumni record for user:', data.user.id);
              
              try {
                const { error: alumniError } = await supabase
                  .from('alumni')
                  .insert({
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
                  });

                if (alumniError) {
                  console.error('❌ AuthContext: Alumni record creation failed:', alumniError);
                  // Don't throw here - profile was created successfully
                  // We can handle alumni creation later if needed
                } else {
                  console.log('✅ AuthContext: Alumni record created successfully');
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
        console.log('🔍 AuthContext: Attempting auto sign-in...');
        
        try {
          const { error: signInError } = await supabase.auth.signInWithPassword({ 
            email, 
            password 
          });
          
          if (signInError) {
            console.error('❌ AuthContext: Auto sign-in failed:', signInError);
          } else {
            console.log('✅ AuthContext: Auto sign-in successful');
          }
        } catch (signInError) {
          console.error('❌ AuthContext: Auto sign-in exception:', signInError);
        }
      }
      
      console.log('✅ AuthContext: Sign up process completed');
    } catch (error) {
      console.error('❌ AuthContext: Sign up exception:', error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('🔍 AuthContext: Attempting sign out');
    
    try {
      const { error } = await supabase.auth.signOut();
      
      console.log('🔍 AuthContext: Sign out result:', { success: !error, error: error?.message });
      
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

  console.log('🔍 AuthProvider: Rendering with state:', { 
    loading, 
    hasUser: !!user, 
    hasSession: !!session,
    userId: user?.id 
  });

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
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
