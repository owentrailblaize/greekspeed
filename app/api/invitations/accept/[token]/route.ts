import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { validateInvitationToken, validateEmailDomain, hasEmailUsedInvitation, recordInvitationUsage } from '@/lib/utils/invitationUtils';
import { JoinFormData } from '@/types/invitations';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const body: JoinFormData = await request.json();
    const { email, password, full_name, first_name, last_name } = body;
    const { token } = await params; // FIX: Await params

    // Invitation Accept: Starting process for token

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Email, password, and full name are required' }, { status: 400 });
    }

    // Validate the invitation token
    const validation = await validateInvitationToken(token);
    if (!validation.valid) {
      // Invitation Accept: Invalid token
      return NextResponse.json({ 
        error: validation.error 
      }, { status: 400 });
    }

    const invitation = validation.invitation!;
    // Invitation Accept: Token validated for chapter

    // Validate email domain if restricted
    if (!validateEmailDomain(email, invitation.email_domain_allowlist)) {
      return NextResponse.json({ 
        error: 'Email domain is not allowed for this invitation' 
      }, { status: 400 });
    }

    // Check if this email has already used this invitation
    const hasUsed = await hasEmailUsedInvitation(invitation.id, email);
    if (hasUsed) {
      // Invitation Accept: Email already used
      return NextResponse.json({ 
        error: 'This email has already been used with this invitation' 
      }, { status: 400 });
    }

    // Invitation Accept: Creating auth user...

    // Create the user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: {
          full_name,
          first_name: first_name || full_name.split(' ')[0],
          last_name: last_name || full_name.split(' ').slice(1).join(' ')
        }
      }
    });

    if (authError || !authData.user) {
      console.error('❌ Invitation Accept: Auth signup error:', authError);
      return NextResponse.json({ 
        error: authError?.message || 'Failed to create account' 
      }, { status: 500 });
    }

    // Invitation Accept: Auth user created

    // Wait a moment to ensure auth user is fully created
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if profile was automatically created by trigger
    const { data: autoProfile, error: autoProfileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, chapter_id')
      .eq('id', authData.user.id)
      .single();

    if (autoProfileError && autoProfileError.code !== 'PGRST116') {
      console.error('❌ Invitation Accept: Error checking auto-created profile:', autoProfileError);
    }

    if (autoProfile) {
      // Invitation Accept: Profile auto-created by trigger, updating...
      
      // Update the profile with invitation data
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          chapter_id: invitation.chapter_id,
          chapter: validation.chapter_name,
          role: 'active_member',
          member_status: 'active',
          welcome_seen: false // New users should see welcome modal
        })
        .eq('id', authData.user.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Invitation Accept: Profile update error:', updateError);
        
        // Clean up the auth user if profile update fails
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (deleteError) {
          console.error('❌ Invitation Accept: Failed to clean up auth user:', deleteError);
        }
        
        return NextResponse.json({ 
          error: 'Failed to update profile' 
        }, { status: 500 });
      }

      // Invitation Accept: Profile updated successfully
      
      // Wait a moment and verify the update worked
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify the update worked
      const { data: verifiedProfile, error: verifyError } = await supabase
        .from('profiles')
        .select('id, chapter_id, chapter, role, member_status')
        .eq('id', authData.user.id)
        .single();
        
      if (verifyError) {
        console.error('❌ Invitation Accept: Error verifying profile update:', verifyError);
      } else {
        // Invitation Accept: Profile verification completed
      }
    } else {
      // Invitation Accept: No auto-profile found, creating manually...
      
      // Create the profile manually
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: email.toLowerCase(),
          full_name,
          first_name: first_name || full_name.split(' ')[0],
          last_name: last_name || full_name.split(' ').slice(1).join(' '),
          chapter_id: invitation.chapter_id,
          chapter: validation.chapter_name, // FIX: Set the chapter name
          role: 'active_member',
          member_status: 'active', // Always set to active
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('❌ Invitation Accept: Profile creation error:', profileError);
        
        // Clean up the auth user if profile creation fails
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (deleteError) {
          console.error('❌ Invitation Accept: Failed to clean up auth user:', deleteError);
        }
        
        return NextResponse.json({ 
          error: 'Failed to create profile' 
        }, { status: 500 });
      }

      // Invitation Accept: Profile created successfully
    }

    // Record invitation usage
    const usageResult = await recordInvitationUsage(invitation.id, email, authData.user.id);
    if (!usageResult.success) {
      console.error('❌ Invitation Accept: Failed to record invitation usage:', usageResult.error);
      // Don't fail the signup, just log the error
    } else {
      // Invitation Accept: Invitation usage recorded
    }

    // Invitation Accept: Process completed successfully

    // CRITICAL FIX: Sign in the user after account creation
    // Invitation Accept: Signing in user...
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password
    });

    if (signInError) {
      console.error('❌ Invitation Accept: Auto sign-in failed:', signInError);
      // Don't fail the entire process, just log the error
    } else {
      // Invitation Accept: User signed in successfully
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name,
        chapter_id: invitation.chapter_id,
        chapter: validation.chapter_name,
        role: 'active_member',
        member_status: 'active', // Always set to active
        needs_approval: false // Always false for auto-approval
      }
    });
  } catch (error) {
    console.error('❌ Invitation Accept: API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

