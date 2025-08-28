import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // Await params first
    const { status, user_id } = await request.json();
    
    if (!['attending', 'maybe', 'not_attending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid RSVP status' }, { status: 400 });
    }

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if event exists and is published
    const { data: event } = await supabase
      .from('events')
      .select('id, chapter_id, start_time, status')
      .eq('id', id) // Use awaited id
      .single();

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.status !== 'published') {
      return NextResponse.json({ error: 'Event is not published' }, { status: 400 });
    }

    // Check if RSVP window is still open
    if (new Date() >= new Date(event.start_time)) {
      return NextResponse.json({ error: 'RSVP is closed for this event' }, { status: 400 });
    }

    // Upsert RSVP (insert or update)
    const { data: rsvp, error } = await supabase
      .from('event_rsvps')
      .upsert({
        event_id: id, // Use awaited id
        user_id,
        status,
        responded_at: new Date().toISOString()
      }, {
        onConflict: 'event_id,user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating RSVP:', error);
      return NextResponse.json({ error: 'Failed to create RSVP' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      rsvp,
      message: 'RSVP updated successfully' 
    });

  } catch (error) {
    console.error('Error in RSVP API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // Await the params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user has an existing RSVP for this event
    const { data: existingRSVP, error } = await supabase
      .from('event_rsvps')
      .select('status')
      .eq('event_id', id)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching RSVP:', error);
      return NextResponse.json({ error: 'Failed to fetch RSVP' }, { status: 500 });
    }

    // Return the RSVP status if it exists, otherwise return null
    return NextResponse.json({
      status: existingRSVP?.status || null,
      hasRSVP: !!existingRSVP
    });

  } catch (error) {
    console.error('Error in RSVP GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
