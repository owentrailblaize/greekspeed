import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // For pagination

    if (!connectionId) {
      return NextResponse.json({ error: 'Connection ID required' }, { status: 400 });
    }

    // Build query with pagination
    let query = supabase
      .from('messages')
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
      .eq('connection_id', connectionId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    // Add pagination filter if 'before' timestamp provided
    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Message fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({ 
      messages: messages || [],
      page,
      limit,
      hasMore: messages && messages.length === limit
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    const { connectionId, content, messageType = 'text', metadata = {} } = body;

    if (!connectionId || !content) {
      return NextResponse.json({ error: 'Connection ID and content required' }, { status: 400 });
    }

    // Verify connection exists and is accepted
    const { data: connection, error: connectionError } = await supabase
      .from('connections')
      .select('*')
      .eq('id', connectionId)
      .eq('status', 'accepted')
      .single();

    if (connectionError || !connection) {
      return NextResponse.json({ error: 'Invalid or inactive connection' }, { status: 400 });
    }

    // For now, we'll use the requester_id as sender_id
    // TODO: Get actual authenticated user ID from auth context
    const senderId = connection.requester_id;

    // Create new message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        connection_id: connectionId,
        sender_id: senderId,
        content,
        message_type: messageType,
        metadata
      })
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
      console.error('Message creation error:', error);
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}