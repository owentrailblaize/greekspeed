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
    const userId = searchParams.get('userId');
    const targetUserId = searchParams.get('targetUserId');

    if (!userId || !targetUserId) {
      return NextResponse.json({ 
        error: 'Both userId and targetUserId are required' 
      }, { status: 400 });
    }

    // Get current user's accepted connections
    const { data: userConnections, error: userError } = await supabase
      .from('connections')
      .select('requester_id, recipient_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

    if (userError) {
      console.error('Error fetching user connections:', userError);
      return NextResponse.json({ error: 'Failed to fetch user connections' }, { status: 500 });
    }

    // Get target user's accepted connections
    const { data: targetConnections, error: targetError } = await supabase
      .from('connections')
      .select('requester_id, recipient_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${targetUserId},recipient_id.eq.${targetUserId}`);

    if (targetError) {
      console.error('Error fetching target connections:', targetError);
      return NextResponse.json({ error: 'Failed to fetch target connections' }, { status: 500 });
    }

    // Extract user IDs from connections
    const getUserConnections = (connections: any[], userId: string) => {
      return connections.map(conn => 
        conn.requester_id === userId ? conn.recipient_id : conn.requester_id
      );
    };

    const userConnectionIds = getUserConnections(userConnections || [], userId);
    const targetConnectionIds = getUserConnections(targetConnections || [], targetUserId);

    // Find mutual connections (intersection)
    const mutualConnectionIds = userConnectionIds.filter(id => 
      targetConnectionIds.includes(id)
    );

    // If no mutual connections, return early
    if (mutualConnectionIds.length === 0) {
      return NextResponse.json({ 
        mutualConnections: [], 
        count: 0 
      });
    }

    // Fetch profile details for mutual connections
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, first_name, last_name, avatar_url')
      .in('id', mutualConnectionIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    const mutualConnections = profiles?.map(profile => ({
      id: profile.id,
      name: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
      avatar: profile.avatar_url
    })) || [];

    return NextResponse.json({ 
      mutualConnections,
      count: mutualConnections.length
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

