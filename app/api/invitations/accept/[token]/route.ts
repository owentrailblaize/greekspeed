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

    console.log(' Invitation Accept: Starting process for token:', token);
    console.log(' Invitation Accept: Email:', email);

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Email, password, and full name are required' }, { status: 400 });
    }

    // Validate the invitation token
    const validation = await validateInvitationToken(token);
    if (!validation.valid) {
      console.log('❌ Invitation Accept: Invalid token:', validation.error);
      return NextResponse.json({ 
        error: validation.error 
      }, { status: 400 });
    }

    const invitation = validation.invitation!;
    console.log('✅ Invitation Accept: Token validated for chapter:', invitation.chapter_id);
    console.log('🔍 Invitation Accept: Chapter ID from invitation:', invitation.chapter_id);

    // Validate email domain if restricted
    if (!validateEmailDomain(email, invitation.email_domain_allowlist)) {
      return NextResponse.json({ 
        error: 'Email domain is not allowed for this invitation' 
      }, { status: 400 });
    }

    // Check if this email has already used this invitation
    const hasUsed = await hasEmailUsedInvitation(invitation.id, email);
    if (hasUsed) {
      console.log('❌ Invitation Accept: Email already used:', email);
      return NextResponse.json({ 
        error: 'This email has already been used with this invitation' 
      }, { status: 400 });
    }

    console.log('🔍 Invitation Accept: Creating auth user...');

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

    console.log('✅ Invitation Accept: Auth user created:', authData.user.id);

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
      console.log('✅ Invitation Accept: Profile auto-created by trigger, updating...');
      console.log(' Invitation Accept: Current profile chapter_id:', autoProfile.chapter_id);
      console.log('🔍 Invitation Accept: Setting chapter_id to:', invitation.chapter_id);
      console.log('🔍 Invitation Accept: Setting chapter to:', validation.chapter_name);
      
      // Update the existing profile with invitation-specific data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          email: email.toLowerCase(),
          full_name,
          first_name: first_name || full_name.split(' ')[0],
          last_name: last_name || full_name.split(' ').slice(1).join(' '),
          chapter_id: invitation.chapter_id,
          chapter: validation.chapter_name, // FIX: Set the chapter name
          role: 'active_member',
          member_status: invitation.approval_mode === 'pending' ? 'probation' : 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', authData.user.id);

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

      console.log('✅ Invitation Accept: Profile updated successfully');
      
      // Wait a moment and verify the update worked
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify the update worked
      const { data: updatedProfile, error: verifyError } = await supabase
        .from('profiles')
        .select('id, chapter_id, chapter, role, member_status')
        .eq('id', authData.user.id)
        .single();
        
      if (verifyError) {
        console.error('❌ Invitation Accept: Error verifying profile update:', verifyError);
      } else {
        console.log('✅ Invitation Accept: Profile verification - chapter_id:', updatedProfile?.chapter_id);
        console.log('✅ Invitation Accept: Profile verification - chapter:', updatedProfile?.chapter);
        console.log('✅ Invitation Accept: Profile verification - role:', updatedProfile?.role);
        console.log('✅ Invitation Accept: Profile verification - member_status:', updatedProfile?.member_status);
      }
    } else {
      console.log('🔍 Invitation Accept: No auto-profile found, creating manually...');
      
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
          member_status: invitation.approval_mode === 'pending' ? 'probation' : 'active',
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

      console.log('✅ Invitation Accept: Profile created successfully');
    }

    // Record invitation usage
    const usageResult = await recordInvitationUsage(invitation.id, email, authData.user.id);
    if (!usageResult.success) {
      console.error('❌ Invitation Accept: Failed to record invitation usage:', usageResult.error);
      // Don't fail the signup, just log the error
    } else {
      console.log('✅ Invitation Accept: Invitation usage recorded');
    }

    console.log('✅ Invitation Accept: Process completed successfully');

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name,
        chapter_id: invitation.chapter_id,
        chapter: validation.chapter_name, // FIX: Include chapter name in response
        role: 'active_member',
        member_status: invitation.approval_mode === 'pending' ? 'probation' : 'active',
        needs_approval: invitation.approval_mode === 'pending'
      }
    });
  } catch (error) {
    console.error('❌ Invitation Accept: API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

