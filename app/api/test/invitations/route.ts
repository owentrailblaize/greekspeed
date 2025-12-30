import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { generateInvitationToken, generateInvitationUrl } from '@/lib/utils/invitationUtils';

/**
 * TEST ROUTE - No authentication required
 * This is for testing purposes only and should be removed or secured in production
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapter_id');
    const invitationType = searchParams.get('type') as 'active_member' | 'alumni' | null;

    // Get first available chapter if no chapter_id provided
    let targetChapterId = chapterId;
    if (!targetChapterId) {
      const { data: chapters, error: chaptersError } = await supabase
        .from('chapters')
        .select('id, name')
        .limit(1)
        .single();

      if (chaptersError || !chapters) {
        return NextResponse.json({ 
          error: 'No chapters found. Please provide a chapter_id query parameter.' 
        }, { status: 400 });
      }

      targetChapterId = chapters.id;
    }

    // Build query
    let query = supabase
      .from('invitations')
      .select(`
        *,
        chapters!inner(name),
        usage:invitation_usage(
          id,
          email,
          user_id,
          used_at
        )
      `)
      .eq('chapter_id', targetChapterId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Filter by invitation type if provided
    if (invitationType) {
      query = query.eq('invitation_type', invitationType);
    }

    const { data: invitations, error } = await query;

    if (error) {
      console.error('Invitations fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
    }

    // Transform the data to include URLs
    const transformedInvitations = invitations?.map(invitation => ({
      ...invitation,
      invitation_url: generateInvitationUrl(invitation.token, invitation.invitation_type),
      chapter_name: invitation.chapters?.name,
      usage_count: invitation.usage?.length || 0
    })) || [];

    return NextResponse.json({ 
      invitations: transformedInvitations,
      chapter_id: targetChapterId
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    const { chapter_id, invitation_type = 'active_member' } = body;

    // Get first available chapter if no chapter_id provided
    let targetChapterId = chapter_id;
    if (!targetChapterId) {
      const { data: chapters, error: chaptersError } = await supabase
        .from('chapters')
        .select('id, name')
        .limit(1)
        .single();

      if (chaptersError || !chapters) {
        return NextResponse.json({ 
          error: 'No chapters found. Please provide a chapter_id in the request body.' 
        }, { status: 400 });
      }

      targetChapterId = chapters.id;
    }

    // Generate unique token
    let invitationToken = generateInvitationToken();
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure token is unique
    while (!isUnique && attempts < maxAttempts) {
      const { data: existing } = await supabase
        .from('invitations')
        .select('id')
        .eq('token', invitationToken)
        .single();

      if (!existing) {
        isUnique = true;
      } else {
        invitationToken = generateInvitationToken();
        attempts++;
      }
    }

    if (!isUnique) {
      return NextResponse.json({ error: 'Failed to generate unique invitation token' }, { status: 500 });
    }

    // Create invitation with test user ID (using a placeholder)
    const { data: invitation, error: createError } = await supabase
      .from('invitations')
      .insert({
        token: invitationToken,
        chapter_id: targetChapterId,
        created_by: '00000000-0000-0000-0000-000000000000', // Placeholder UUID for test
        email_domain_allowlist: null,
        approval_mode: 'auto',
        single_use: false,
        expires_at: null,
        max_uses: null,
        invitation_type: invitation_type || 'active_member',
        is_active: true
      })
      .select(`
        *,
        chapters!inner(name)
      `)
      .single();

    if (createError) {
      console.error('Invitation creation error:', createError);
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
    }

    // Transform the data
    const transformedInvitation = {
      ...invitation,
      invitation_url: generateInvitationUrl(invitation.token, invitation.invitation_type),
      chapter_name: invitation.chapters?.name,
      usage: []
    };

    return NextResponse.json({ invitation: transformedInvitation });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

