import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${requestUrl.origin}/sign-up?error=${encodeURIComponent(errorDescription || 'Authentication failed')}`
    );
  }

  // Handle successful OAuth callback
  if (code) {
    try {
      // Exchange code for session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('Session exchange error:', exchangeError);
        return NextResponse.redirect(
          `${requestUrl.origin}/sign-up?error=${encodeURIComponent('Failed to complete authentication')}`
        );
      }

      // Get user data
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!existingProfile) {
          // Create profile for new Google user with minimal info
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'Google User',
              first_name: user.user_metadata?.given_name || '',
              last_name: user.user_metadata?.family_name || '',
              chapter: null,  // Will be filled in profile completion
              role: null,     // Will be filled in profile completion
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
          }
        }

        // Check if profile is incomplete (missing chapter or role) - new OAuth users need to complete profile
        const profile = existingProfile || null;
        const isIncomplete = !profile?.chapter || !profile?.role;

        // Redirect new OAuth users to profile completion, existing users with complete profiles to dashboard
        if (isIncomplete) {
          return NextResponse.redirect(`${requestUrl.origin}/profile/complete`);
        } else {
          return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
        }
      }
    } catch (error) {
      console.error('Callback processing error:', error);
      return NextResponse.redirect(
        `${requestUrl.origin}/sign-up?error=${encodeURIComponent('Authentication processing failed')}`
      );
    }
  }

  // Fallback redirect - Fixed URL
  return NextResponse.redirect(`${requestUrl.origin}/sign-up`);
} 