import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EmailService } from '@/lib/services/emailService';
import { SMSService } from '@/lib/services/sms/smsServiceTelnyx';
import { SMSNotificationService } from '@/lib/services/sms/smsNotificationService';
import { canSendEmailNotification } from '@/lib/utils/checkEmailPreferences';
import { logger } from "@/lib/utils/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  // Event email API called
  
  try {
    const requestBody = await request.json();
    
    const { eventId, chapterId } = requestBody;

    if (!eventId || !chapterId) {
      logger.error('Missing required parameters:', { eventId, chapterId });
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
      logger.error('Error fetching event:', { context: [eventError] });
      logger.error('Event not found for:', { eventId, chapterId });
      return NextResponse.json({ 
        error: 'Event not found' 
      }, { status: 404 });
    }


    // Fetch chapter members (active members and admins only)
    const { data: members, error: membersError } = await supabase
      .from('profiles')
      .select('id, email, first_name, chapter_id, role')
      .eq('chapter_id', chapterId)
      .in('role', ['active_member', 'admin'])
      .not('email', 'is', null);

    if (membersError) {
      logger.error('Error fetching chapter members:', { context: [membersError] });
      return NextResponse.json({ 
        error: 'Failed to fetch chapter members' 
      }, { status: 500 });
    }


    if (!members || members.length === 0) {
      logger.error('No active members found for chapter:', { context: [chapterId] });
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
      logger.error('Error fetching chapter:', { context: [chapterError] });
      return NextResponse.json({ 
        error: 'Chapter not found' 
      }, { status: 404 });
    }


    // Prepare recipients with email preference checks (email_enabled AND event_notifications)
    const allowedMembers = await Promise.all(
      (members || []).map(async (member) => {
        try {
          const allowed = await canSendEmailNotification(member.id as string, 'event');
          return allowed ? member : null;
        } catch {
          return null;
        }
      })
    );

    const recipients = allowedMembers
      .filter((m): m is NonNullable<typeof m> => Boolean(m))
      .map(member => ({
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

    // Send SMS notifications (parallel to email, don't block if SMS fails)
    try {
      logger.info('📱 Starting SMS notification process for event:', {
                eventId: event.id,
                eventTitle: event.title,
                chapterId: chapterId
              });

      // Get chapter members with phone numbers and SMS consent
      const { data: smsMembers, error: smsMembersError } = await supabase
        .from('profiles')
        .select(`
          id,
          phone,
          first_name,
          chapter_id,
          role,
          sms_consent  
        `)
        .eq('chapter_id', chapterId)
        .in('role', ['active_member', 'admin'])
        .not('phone', 'is', null)
        .neq('phone', '')
        .eq('sms_consent', true);

      if (smsMembersError) {
        logger.error('❌ Error fetching SMS members:', { context: [smsMembersError] });
      } else if (!smsMembers || smsMembers.length === 0) {
        logger.info('ℹ️ No SMS-eligible members found:', {
                    chapterId,
                    reason: 'No members with phone numbers and SMS consent'
                  });
      } else {
        logger.info('📋 Found SMS-eligible members:', {
                    total: smsMembers.length,
                    members: smsMembers.map(m => ({
                      id: m.id,
                      firstName: m.first_name,
                      phone: m.phone,
                      hasConsent: m.sms_consent
                    }))
                  });

        // Format and validate phone numbers
        const validSMSMembers = smsMembers
          .map(member => ({
            ...member,
            formattedPhone: SMSService.formatPhoneNumber(member.phone!),
          }))
          .filter(member => SMSService.isValidPhoneNumber(member.phone!));

        logger.info('✅ Validated SMS members:', {
                    total: validSMSMembers.length,
                    valid: validSMSMembers.map(m => ({
                      id: m.id,
                      firstName: m.first_name,
                      original: m.phone,
                      formatted: m.formattedPhone
                    })),
                    invalid: smsMembers.length - validSMSMembers.length
                  });

        if (validSMSMembers.length > 0) {
          // Format event date for SMS message
          const eventDate = new Date(event.start_time);
          const formattedDate = eventDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          });

          // Determine if we should use test mode (same logic as email)
          const isSandbox = SMSService.isInSandboxMode();
          const membersToNotify = isSandbox ? validSMSMembers.slice(0, 3) : validSMSMembers;

          logger.info('🚀 Preparing to send SMS:', {
                        totalEligible: validSMSMembers.length,
                        willNotify: membersToNotify.length,
                        isSandbox: isSandbox,
                        eventDate: formattedDate,
                        recipients: membersToNotify.map(m => ({
                          name: m.first_name,
                          phone: m.formattedPhone
                        }))
                      });

          // Import SMSNotificationService
          const { SMSNotificationService } = await import('@/lib/services/sms/smsNotificationService');

          // Send SMS notifications in parallel (don't await - fire and forget)
          Promise.all(
            membersToNotify.map(member =>
              SMSNotificationService.sendEventNotification(
                member.formattedPhone,
                member.first_name || 'Member',
                event.title,
                formattedDate,
                member.id,
                chapterId
              )
            )
          )
            .then(results => {
              const successCount = results.filter(r => r === true).length;
              const failedCount = results.length - successCount;
              logger.info('✅ Event SMS notifications completed:', {
                                eventId: event.id,
                                eventTitle: event.title,
                                total: membersToNotify.length,
                                success: successCount,
                                failed: failedCount,
                                successRate: `${((successCount / membersToNotify.length) * 100).toFixed(1)}%`,
                                recipients: membersToNotify.map((m, i) => ({
                                  name: m.first_name,
                                  phone: m.formattedPhone,
                                  status: results[i] ? 'success' : 'failed'
                                }))
                              });
            })
            .catch(error => {
              logger.error('❌ Event SMS notifications failed:', {
                                eventId: event.id,
                                error: error.message,
                                stack: error.stack
                              });
              // Don't throw - SMS failure shouldn't block email sending
            });
        }
      }
    } catch (smsError) {
      logger.error('❌ Error in SMS notification process:', {
                eventId: event.id,
                error: smsError instanceof Error ? smsError.message : 'Unknown error',
                stack: smsError instanceof Error ? smsError.stack : undefined
              });
      // Don't fail the request if SMS fails
    }


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
      logger.error('Error updating event metadata:', { context: [updateError] });
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
    logger.error('Error in send event email API:', { context: [error] });
    logger.error('Error stack:', { context: [error instanceof Error ? error.stack : 'No stack trace'] });
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
