import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { validateInvitationToken, validateEmailDomain, hasEmailUsedInvitation, recordInvitationUsage } from '@/lib/utils/invitationUtils';

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

    if (
      !email?.trim() ||
      !password ||
      !full_name?.trim() ||
      !industry?.trim() ||
      !company?.trim() ||
      !job_title?.trim() ||
      !graduation_year ||
      !location?.trim()
    ) {
      return NextResponse.json({ error: 'All required fields must be provided' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedFullName = full_name.trim();
    const defaultFirstName = normalizedFullName.split(' ')[0] || normalizedFullName;
    const defaultLastName = normalizedFullName.split(' ').slice(1).join(' ');
    const normalizedFirstName = (first_name ?? defaultFirstName).trim();
    const normalizedLastName = (last_name ?? defaultLastName).trim();
    const normalizedIndustry = industry.trim();
    const normalizedCompany = company.trim();
    const normalizedJobTitle = job_title.trim();
    const normalizedLocation = location.trim();
    const normalizedLinkedIn = linkedin_url?.trim() || null;
    const normalizedPhone = body.phone?.trim() || null;
    const nowIso = new Date().toISOString();

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
    if (!validateEmailDomain(normalizedEmail, invitation.email_domain_allowlist)) {
      return NextResponse.json({ 
        error: 'Email domain is not allowed for this invitation' 
      }, { status: 400 });
    }

    // Check if this email has already used this invitation
    const hasUsed = await hasEmailUsedInvitation(invitation.id, normalizedEmail);
    if (hasUsed) {
      return NextResponse.json({ 
        error: 'This email has already been used with this invitation' 
      }, { status: 400 });
    }

    // Create the user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: normalizedFullName,
          first_name: normalizedFirstName,
          last_name: normalizedLastName
        }
      }
    });

    if (authError || !authData.user) {
      console.error('❌ Alumni Invitation Accept: Auth signup error:', authError);
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
        email: normalizedEmail,
        full_name: normalizedFullName,
        first_name: normalizedFirstName,
        last_name: normalizedLastName,
        phone: normalizedPhone,
        sms_consent: body.sms_consent || false,
        chapter_id: invitation.chapter_id,
        chapter: validation.chapter_name,
        role: 'alumni', // KEY DIFFERENCE: alumni role
        member_status: 'active',
        access_level: 'standard',
        is_developer: false,
        bio: null,
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        onConflict: 'id',
        ignoreDuplicates: false
      }
    );

    if (profileError) {
      console.error('❌ Alumni Invitation Accept: Profile creation error:', profileError);
      console.error('❌ Alumni Invitation Accept: Profile error details:', {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint
      });
      // Clean up the auth user if profile creation fails
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (deleteError) {
        console.error('❌ Alumni Invitation Accept: Failed to clean up auth user:', deleteError);
      }
      
      return NextResponse.json({ 
        error: 'Failed to create profile' 
      }, { status: 500 });
    }

    // Create or update alumni record
    const { data: existingAlumni, error: fetchAlumniError } = await supabase
      .from('alumni')
      .select(
        'description, avatar_url, verified, is_actively_hiring, last_contact, tags, mutual_connections, created_at'
      )
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (fetchAlumniError) {
      console.error('❌ Alumni Invitation Accept: Failed to fetch existing alumni record:', fetchAlumniError);
    }

    const alumniPayload = {
      user_id: authData.user.id,
      first_name: normalizedFirstName,
      last_name: normalizedLastName,
      full_name: normalizedFullName,
      chapter: validation.chapter_name,
      chapter_id: invitation.chapter_id,
      industry: normalizedIndustry,
      graduation_year,
      company: normalizedCompany,
      job_title: normalizedJobTitle,
      email: normalizedEmail,
      phone: normalizedPhone,
      location: normalizedLocation,
      linkedin_url: normalizedLinkedIn,
      description: existingAlumni?.description ?? `Alumni from ${validation.chapter_name}`,
      avatar_url: existingAlumni?.avatar_url ?? null,
      verified: existingAlumni?.verified ?? false,
      is_actively_hiring: existingAlumni?.is_actively_hiring ?? false,
      last_contact: existingAlumni?.last_contact ?? null,
      tags: existingAlumni?.tags ?? null,
      mutual_connections: existingAlumni?.mutual_connections ?? [],
      created_at: existingAlumni?.created_at ?? nowIso,
      updated_at: nowIso
    };

    const { error: alumniError } = await supabase
      .from('alumni')
      .upsert(alumniPayload, { onConflict: 'user_id' });

    if (alumniError) {
      console.error('❌ Alumni Invitation Accept: Alumni record upsert error:', alumniError);
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (deleteError) {
        console.error('❌ Alumni Invitation Accept: Failed to clean up auth user after alumni upsert error:', deleteError);
      }

      return NextResponse.json({ 
        error: 'Failed to store alumni profile' 
      }, { status: 500 });
    }

    // Record invitation usage
    const usageResult = await recordInvitationUsage(invitation.id, normalizedEmail, authData.user.id);
    if (!usageResult.success) {
      console.error('❌ Alumni Invitation Accept: Failed to record invitation usage:', usageResult.error);
    }

    // Sign in the user after account creation
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });

    if (signInError) {
      console.error('❌ Alumni Invitation Accept: Auto sign-in failed:', signInError);
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
    console.error('❌ Alumni Invitation Accept: API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}