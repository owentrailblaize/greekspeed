import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    
    // Reset member status to pending for resubmission
    const { error } = await supabase
      .from('profiles')
      .update({ 
        member_status: 'pending',
        role: 'pending_member',
        welcome_seen: false, // Reset welcome modal
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error resubmitting membership:', error);
      return NextResponse.json({ error: 'Failed to resubmit membership' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in resubmit-membership API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
