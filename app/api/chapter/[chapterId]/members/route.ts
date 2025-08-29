import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  try {
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
      .select('role, chapter_id, chapter_role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if user has access to this chapter
    if (profile.role !== 'admin' && profile.chapter_id !== params.chapterId) {
      return NextResponse.json({ error: 'Access denied to this chapter' }, { status: 403 });
    }

    // Fetch chapter members
    const { data: members, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        first_name,
        last_name,
        chapter,
        role,
        chapter_role,
        member_status,
        pledge_class,
        grad_year,
        major,
        minor,
        gpa,
        hometown,
        bio,
        phone,
        location,
        avatar_url,
        created_at,
        updated_at,
        chapter_id,
        chapters!profiles_chapter_id_fkey(
          name,
          description,
          location,
          university,
          slug,
          founded_year
        )
      `)
      .eq('chapter_id', params.chapterId)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching chapter members:', error);
      return NextResponse.json({ error: 'Failed to fetch chapter members' }, { status: 500 });
    }

    // Transform the data to match ChapterMemberData interface
    const transformedMembers = members?.map(member => ({
      ...member,
      chapter_name: member.chapters?.name || member.chapter,
      chapter_description: member.chapters?.description,
      chapter_location: member.chapters?.location,
      chapter_university: member.chapters?.university,
      chapter_slug: member.chapters?.slug,
      chapter_founded_year: member.chapters?.founded_year,
    })) || [];

    return NextResponse.json(transformedMembers);
  } catch (error) {
    console.error('Error in chapter members API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

