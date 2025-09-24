import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EmailService } from '@/lib/services/emailService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  // Event reminder API called
  
  try {
    const { eventId, chapterId } = await request.json();

    if (!eventId || !chapterId) {
      return NextResponse.json({ 
        error: 'Event ID and Chapter ID are required' 
      }, { status: 400 });
    }

    // Fetch the event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('chapter_id', chapterId)
      .single();

    if (eventError || !event) {
      console.error('Error fetching event:', eventError);
      return NextResponse.json({ 
        error: 'Event not found' 
      }, { status: 404 });
    }


    // Get all chapter members
    const { data: allMembers, error: membersError } = await supabase
      .from('profiles')
      .select('id, email, first_name, chapter_id, role')
      .eq('chapter_id', chapterId)
      .in('role', ['active_member', 'admin'])
      .not('email', 'is', null);

    if (membersError || !allMembers) {
      console.error('Error fetching chapter members:', membersError);
      return NextResponse.json({ 
        error: 'Failed to fetch chapter members' 
      }, { status: 500 });
    }


    // Get users who have RSVP'd
    const { data: rsvps, error: rsvpError } = await supabase
      .from('event_rsvps')
      .select('user_id')
      .eq('event_id', eventId);

    if (rsvpError) {
      console.error('Error fetching RSVPs:', rsvpError);
      return NextResponse.json({ 
        error: 'Failed to fetch RSVPs' 
      }, { status: 500 });
    }

    // Filter out users who have already RSVP'd
    const rsvpUserIds = new Set(rsvps?.map(r => r.user_id) || []);
    const membersWithoutRsvp = allMembers.filter(member => 
      !rsvpUserIds.has(member.id)
    );


    if (membersWithoutRsvp.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All members have already RSVP\'d',
        emailResult: { totalRecipients: 0, successful: 0, failed: 0 }
      });
    }

    // Get chapter name
    const { data: chapter } = await supabase
      .from('chapters')
      .select('name')
      .eq('id', chapterId)
      .single();

    // Prepare recipients
    const recipients = membersWithoutRsvp.map(member => ({
      email: member.email,
      firstName: member.first_name || 'Member',
      chapterName: chapter?.name || 'Your Chapter'
    }));

    // Calculate relative time
    const startDate = new Date(event.start_time);
    const now = new Date();
    const diffMs = startDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    let startAtRelative = '';
    if (diffDays === 0) {
      if (diffHours <= 0) {
        startAtRelative = 'now';
      } else if (diffHours === 1) {
        startAtRelative = 'in 1 hour';
      } else {
        startAtRelative = `in ${diffHours} hours`;
      }
    } else if (diffDays === 1) {
      startAtRelative = 'tomorrow';
    } else {
      startAtRelative = `in ${diffDays} days`;
    }



    const emailResult = await EmailService.sendEventReminderToChapter(recipients, {
      eventTitle: event.title,
      eventDescription: event.description,
      eventLocation: event.location,
      eventStartTime: event.start_time,
      eventEndTime: event.end_time,
      eventId: event.id,
      startAtRelative
    });


    return NextResponse.json({
      success: true,
      message: 'Event reminder emails sent successfully',
      emailResult: {
        totalRecipients: recipients.length,
        successful: emailResult.successful,
        failed: emailResult.failed
      }
    });

  } catch (error) {
    console.error('Error in send event reminder API:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
