import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapter_id');

    if (!chapterId) {
      return NextResponse.json({ error: 'Chapter ID is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    
    const { data: members, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, first_name, last_name, created_at, chapter_id')
      .eq('chapter_id', chapterId)
      .eq('member_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending members:', error);
      return NextResponse.json({ error: 'Failed to fetch pending members' }, { status: 500 });
    }

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error in pending-members API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

