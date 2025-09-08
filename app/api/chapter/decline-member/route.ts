import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { memberId, chapterId } = await request.json();

    if (!memberId || !chapterId) {
      return NextResponse.json({ error: 'Member ID and Chapter ID are required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    
    // Update member status to declined and remove from chapter
    const { error } = await supabase
      .from('profiles')
      .update({ 
        member_status: 'declined',
        role: 'declined_member',
        chapter_id: null, // Remove from chapter
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .eq('chapter_id', chapterId);

    if (error) {
      console.error('Error declining member:', error);
      return NextResponse.json({ error: 'Failed to decline member' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in decline-member API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
