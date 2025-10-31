import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EmailService } from '@/lib/services/emailService';
import { canSendEmailNotification } from '@/lib/utils/checkEmailPreferences';
import { logger } from "@/lib/utils/logger";

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

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get all connections for the user with profile information
    const { data: connections, error } = await supabase
      .from('connections')
      .select(`
        *,
        requester:profiles!requester_id(
          id,
          full_name,
          first_name,
          last_name,
          chapter,
          avatar_url,
          email
        ),
        recipient:profiles!recipient_id(
          id,
          full_name,
          first_name,
          last_name,
          chapter,
          avatar_url,
          email
        )
      `)
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

    if (error) {
      logger.error('Connection fetch error:', { context: [error] });
      return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
    }

    return NextResponse.json({ connections: connections || [] });
  } catch (error) {
    logger.error('API error:', { context: [error] });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    const { requesterId, recipientId, message } = body;

    if (!requesterId || !recipientId) {
      return NextResponse.json({ error: 'Requester and recipient IDs required' }, { status: 400 });
    }

    // Check if connection already exists
    const { data: existingConnection } = await supabase
      .from('connections')
      .select('*')
      .or(`and(requester_id.eq.${requesterId},recipient_id.eq.${recipientId}),and(requester_id.eq.${recipientId},recipient_id.eq.${requesterId})`)
      .single();

    if (existingConnection) {
      return NextResponse.json({ 
        error: 'Connection already exists',
        connection: existingConnection 
      }, { status: 409 });
    }

    // Get recipient profile information for email and SMS notifications (optimized single query)
    const { data: recipientProfile, error: recipientError } = await supabase
      .from('profiles')
      .select('id, first_name, email, chapter, phone, chapter_id, sms_consent')
      .eq('id', recipientId)
      .single();

    if (recipientError) {
      logger.error('Error fetching recipient profile:', { context: [recipientError] });
    }

    // Get requester profile information for email notification
    const { data: requesterProfile, error: requesterError } = await supabase
      .from('profiles')
      .select('first_name, chapter_id')
      .eq('id', requesterId)
      .single();

    if (requesterError) {
      logger.error('Error fetching requester profile:', { context: [requesterError] });
    }

    // Create new connection request
    const { data: connection, error } = await supabase
      .from('connections')
      .insert({
        requester_id: requesterId,
        recipient_id: recipientId,
        status: 'pending',
        message: message || null
      })
      .select()
      .single();

    if (error) {
      logger.error('Connection creation error:', { context: [error] });
      return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 });
    }

    // Send email and SMS notifications (parallel, don't block if notifications fail)
    try {
      // Send email notification if allowed by preferences
      if (recipientProfile?.email && recipientProfile?.first_name && requesterProfile?.first_name) {
        const allowed = await canSendEmailNotification(recipientProfile.id as string, 'connection');
        logger.info('Email preference check (connection request):', {
                    recipientId: recipientProfile.id,
                    allowed,
                  });
        if (allowed) {
          EmailService.sendConnectionRequestNotification({
            to: recipientProfile.email,
            firstName: recipientProfile.first_name,
            chapterName: recipientProfile.chapter || 'Your Chapter',
            actorFirstName: requesterProfile.first_name,
            message: message,
            connectionId: connection.id
          }).catch(emailError => {
            logger.error('Failed to send connection request email:', { context: [emailError] });
          });
        }
      }

      // Send SMS notification (parallel to email, don't block if SMS fails)
      logger.info('📱 Starting SMS notification process for connection request:', {
                connectionId: connection.id,
                requesterId: requesterId,
                recipientId: recipientId
              });

      if (!recipientProfile?.phone || !recipientProfile.sms_consent) {
        logger.info('ℹ️ Recipient not eligible for SMS notification:', {
                    recipientId,
                    hasPhone: !!recipientProfile?.phone,
                    hasConsent: recipientProfile?.sms_consent
                  });
      } else {
        // Format and validate phone number
        const { SMSService } = await import('@/lib/services/sms/smsServiceTelnyx');
        const formattedPhone = SMSService.formatPhoneNumber(recipientProfile.phone);
        
        if (!SMSService.isValidPhoneNumber(recipientProfile.phone)) {
          logger.info('⚠️ Invalid phone number format:', {
                        recipientId,
                        phone: recipientProfile.phone,
                        formatted: formattedPhone
                      });
        } else {
          const requesterName = requesterProfile?.first_name || 'Someone';

          logger.info('🚀 Preparing to send connection request SMS:', {
                        recipientId,
                        recipientName: recipientProfile.first_name,
                        phone: formattedPhone,
                        requesterName
                      });

          // Import SMSNotificationService
          const { SMSNotificationService } = await import('@/lib/services/sms/smsNotificationService');

          // Send SMS notification (don't await - fire and forget)
          SMSNotificationService.sendConnectionRequestNotification(
            formattedPhone,
            recipientProfile.first_name || 'Member',
            requesterName,
            recipientProfile.id,
            recipientProfile.chapter_id || ''
          )
            .then(success => {
              logger.info('✅ Connection request SMS notification result:', {
                                connectionId: connection.id,
                                recipientId,
                                success,
                                phoneNumber: formattedPhone
                              });
            })
            .catch(error => {
              logger.error('❌ Connection request SMS notification failed:', {
                                connectionId: connection.id,
                                recipientId,
                                error: error.message,
                                stack: error.stack
                              });
            });
        }
      }
    } catch (notificationError) {
      logger.error('❌ Error in notification process:', { context: [notificationError] });
      // Don't fail the connection creation if notifications fail
    }

    return NextResponse.json({ connection });
  } catch (error) {
    logger.error('API error:', { context: [error] });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 