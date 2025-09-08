import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { memberId, chapterId } = await request.json();

    if (!memberId || !chapterId) {
      return NextResponse.json({ error: 'Member ID and Chapter ID are required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    
    // Update member status to active and track approval
    const { error } = await supabase
      .from('profiles')
      .update({ 
        member_status: 'active',
        role: 'active_member',
        approved_at: new Date().toISOString(), // Track when they were approved
        welcome_seen: false, // Track if they've seen the welcome modal
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .eq('chapter_id', chapterId);

    if (error) {
      console.error('Error approving member:', error);
      return NextResponse.json({ error: 'Failed to approve member' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in approve-member API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
