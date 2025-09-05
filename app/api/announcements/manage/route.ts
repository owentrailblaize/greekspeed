import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!chapterId) {
      return NextResponse.json({ error: 'Chapter ID required' }, { status: 400 });
    }

    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Get user profile to verify permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('chapter_id, chapter_role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.chapter_id) {
      return NextResponse.json({ error: 'User not associated with a chapter' }, { status: 400 });
    }

    // Check if user has permission to manage announcements
    const allowedRoles = ['president', 'vice_president', 'secretary', 'treasurer', 'executive_board'];
    if (!profile.chapter_role || !allowedRoles.includes(profile.chapter_role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Fetch all announcements for management (including read ones)
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select(`
        *,
        sender:profiles!sender_id(
          id,
          full_name,
          first_name,
          last_name,
          avatar_url
        ),
        recipients:announcement_recipients(
          id,
          recipient_id,
          is_read,
          read_at
        )
      `)
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Announcements fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
    }

    // Transform the data to include read statistics
    const transformedAnnouncements = announcements?.map(announcement => ({
      ...announcement,
      total_recipients: announcement.recipients?.length || 0,
      read_count: announcement.recipients?.filter((r: any) => r.is_read).length || 0,
      unread_count: announcement.recipients?.filter((r: any) => !r.is_read).length || 0
    })) || [];

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('chapter_id', chapterId);

    return NextResponse.json({
      announcements: transformedAnnouncements,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}