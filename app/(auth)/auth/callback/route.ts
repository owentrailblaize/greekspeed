import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { generateUniqueUsername, generateProfileSlug } from '@/lib/utils/usernameUtils';
import { validateInvitationToken, recordInvitationUsage } from '@/lib/utils/invitationUtils';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  
  // Extract invitation token and type from query params
  const invitationToken = requestUrl.searchParams.get('invitation_token');
  const invitationType = requestUrl.searchParams.get('invitation_type'); // 'active_member' or 'alumni'

  // Create response for cookie handling
  const cookieStore = await cookies();
  let response = NextResponse.next();

  // Create Supabase client with cookie handling (NOT service role)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options);
          response.cookies.set(name, value, options);
        },
        remove(name: string, options: any) {
          cookieStore.delete(name);
          response.cookies.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    // Redirect back to invitation page if token exists, otherwise to sign-in (NOT sign-up)
    if (invitationToken) {
      const redirectPath = invitationType === 'alumni' 
        ? `/alumni-join/${invitationToken}` 
        : `/join/${invitationToken}`;
      return NextResponse.redirect(
        `${requestUrl.origin}${redirectPath}?error=${encodeURIComponent(errorDescription || 'Authentication failed')}`
      );
    }
    return NextResponse.redirect(
      `${requestUrl.origin}/sign-in?error=${encodeURIComponent(errorDescription || 'Authentication failed')}`
    );
  }

  // Handle successful OAuth callback
  if (code) {
    try {
      // Exchange code for session - this will set cookies automatically
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('Session exchange error:', exchangeError);
        if (invitationToken) {
          const redirectPath = invitationType === 'alumni' 
            ? `/alumni-join/${invitationToken}` 
            : `/join/${invitationToken}`;
          return NextResponse.redirect(
            `${requestUrl.origin}${redirectPath}?error=${encodeURIComponent('Failed to complete authentication')}`
          );
        }
        return NextResponse.redirect(
          `${requestUrl.origin}/sign-in?error=${encodeURIComponent('Failed to complete authentication')}`
        );
      }

      // Use user from session data (more reliable than calling getUser again)
      const user = data?.session?.user || data?.user;
      
      if (!user) {
        console.error('No user found after session exchange. Session data:', JSON.stringify(data, null, 2));
        if (invitationToken) {
          const redirectPath = invitationType === 'alumni' 
            ? `/alumni-join/${invitationToken}` 
            : `/join/${invitationToken}`;
          return NextResponse.redirect(
            `${requestUrl.origin}${redirectPath}?error=${encodeURIComponent('User not found after authentication')}`
          );
        }
        return NextResponse.redirect(
          `${requestUrl.origin}/sign-in?error=${encodeURIComponent('User not found after authentication')}`
        );
      }

      console.log('OAuth callback - User authenticated:', user.id, user.email, 'Provider:', user.app_metadata?.provider);
      
      // Get service role client early for profile operations (avoids RLS issues)
      const { createServerSupabaseClient } = await import('@/lib/supabase/client');
      const serverSupabase = createServerSupabaseClient();
      
      // Check if profile already exists using server client (bypasses RLS)
      const { data: existingProfile, error: profileCheckError } = await serverSupabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileCheckError && profileCheckError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking for existing profile:', profileCheckError);
      }
      
      // If invitation token exists, handle invitation flow
      if (invitationToken) {
        try {
          // Validate invitation token
          const validation = await validateInvitationToken(invitationToken);
          
          if (!validation.valid || !validation.invitation) {
            console.error('Invalid invitation token:', validation.error);
            // Fall through to create basic profile without invitation
            console.log('Falling back to basic profile creation without invitation');
          } else {
            const invitation = validation.invitation;
            
            // Validate email domain if restricted
            const { validateEmailDomain, hasEmailUsedInvitation } = await import('@/lib/utils/invitationUtils');
            if (!validateEmailDomain(user.email || '', invitation.email_domain_allowlist)) {
              const redirectPath = invitationType === 'alumni' 
                ? `/alumni-join/${invitationToken}` 
                : `/join/${invitationToken}`;
              return NextResponse.redirect(
                `${requestUrl.origin}${redirectPath}?error=${encodeURIComponent('Email domain is not allowed for this invitation')}`
              );
            }
            
            // Check if this email has already used this invitation
            const hasUsed = await hasEmailUsedInvitation(invitation.id, user.email || '');
            if (hasUsed) {
              const redirectPath = invitationType === 'alumni' 
                ? `/alumni-join/${invitationToken}` 
                : `/join/${invitationToken}`;
              return NextResponse.redirect(
                `${requestUrl.origin}${redirectPath}?error=${encodeURIComponent('This email has already been used with this invitation')}`
              );
            }

            // Determine provider
            const provider = user.app_metadata?.provider || user.user_metadata?.provider || 'unknown';
            const isLinkedIn = provider === 'linkedin_oidc';
            
            // Extract LinkedIn URL if available
            const linkedinSub = user.user_metadata?.sub;
            const linkedinUrl = isLinkedIn && linkedinSub 
              ? `https://www.linkedin.com/in/${linkedinSub}` 
              : null;

            // Extract names
            const firstName = user.user_metadata?.given_name || user.user_metadata?.first_name || '';
            const lastName = user.user_metadata?.family_name || user.user_metadata?.last_name || '';
            const fullName = user.user_metadata?.full_name || user.user_metadata?.name || `${firstName} ${lastName}`.trim() || 'OAuth User';
            
            // Generate username (use server client for admin operations)
            const username = await generateUniqueUsername(serverSupabase, firstName, lastName, user.id);
            const profileSlug = generateProfileSlug(username);

            // Determine role based on invitation type
            const role = invitationType === 'alumni' ? 'alumni' : 'active_member';
            const memberStatus = invitationType === 'alumni' ? 'alumni' : 'active';

            if (!existingProfile) {
              console.log('Creating profile for user:', user.id, 'with invitation:', invitation.id);
              // Create profile with invitation association using server client
              const { error: profileError } = await serverSupabase
                .from('profiles')
                .insert({
                  id: user.id,
                  email: user.email,
                  full_name: fullName,
                  first_name: firstName,
                  last_name: lastName,
                  username: username,
                  profile_slug: profileSlug,
                  linkedin_url: linkedinUrl,
                  avatar_url: user.user_metadata?.picture || user.user_metadata?.avatar_url || null,
                  chapter_id: invitation.chapter_id,
                  chapter: validation.chapter_name,
                  role: role,
                  member_status: memberStatus,
                  welcome_seen: false,
                  phone: null,
                  grad_year: null,
                  major: null,
                  location: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });

              if (profileError) {
                console.error('Profile creation error (with invitation):', profileError);
                console.error('Profile error details:', {
                  code: profileError.code,
                  message: profileError.message,
                  details: profileError.details,
                  hint: profileError.hint
                });
                // Don't redirect on error - try to create basic profile instead
                console.log('Attempting to create basic profile without invitation data');
              } else {
                console.log('Profile created successfully for user:', user.id);
                // Record invitation usage
                await recordInvitationUsage(invitation.id, user.email || '', user.id);
                
                // Redirect directly to dashboard
                const redirectUrl = `${requestUrl.origin}/dashboard`;
                const htmlResponse = createHtmlRedirect(redirectUrl, response, cookieStore);
                return htmlResponse;
              }
            } else {
              console.log('Profile already exists for user:', user.id, 'updating with invitation data');
              // Profile exists - update with invitation data if not already associated
              if (!existingProfile.chapter_id && invitation.chapter_id) {
                const { error: updateError } = await serverSupabase
                  .from('profiles')
                  .update({
                    chapter_id: invitation.chapter_id,
                    chapter: validation.chapter_name,
                    role: role,
                    member_status: memberStatus,
                    linkedin_url: linkedinUrl || existingProfile.linkedin_url,
                    avatar_url: user.user_metadata?.picture || existingProfile.avatar_url,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', user.id);

                if (updateError) {
                  console.error('Profile update error:', updateError);
                }
              }
              // Record invitation usage
              await recordInvitationUsage(invitation.id, user.email || '', user.id);
              
              // Redirect directly to dashboard
              const redirectUrl = `${requestUrl.origin}/dashboard`;
              const htmlResponse = createHtmlRedirect(redirectUrl, response, cookieStore);
              return htmlResponse;
            }
          }
        } catch (invitationError) {
          console.error('Invitation processing error:', invitationError);
          // Don't redirect - fall through to create basic profile
          console.log('Falling back to basic profile creation');
        }
      }

      // ALWAYS ensure profile exists (fallback for missing invitation token or errors)
      if (!existingProfile) {
        console.log('Creating basic profile for user (no invitation or fallback):', user.id);
        
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

        // Extract first and last name for username generation
        const firstName = user.user_metadata?.given_name || user.user_metadata?.first_name || '';
        const lastName = user.user_metadata?.family_name || user.user_metadata?.last_name || '';
        
        // Generate username for OAuth user
        const username = await generateUniqueUsername(serverSupabase, firstName, lastName, user.id);
        const profileSlug = generateProfileSlug(username);

        // Create profile for new OAuth user
        const { error: profileError } = await serverSupabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || defaultName,
            first_name: firstName,
            last_name: lastName,
            username: username,
            profile_slug: profileSlug,
            linkedin_url: linkedinUrl,
            avatar_url: user.user_metadata?.picture || user.user_metadata?.avatar_url || null,
            chapter: null,  // Will be filled in profile completion
            role: null,     // Will be filled in profile completion
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('Profile creation error (fallback):', profileError);
          console.error('Profile error details:', {
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint
          });
          // Even if profile creation fails, redirect to sign-in with error
          return NextResponse.redirect(
            `${requestUrl.origin}/sign-in?error=${encodeURIComponent('Profile creation failed. Please contact support.')}`
          );
        }
        console.log('Basic profile created successfully for user:', user.id);
      } else {
        // Update existing profile with OAuth data if available
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
            const { error: updateError } = await serverSupabase
              .from('profiles')
              .update(updateData)
              .eq('id', user.id);

            if (updateError) {
              console.error('Profile update error:', updateError);
            }
          }
        }
      }

      // Check if profile is incomplete (missing chapter or role)
      const finalProfileCheck = await serverSupabase
        .from('profiles')
        .select('chapter, role')
        .eq('id', user.id)
        .single();

      const profile = finalProfileCheck.data;
      const isIncomplete = !profile?.chapter || !profile?.role;

      // Redirect based on profile completeness
      if (isIncomplete) {
        return NextResponse.redirect(`${requestUrl.origin}/profile/complete`);
      } else {
        return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
      }
    } catch (error) {
      console.error('Callback processing error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      if (invitationToken) {
        const redirectPath = invitationType === 'alumni' 
          ? `/alumni-join/${invitationToken}` 
          : `/join/${invitationToken}`;
        return NextResponse.redirect(
          `${requestUrl.origin}${redirectPath}?error=${encodeURIComponent('Authentication processing failed')}`
        );
      }
      return NextResponse.redirect(
        `${requestUrl.origin}/sign-in?error=${encodeURIComponent('Authentication processing failed')}`
      );
    }
  }

  // Fallback redirect - NEVER redirect to sign-up (marketing page)
  if (invitationToken) {
    const redirectPath = invitationType === 'alumni' 
      ? `/alumni-join/${invitationToken}` 
      : `/join/${invitationToken}`;
    return NextResponse.redirect(`${requestUrl.origin}${redirectPath}`);
  }
  // Redirect to sign-in instead of sign-up to avoid marketing page
  return NextResponse.redirect(`${requestUrl.origin}/sign-in`);
}

// Helper function for HTML redirect with cookies
function createHtmlRedirect(redirectUrl: string, response: NextResponse, cookieStore: any) {
  const htmlResponse = new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta http-equiv="refresh" content="0;url=${redirectUrl}">
        <script>window.location.href="${redirectUrl}";</script>
      </head>
      <body>
        <p>Redirecting... <a href="${redirectUrl}">Click here if not redirected</a></p>
      </body>
    </html>`,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    }
  );
  
  // Copy all cookies from the response to the HTML response
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      htmlResponse.headers.append(key, value);
    }
  });
  
  // Also copy cookies from response.cookies
  response.cookies.getAll().forEach((cookie) => {
    htmlResponse.cookies.set(cookie.name, cookie.value, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  });
  
  return htmlResponse;
} 