import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isFeatureEnabled } from '@/types/featureFlags';
import type { CreateRecruitRequest } from '@/types/recruitment';

// Helper function to validate phone number format
function isValidPhoneNumber(phoneNumber: string): boolean {
  const cleaned = phoneNumber.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
}

// Helper function to strip @ symbol from Instagram handle
function normalizeInstagramHandle(handle: string | undefined): string | undefined {
  if (!handle) return undefined;
  return handle.replace(/^@+/, '').trim() || undefined;
}

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set() {}, // No-op for API routes
          remove() {}, // No-op for API routes
        },
      }
    );

    // Authentication: Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, chapter_id, chapter_role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Ensure user has a chapter_id
    if (!profile.chapter_id) {
      return NextResponse.json({ error: 'User must belong to a chapter' }, { status: 400 });
    }

    // Feature flag check: Query chapters table for feature_flags
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('id, feature_flags')
      .eq('id', profile.chapter_id)
      .single();

    if (chapterError || !chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Check if recruitment_crm_enabled feature flag is enabled
    if (!isFeatureEnabled(chapter.feature_flags, 'recruitment_crm_enabled')) {
      return NextResponse.json({ error: 'Recruitment CRM feature is not enabled for this chapter' }, { status: 403 });
    }

    // Permission check: Allow active_member OR admin
    if (profile.role !== 'active_member' && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions. Only active members and admins can submit recruits.' }, { status: 403 });
    }

    // Parse and validate request body
    const body: CreateRecruitRequest = await request.json();
    const { name, hometown, phone_number, instagram_handle } = body;

    // Validation: name required (non-empty string)
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required and must be a non-empty string' }, { status: 400 });
    }

    // Validation: hometown required (non-empty string)
    if (!hometown || typeof hometown !== 'string' || hometown.trim().length === 0) {
      return NextResponse.json({ error: 'Hometown is required and must be a non-empty string' }, { status: 400 });
    }

    // Validation: phone_number optional (if provided, validate format)
    if (phone_number && typeof phone_number === 'string' && phone_number.trim().length > 0) {
      if (!isValidPhoneNumber(phone_number)) {
        return NextResponse.json({ error: 'Invalid phone number format. Please provide a valid 10 or 11 digit phone number.' }, { status: 400 });
      }
    }

    // Normalize Instagram handle (strip @ symbol if provided)
    const normalizedInstagramHandle = normalizeInstagramHandle(instagram_handle);

    // Prepare data for database insert
    const insertData = {
      chapter_id: profile.chapter_id,
      name: name.trim(),
      hometown: hometown.trim(),
      phone_number: phone_number?.trim() || null,
      instagram_handle: normalizedInstagramHandle || null,
      stage: 'New' as const,
      submitted_by: user.id,
      created_by: user.id,
    };

    // Insert into recruits table
    const { data: recruit, error: insertError } = await supabase
      .from('recruits')
      .insert([insertData])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating recruit:', insertError);
      return NextResponse.json({ 
        error: 'Failed to create recruit record',
        details: insertError.message 
      }, { status: 500 });
    }

    // Return created recruit with 201 status
    return NextResponse.json(recruit, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/recruitment/recruits:', error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
