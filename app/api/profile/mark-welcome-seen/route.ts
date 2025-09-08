import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    
    // Mark welcome as seen
    const { error } = await supabase
      .from('profiles')
      .update({ 
        welcome_seen: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error marking welcome as seen:', error);
      return NextResponse.json({ error: 'Failed to update welcome status' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in mark-welcome-seen API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
