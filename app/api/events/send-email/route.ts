import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EmailService } from '@/lib/services/emailService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  // Event email API called
  
  try {
    const requestBody = await request.json();
    
    const { eventId, chapterId } = requestBody;

    if (!eventId || !chapterId) {
      console.error('Missing required parameters:', { eventId, chapterId });
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
      console.error('Event not found for:', { eventId, chapterId });
      return NextResponse.json({ 
        error: 'Event not found' 
      }, { status: 404 });
    }


    // Fetch chapter members (active members and admins only)
    const { data: members, error: membersError } = await supabase
      .from('profiles')
      .select('email, first_name, chapter_id, role')
      .eq('chapter_id', chapterId)
      .in('role', ['active_member', 'admin'])
      .not('email', 'is', null);

    if (membersError) {
      console.error('Error fetching chapter members:', membersError);
      return NextResponse.json({ 
        error: 'Failed to fetch chapter members' 
      }, { status: 500 });
    }


    if (!members || members.length === 0) {
      console.error('No active members found for chapter:', chapterId);
      return NextResponse.json({ 
        error: 'No active members found for this chapter' 
      }, { status: 404 });
    }

    // Get chapter name
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('name')
      .eq('id', chapterId)
      .single();

    if (chapterError || !chapter) {
      console.error('Error fetching chapter:', chapterError);
      return NextResponse.json({ 
        error: 'Chapter not found' 
      }, { status: 404 });
    }


    // Prepare recipients
    const recipients = members.map(member => ({
      email: member.email,
      firstName: member.first_name || 'Member',
      chapterName: chapter.name
    }));



    // Send event notification emails
    const emailResult = await EmailService.sendEventToChapter(recipients, {
      eventTitle: event.title,
      eventDescription: event.description,
      eventLocation: event.location,
      eventStartTime: event.start_time,
      eventEndTime: event.end_time,
      eventId: event.id
    });


    // Update event metadata to track email sending
    const { error: updateError } = await supabase
      .from('events')
      .update({
        metadata: {
          email_sent: true,
          email_sent_at: new Date().toISOString(),
          email_recipients: recipients.length,
          email_successful: emailResult.successful,
          email_failed: emailResult.failed
        }
      })
      .eq('id', eventId);

    if (updateError) {
      console.error('Error updating event metadata:', updateError);
      // Don't fail the request, just log the error
    } else {
      // Event metadata updated successfully
    }

    const response = {
      success: true,
      message: 'Event notification emails sent successfully',
      emailResult: {
        totalRecipients: recipients.length,
        successful: emailResult.successful,
        failed: emailResult.failed
      }
    };


    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in send event email API:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
