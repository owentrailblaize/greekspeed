import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { validateInvitationToken, validateEmailDomain, hasEmailUsedInvitation, recordInvitationUsage } from '@/lib/utils/invitationUtils';
import { logger } from '@/lib/utils/logger';

// New interface for alumni form data
interface AlumniJoinFormData {
  email: string;
  password: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  sms_consent?: boolean;
  // Alumni-specific fields
  industry: string;
  company: string;
  job_title: string;
  graduation_year: number;
  location: string;
  linkedin_url?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const body: AlumniJoinFormData = await request.json();
    const { email, password, full_name, first_name, last_name, industry, company, job_title, graduation_year, location, linkedin_url } = body;
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    if (!email || !password || !full_name || !industry || !company || !job_title || !graduation_year || !location) {
      return NextResponse.json({ error: 'All required fields must be provided' }, { status: 400 });
    }

    // Validate the invitation token
    const validation = await validateInvitationToken(token);
    if (!validation.valid) {
      return NextResponse.json({ 
        error: validation.error 
      }, { status: 400 });
    }

    const invitation = validation.invitation!;

    // Ensure this is an alumni invitation
    if (invitation.invitation_type !== 'alumni') {
      return NextResponse.json({ 
        error: 'This invitation is not for alumni' 
      }, { status: 400 });
    }

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
      logger.error('Alumni invitation accept signup error', { authError });
      return NextResponse.json({ 
        error: authError?.message || 'Failed to create account' 
      }, { status: 500 });
    }

    // Wait for auth user to be fully created
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create the profile with alumni role
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: email.toLowerCase(),
        full_name,
        first_name: first_name || full_name.split(' ')[0],
        last_name: last_name || full_name.split(' ').slice(1).join(' '),
        phone: body.phone || null,
        sms_consent: body.sms_consent || false,
        chapter_id: invitation.chapter_id,
        chapter: validation.chapter_name,
        role: 'alumni', // KEY DIFFERENCE: alumni role
        member_status: 'active',
        access_level: 'standard',
        is_developer: false,
        bio: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        onConflict: 'id',
        ignoreDuplicates: false
      }
    );

    if (profileError) {
      logger.error('Alumni invitation accept profile creation error', {
        profileError,
        profileErrorCode: profileError.code,
        profileErrorDetails: profileError.details,
        profileErrorHint: profileError.hint,
      });
      // Clean up the auth user if profile creation fails
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (deleteError) {
        logger.error('Failed to clean up auth user after profile creation failure', {
          deleteError,
          authUserId: authData.user.id,
        });
      }
      
      return NextResponse.json({ 
        error: 'Failed to create profile' 
      }, { status: 500 });
    }

    // Create alumni record
    const { error: alumniError } = await supabase
      .from('alumni')
      .insert({
        user_id: authData.user.id,
        first_name: first_name || full_name.split(' ')[0],
        last_name: last_name || full_name.split(' ').slice(1).join(' '),
        full_name,
        chapter: validation.chapter_name,
        chapter_id: invitation.chapter_id,
        industry,
        graduation_year,
        company,
        job_title,
        email: email.toLowerCase(),
        phone: body.phone || null,
        location,
        description: `Alumni from ${validation.chapter_name}`,
        avatar_url: null,
        verified: false,
        is_actively_hiring: false,
        last_contact: null,
        tags: null,
        mutual_connections: [],
        linkedin_url: linkedin_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (alumniError) {
      logger.error('Alumni invitation accept alumni record creation error', { alumniError });
      // Don't fail the entire process, but log the error
    }

    // Record invitation usage
    const usageResult = await recordInvitationUsage(invitation.id, email, authData.user.id);
    if (!usageResult.success) {
      logger.error('Failed to record invitation usage during alumni invitation accept', {
        usageError: usageResult.error,
        invitationId: invitation.id,
        email,
      });
    }

    // Sign in the user after account creation
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password
    });

    if (signInError) {
      logger.error('Auto sign-in failed after alumni invitation accept', { signInError });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name,
        chapter_id: invitation.chapter_id,
        chapter: validation.chapter_name,
        role: 'alumni',
        member_status: 'active',
        needs_approval: false
      }
    });
  } catch (error) {
    logger.error('Alumni invitation accept route error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}