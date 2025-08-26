import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope');
    const chapterId = searchParams.get('chapter_id');

    if (!chapterId) {
      return NextResponse.json({ error: 'Chapter ID is required' }, { status: 400 });
    }

    let query = supabase
      .from('events')
      .select(`
        *,
        event_rsvps (
          id,
          user_id,
          status
        )
      `)
      .eq('chapter_id', chapterId);

    if (scope === 'upcoming') {
      query = query
        .eq('status', 'published')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    // Transform data to include RSVP counts
    const eventsWithCounts = events?.map(event => {
      const rsvps = event.event_rsvps || [];
      return {
        ...event,
        attendee_count: rsvps.filter((r: any) => r.status === 'attending').length,
        maybe_count: rsvps.filter((r: any) => r.status === 'maybe').length,
        not_attending_count: rsvps.filter((r: any) => r.status === 'not_attending').length,
        event_rsvps: undefined // Remove the raw RSVP data
      };
    }) || [];

    return NextResponse.json(eventsWithCounts);
  } catch (error) {
    console.error('Error in events API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json();
    
    // Validate required fields
    const requiredFields = ['title', 'start_time', 'end_time', 'chapter_id'];
    for (const field of requiredFields) {
      if (!eventData[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    // Validate time logic
    if (new Date(eventData.end_time) <= new Date(eventData.start_time)) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    // For now, we'll use the service role key to bypass RLS
    // In production, you'd want proper JWT validation here
    
    // Create the event
    const insertData = {
      ...eventData,
      status: eventData.status || 'published',
      created_by: eventData.created_by || 'system', // Will be updated when we add proper auth
      updated_by: eventData.updated_by || 'system'
    };

    const { data: newEvent, error } = await supabase
      .from('events')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      event: newEvent,
      message: 'Event created successfully' 
    });

  } catch (error) {
    console.error('Error in create event API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
