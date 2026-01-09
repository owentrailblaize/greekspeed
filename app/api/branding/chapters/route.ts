import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { canAccessDeveloperPortal } from '@/lib/developerPermissions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/branding/chapters
 * List all chapter branding records (developer only)
 * Supports pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Create authenticated supabase client using await cookies()
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

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, is_developer')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Only developers can list all chapter branding
    if (!canAccessDeveloperPortal(profile)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Developer access required.' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = (page - 1) * limit;
    const search = searchParams.get('search') || '';

    // Use service role client for database operations
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build query
    let query = serviceSupabase
      .from('chapter_branding')
      .select(
        `
        *,
        chapter:chapters!chapter_id(
          id,
          name,
          chapter_name,
          university,
          national_fraternity
        )
      `,
        { count: 'exact' }
      );

    // Apply search filter if provided
    if (search) {
      query = query.or(
        `chapter.name.ilike.%${search}%,chapter.chapter_name.ilike.%${search}%,chapter.university.ilike.%${search}%`
      );
    }

    // Apply pagination
    query = query.order('updated_at', { ascending: false }).range(offset, offset + limit - 1);

    // Execute query
    const { data: brandingRecords, error, count } = await query;

    if (error) {
      console.error('Error fetching branding records:', error);
      return NextResponse.json({ error: 'Failed to fetch branding records' }, { status: 500 });
    }

    // Also fetch chapters without branding for complete status
    const { data: allChapters } = await serviceSupabase
      .from('chapters')
      .select('id, name, chapter_name, university')
      .eq('chapter_status', 'active');

    const chaptersWithBranding = new Set(
      brandingRecords?.map((b: any) => b.chapter_id) || []
    );
    const chaptersWithoutBranding =
      allChapters?.filter((c) => !chaptersWithBranding.has(c.id)) || [];

    return NextResponse.json({
      branding: brandingRecords || [],
      chaptersWithoutBranding,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      search,
    });
  } catch (error) {
    console.error('Error in GET branding chapters API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

