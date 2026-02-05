import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Update the read_at timestamp for this announcement recipient
    const { data: recipient, error } = await supabase
      .from('announcement_recipients')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('announcement_id', id)
      .eq('recipient_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Announcement read receipt error:', error);
      return NextResponse.json({ error: 'Failed to mark announcement as read' }, { status: 500 });
    }

    return NextResponse.json({ recipient });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
