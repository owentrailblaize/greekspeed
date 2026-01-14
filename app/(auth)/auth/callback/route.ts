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
          // Determine provider
          const provider = user.app_metadata?.provider || user.user_metadata?.provider || 'unknown';
          const isLinkedIn = provider === 'linkedin_oidc';
          const isGoogle = provider === 'google';
          
          // Extract LinkedIn URL if available
          const linkedinSub = user.user_metadata?.sub;
          const linkedinUrl = isLinkedIn && linkedinSub 
            ? `https://www.linkedin.com/in/${linkedinSub}` 
            : null;

          // Determine default name based on provider
          let defaultName = 'OAuth User';
          if (isGoogle) {
            defaultName = 'Google User';
          } else if (isLinkedIn) {
            defaultName = 'LinkedIn User';
          }

          // Create profile for new OAuth user
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || defaultName,
              first_name: user.user_metadata?.given_name || user.user_metadata?.first_name || '',
              last_name: user.user_metadata?.family_name || user.user_metadata?.last_name || '',
              linkedin_url: linkedinUrl,
              avatar_url: user.user_metadata?.picture || user.user_metadata?.avatar_url || null,
              chapter: null,  // Will be filled in profile completion
              role: null,     // Will be filled in profile completion
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
          }
        } else {
          // Update existing profile with LinkedIn data if available
          const provider = user.app_metadata?.provider || user.user_metadata?.provider || 'unknown';
          const isLinkedIn = provider === 'linkedin_oidc';
          
          if (isLinkedIn) {
            const linkedinSub = user.user_metadata?.sub;
            const linkedinUrl = linkedinSub 
              ? `https://www.linkedin.com/in/${linkedinSub}` 
              : null;

            // Update profile with LinkedIn URL and avatar if not already set
            const updateData: any = {};
            if (linkedinUrl && !existingProfile.linkedin_url) {
              updateData.linkedin_url = linkedinUrl;
            }
            if (user.user_metadata?.picture && !existingProfile.avatar_url) {
              updateData.avatar_url = user.user_metadata.picture;
            }
            
            if (Object.keys(updateData).length > 0) {
              updateData.updated_at = new Date().toISOString();
              const { error: updateError } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', user.id);

              if (updateError) {
                console.error('Profile update error:', updateError);
              }
            }
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