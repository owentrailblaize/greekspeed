import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    const { content, messageType, metadata } = body;

    if (!content && !messageType && !metadata) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Build update object
    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (messageType !== undefined) updateData.message_type = messageType;
    if (metadata !== undefined) updateData.metadata = metadata;
    updateData.updated_at = new Date().toISOString();

    const { data: message, error } = await supabase
      .from('messages')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        sender:profiles!sender_id(
          id,
          full_name,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Message update error:', error);
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Message deletion error:', error);
      return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}