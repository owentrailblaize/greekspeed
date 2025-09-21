import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EmailService } from '@/lib/services/emailService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  console.log('📧 === EVENT EMAIL API CALLED ===');
  
  try {
    const requestBody = await request.json();
    console.log('📧 Request body received:', requestBody);
    
    const { eventId, chapterId } = requestBody;

    if (!eventId || !chapterId) {
      console.error('❌ Missing required parameters:', { eventId, chapterId });
      return NextResponse.json({ 
        error: 'Event ID and Chapter ID are required' 
      }, { status: 400 });
    }

    console.log('📧 Processing event email for:', { eventId, chapterId });

    // Fetch the event details
    console.log('�� Fetching event details...');
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('chapter_id', chapterId)
      .single();

    if (eventError || !event) {
      console.error('❌ Error fetching event:', eventError);
      console.error('❌ Event not found for:', { eventId, chapterId });
      return NextResponse.json({ 
        error: 'Event not found' 
      }, { status: 404 });
    }

    console.log('✅ Event found:', {
      id: event.id,
      title: event.title,
      chapter_id: event.chapter_id,
      status: event.status
    });

    // Fetch chapter members (active members and admins only)
    console.log('📧 Fetching chapter members...');
    const { data: members, error: membersError } = await supabase
      .from('profiles')
      .select('email, first_name, chapter_id, role')
      .eq('chapter_id', chapterId)
      .in('role', ['active_member', 'admin'])
      .not('email', 'is', null);

    if (membersError) {
      console.error('❌ Error fetching chapter members:', membersError);
      return NextResponse.json({ 
        error: 'Failed to fetch chapter members' 
      }, { status: 500 });
    }

    console.log('📧 Members found:', members?.length || 0);
    console.log('📧 Members details:', members);

    if (!members || members.length === 0) {
      console.error('❌ No active members found for chapter:', chapterId);
      return NextResponse.json({ 
        error: 'No active members found for this chapter' 
      }, { status: 404 });
    }

    // Get chapter name
    console.log('📧 Fetching chapter name...');
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('name')
      .eq('id', chapterId)
      .single();

    if (chapterError || !chapter) {
      console.error('❌ Error fetching chapter:', chapterError);
      return NextResponse.json({ 
        error: 'Chapter not found' 
      }, { status: 404 });
    }

    console.log('✅ Chapter found:', chapter.name);

    // Prepare recipients
    const recipients = members.map(member => ({
      email: member.email,
      firstName: member.first_name || 'Member',
      chapterName: chapter.name
    }));

    console.log('📧 Prepared recipients:', recipients);

    // Check environment variables
    console.log('📧 Environment check:');
    console.log('   SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Missing');
    console.log('   SENDGRID_EVENT_TEMPLATE_ID:', process.env.SENDGRID_EVENT_TEMPLATE_ID ? '✅ Set' : '❌ Missing');
    console.log('   SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL || '❌ Missing');
    console.log('   SENDGRID_FROM_NAME:', process.env.SENDGRID_FROM_NAME || '❌ Missing');

    // Send event notification emails
    console.log('📧 Calling EmailService.sendEventToChapter...');
    const emailResult = await EmailService.sendEventToChapter(recipients, {
      eventTitle: event.title,
      eventDescription: event.description,
      eventLocation: event.location,
      eventStartTime: event.start_time,
      eventEndTime: event.end_time,
      eventId: event.id
    });

    console.log('📧 Email service result:', emailResult);

    // Update event metadata to track email sending
    console.log('�� Updating event metadata...');
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
      console.error('❌ Error updating event metadata:', updateError);
      // Don't fail the request, just log the error
    } else {
      console.log('✅ Event metadata updated successfully');
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

    console.log('📧 Returning response:', response);
    console.log('📧 === EVENT EMAIL API COMPLETED ===');

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in send event email API:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
