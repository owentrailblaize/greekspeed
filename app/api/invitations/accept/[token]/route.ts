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
    const { email, password, full_name, first_name, last_name, phone, graduation_year, major } = body;
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Validate required fields
    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Email, password, and full name are required' }, { status: 400 });
    }

    // Validate new required fields
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Validate phone format (10 digits)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      return NextResponse.json({ error: 'Phone number must be 10 digits' }, { status: 400 });
    }

    if (!graduation_year || typeof graduation_year !== 'number') {
      return NextResponse.json({ error: 'Graduation year is required' }, { status: 400 });
    }

    // Validate graduation year range
    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 10;
    const maxYear = currentYear + 10;
    if (graduation_year < minYear || graduation_year > maxYear) {
      return NextResponse.json({ 
        error: `Graduation year must be between ${minYear} and ${maxYear}` 
      }, { status: 400 });
    }

    if (!major || !major.trim()) {
      return NextResponse.json({ error: 'Major is required' }, { status: 400 });
    }

    // Validate the invitation token
    const validation = await validateInvitationToken(token);
    if (!validation.valid) {
      return NextResponse.json({ 
        error: validation.error 
      }, { status: 400 });
    }

    const invitation = validation.invitation!;

    // Validate email domain if restricted
    if (!validateEmailDomain(email, invitation.email_domain_allowlist)) {
      return NextResponse.json({ 
        error: 'Email domain is not allowed for this invitation' 
      }, { status: 400 });
    }

    // Check if this email has already used this invitation
    const hasUsed = await hasEmailUsedInvitation(invitation.id, email);
    if (hasUsed) {
      return NextResponse.json({ 
        error: 'This email has already been used with this invitation' 
      }, { status: 400 });
    }

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
      // Profile auto-created by trigger, updating with all required fields
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          chapter_id: invitation.chapter_id,
          chapter: validation.chapter_name,
          role: 'active_member',
          member_status: 'active',
          welcome_seen: false,
          phone: phone.trim(),
          sms_consent: body.sms_consent || false,
          grad_year: graduation_year,
          major: major.trim()
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
      }
    } else {
      // No auto-profile found, creating manually with all required fields
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: email.toLowerCase(),
          full_name,
          first_name: first_name || full_name.split(' ')[0],
          last_name: last_name || full_name.split(' ').slice(1).join(' '),
          phone: phone.trim(),
          sms_consent: body.sms_consent || false,
          chapter_id: invitation.chapter_id,
          chapter: validation.chapter_name,
          role: 'active_member',
          member_status: 'active',
          grad_year: graduation_year,
          major: major.trim(),
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
    }

    // Record invitation usage
    const usageResult = await recordInvitationUsage(invitation.id, email, authData.user.id);
    if (!usageResult.success) {
      console.error('❌ Invitation Accept: Failed to record invitation usage:', usageResult.error);
    }

    // Sign in the user after account creation
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password
    });

    if (signInError) {
      console.error('❌ Invitation Accept: Auto sign-in failed:', signInError);
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
        member_status: 'active',
        needs_approval: false
      }
    });
  } catch (error) {
    console.error('❌ Invitation Accept: API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}