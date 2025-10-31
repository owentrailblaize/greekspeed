import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EmailService } from '@/lib/services/emailService';
import { canSendEmailNotification } from '@/lib/utils/checkEmailPreferences';
import { logger } from "@/lib/utils/logger";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    const { status } = body;

    if (!status || !['accepted', 'declined', 'blocked'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get the connection with profile information before updating
    const { data: existingConnection, error: fetchError } = await supabase
      .from('connections')
      .select(`
        *,
        requester:profiles!requester_id(
          id,
          first_name,
          email,
          chapter,
          phone,
          chapter_id,
          sms_consent
        ),
        recipient:profiles!recipient_id(
          id,
          first_name,
          email,
          chapter,
          phone,
          chapter_id,
          sms_consent
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      logger.error('Error fetching connection:', { context: [fetchError] });
      return NextResponse.json({ error: 'Failed to fetch connection' }, { status: 500 });
    }

    // Update the connection status
    const { data: connection, error } = await supabase
      .from('connections')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Connection update error:', { context: [error] });
      return NextResponse.json({ error: 'Failed to update connection' }, { status: 500 });
    }

    // Send email and SMS notifications for accepted connections
    if (status === 'accepted' && existingConnection) {
      try {
        // Send notification to the requester (the person who originally sent the request)
        const requesterProfile = existingConnection.requester;
        const recipientProfile = existingConnection.recipient;

        // Send email notification if allowed by preferences
        if (requesterProfile?.email && requesterProfile?.first_name && recipientProfile?.first_name) {
          const allowed = await canSendEmailNotification(requesterProfile.id as string, 'connection_accepted');
          logger.info('Email preference check (connection accepted):', {
                        requesterId: requesterProfile.id,
                        allowed,
                      });
          if (allowed) {
            EmailService.sendConnectionAcceptedNotification({
              to: requesterProfile.email,
              firstName: requesterProfile.first_name,
              chapterName: requesterProfile.chapter || 'Your Chapter',
              actorFirstName: recipientProfile.first_name,
              connectionId: id
            }).catch(emailError => {
              logger.error('Failed to send connection accepted email:', { context: [emailError] });
            });
          }
        }

        // Send SMS notification (parallel to email, don't block if SMS fails)
        logger.info('📱 Starting SMS notification process for connection accepted:', {
                    connectionId: id,
                    requesterId: requesterProfile?.id,
                    recipientId: recipientProfile?.id
                  });

        if (!requesterProfile?.phone || !requesterProfile.sms_consent) {
          logger.info('ℹ️ Requester not eligible for SMS notification:', {
                        requesterId: requesterProfile?.id,
                        hasPhone: !!requesterProfile?.phone,
                        hasConsent: requesterProfile?.sms_consent
                      });
        } else {
          // Format and validate phone number
          const { SMSService } = await import('@/lib/services/sms/smsServiceTelnyx');
          const formattedPhone = SMSService.formatPhoneNumber(requesterProfile.phone);
          
          if (!SMSService.isValidPhoneNumber(requesterProfile.phone)) {
            logger.info('⚠️ Invalid phone number format:', {
                            requesterId: requesterProfile.id,
                            phone: requesterProfile.phone,
                            formatted: formattedPhone
                          });
          } else {
            const accepterName = recipientProfile?.first_name || 'Someone';

            logger.info('🚀 Preparing to send connection accepted SMS:', {
                            requesterId: requesterProfile.id,
                            requesterName: requesterProfile.first_name,
                            phone: formattedPhone,
                            accepterName
                          });

            // Import SMSNotificationService
            const { SMSNotificationService } = await import('@/lib/services/sms/smsNotificationService');

            // Send SMS notification (don't await - fire and forget)
            SMSNotificationService.sendConnectionAcceptedNotification(
              formattedPhone,
              requesterProfile.first_name || 'Member',
              accepterName,
              requesterProfile.id,
              requesterProfile.chapter_id || ''
            )
              .then(success => {
                logger.info('✅ Connection accepted SMS notification result:', {
                                    connectionId: id,
                                    requesterId: requesterProfile.id,
                                    success,
                                    phoneNumber: formattedPhone
                                  });
              })
              .catch(error => {
                logger.error('❌ Connection accepted SMS notification failed:', {
                                    connectionId: id,
                                    requesterId: requesterProfile.id,
                                    error: error.message,
                                    stack: error.stack
                                  });
              });
          }
        }
      } catch (notificationError) {
        logger.error('❌ Error in connection accepted notification process:', {
                    connectionId: id,
                    error: notificationError instanceof Error ? notificationError.message : 'Unknown error',
                    stack: notificationError instanceof Error ? notificationError.stack : undefined
                  });
        // Don't fail the connection update if notifications fail
      }
    }

    return NextResponse.json({ connection });
  } catch (error) {
    logger.error('API error:', { context: [error] });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Connection deletion error:', { context: [error] });
      return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('API error:', { context: [error] });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 