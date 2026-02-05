import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch RSVPs for this event
    const { data: rsvps, error: rsvpError } = await supabase
      .from('event_rsvps')
      .select('user_id, status, responded_at')
      .eq('event_id', id);

    if (rsvpError) {
      console.error('Error fetching RSVPs:', rsvpError);
      return NextResponse.json({ error: 'Failed to fetch attendees' }, { status: 500 });
    }

    if (!rsvps || rsvps.length === 0) {
      return NextResponse.json({
        attending: [],
        maybe: [],
        not_attending: [],
        counts: { attending: 0, maybe: 0, not_attending: 0 }
      });
    }

    // Get unique user IDs
    const userIds = [...new Set(rsvps.map(r => r.user_id))];

    // Fetch profile info for all users
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url')
      .in('id', userIds);

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      return NextResponse.json({ error: 'Failed to fetch attendee profiles' }, { status: 500 });
    }

    // Create a map of profiles for quick lookup
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Group RSVPs by status with profile info
    const attending: any[] = [];
    const maybe: any[] = [];
    const not_attending: any[] = [];

    rsvps.forEach(rsvp => {
      const profile = profileMap.get(rsvp.user_id);
      const attendee = {
        user_id: rsvp.user_id,
        first_name: profile?.first_name || 'Unknown',
        last_name: profile?.last_name || '',
        avatar_url: profile?.avatar_url || null,
        responded_at: rsvp.responded_at,
      };

      switch (rsvp.status) {
        case 'attending':
          attending.push(attendee);
          break;
        case 'maybe':
          maybe.push(attendee);
          break;
        case 'not_attending':
          not_attending.push(attendee);
          break;
      }
    });

    // Sort each group by response time (most recent first)
    const sortByResponseTime = (a: any, b: any) => 
      new Date(b.responded_at).getTime() - new Date(a.responded_at).getTime();

    attending.sort(sortByResponseTime);
    maybe.sort(sortByResponseTime);
    not_attending.sort(sortByResponseTime);

    return NextResponse.json({
      attending,
      maybe,
      not_attending,
      counts: {
        attending: attending.length,
        maybe: maybe.length,
        not_attending: not_attending.length,
      }
    });

  } catch (error) {
    console.error('Error in attendees API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

