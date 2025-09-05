import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapter_id');

    if (!chapterId) {
      return NextResponse.json({ error: 'Chapter ID is required' }, { status: 400 });
    }

    // Get pinned posts that are announcements
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!author_id(
          id,
          full_name,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('chapter_id', chapterId)
      .eq('is_pinned', true)
      .eq('is_announcement', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pinned posts:', error);
      return NextResponse.json({ error: 'Failed to fetch pinned posts' }, { status: 500 });
    }

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
