import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';

    if (code) {
      const supabase = createServerSupabaseClient();
      
      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error && data.user) {
        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (!existingProfile) {
          // Create new profile for Google user
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
              first_name: data.user.user_metadata?.first_name || null,
              last_name: data.user.user_metadata?.last_name || null,
              chapter: null, // Will be filled later by user
              role: null, // Will be filled later by user
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
            // Don't fail the auth - user can complete profile later
          } else {
            console.log('Profile created successfully for Google user:', data.user.id);
          }
        }

        // Successfully authenticated, redirect to dashboard
        return NextResponse.redirect(`${origin}${next}`);
      } else {
        console.error('Auth callback error:', error);
        return NextResponse.redirect(`${origin}/sign-up?error=auth_callback_failed`);
      }
    }

    // No code provided, redirect to sign-up
    return NextResponse.redirect(`${origin}/sign-up`);
  } catch (error) {
    console.error('Auth callback exception:', error);
    return NextResponse.redirect(`${origin}/sign-up?error=auth_callback_exception`);
  }
} 