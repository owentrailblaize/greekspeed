import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EmailService } from '@/lib/services/emailService';
import { logger } from "@/lib/utils/logger";

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
      logger.error('Error fetching events:', { context: [error] });
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
    logger.error('Error in events API:', { context: [error] });
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
      logger.error('Error creating event:', { context: [error] });
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }

    // NEW: Send email notifications if event is published
    if (newEvent.status === 'published') {
      
      try {
        const baseUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : process.env.NEXT_PUBLIC_APP_URL || 'https://www.trailblaize.net';
        const emailUrl = `${baseUrl}/api/events/send-email`;
        
        // Trigger email sending asynchronously
        const emailResponse = await fetch(emailUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventId: newEvent.id,
            chapterId: newEvent.chapter_id
          })
        });

        // Email API response received

        if (emailResponse.ok) {
          const emailResult = await emailResponse.json();
          // Event notification emails sent successfully
        } else {
          const errorText = await emailResponse.text();
          logger.error('Failed to send event notification emails');
          logger.error('Response status:', { context: [emailResponse.status] });
          logger.error('Response text:', { context: [errorText] });
        }
      } catch (emailError) {
        logger.error('Error sending event notification emails:', { context: [emailError] });
        logger.error('Error details:', {
                    message: emailError instanceof Error ? emailError.message : 'Unknown error',
                    stack: emailError instanceof Error ? emailError.stack : 'No stack trace'
                  });
        // Don't fail the event creation if email fails
      }
    } else {
      // Event status is not published, skipping email notifications
    }

    return NextResponse.json({ 
      success: true, 
      event: newEvent,
      message: 'Event created successfully' 
    });

  } catch (error) {
    logger.error('Error in create event API:', { context: [error] });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
