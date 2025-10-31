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
    const connectionId = searchParams.get('connectionId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before');

    if (!connectionId) {
      return NextResponse.json({ error: 'Connection ID required' }, { status: 400 });
    }

    // Build query with pagination
    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(
          id,
          full_name,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('connection_id', connectionId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error } = await query;

    if (error) {
      logger.error('Message fetch error:', { context: [error] });
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({ 
      messages: messages || [],
      page,
      limit,
      hasMore: messages && messages.length === limit
    });
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
    const { connectionId, content, messageType = 'text', metadata = {} } = body;

    if (!connectionId || !content) {
      return NextResponse.json({ error: 'Connection ID and content required' }, { status: 400 });
    }

    // 🔴 CRITICAL FIX: Get the authenticated user from the request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the JWT token and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Verify connection exists and user is part of it
    const { data: connection, error: connectionError } = await supabase
      .from('connections')
      .select('*')
      .eq('id', connectionId)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .single();

    if (connectionError || !connection) {
      return NextResponse.json({ error: 'Invalid or inactive connection' }, { status: 400 });
    }

    // ✅ FIXED: Use the actual authenticated user's ID as sender_id
    const senderId = user.id;

    // Create new message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        connection_id: connectionId,
        sender_id: senderId, // ✅ Now correctly set to the actual sender
        content,
        message_type: messageType,
        metadata
      })
      .select(`
        *,
        sender:profiles!sender_id(
          id,
          full_name,
          first_name,
          last_name,
          avatar_url,
          email,
          chapter
        )
      `)
      .single();

    if (error) {
      logger.error('Message creation error:', { context: [error] });
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }

    // Calculate recipient ID once (used for both email and SMS)
    const recipientId = connection.requester_id === senderId ? connection.recipient_id : connection.requester_id;

    // Send email and SMS notifications (parallel, don't block if notifications fail)
    try {
      // Fetch recipient profile with all fields needed for both email and SMS
      const { data: recipientProfile, error: recipientError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          email,
          phone,
          chapter,
          chapter_id,
          sms_consent
        `)
        .eq('id', recipientId)
        .single();

      if (recipientError || !recipientProfile) {
        logger.error('❌ Error fetching recipient profile:', { context: [recipientError] });
      } else {
        // Send email notification (respect user preferences)
        if (recipientProfile.email && recipientProfile.first_name && message.sender?.first_name) {
          const allowed = await canSendEmailNotification(recipientProfile.id as string, 'message');
          logger.info('Email preference check (message):', {
                        recipientId,
                        allowed,
                      });
          if (allowed) {
            EmailService.sendMessageNotification({
              to: recipientProfile.email,
              firstName: recipientProfile.first_name,
              chapterName: recipientProfile.chapter || 'Your Chapter',
              actorFirstName: message.sender.first_name,
              messagePreview: content.length > 100 ? content.substring(0, 100) + '...' : content,
              connectionId: connectionId
            }).catch(emailError => {
              logger.error('Failed to send message notification email:', { context: [emailError] });
            });
          }
        }

        // Send SMS notification (parallel to email, don't block if SMS fails)
        try {
          logger.info('📱 Starting SMS notification process for message:', {
                        messageId: message.id,
                        connectionId: connectionId,
                        senderId: senderId,
                        recipientId: recipientId
                      });

          // CRITICAL: Must have sms_consent = true to send SMS
          if (!recipientProfile.phone || recipientProfile.sms_consent !== true) {
            logger.info('ℹ️ Recipient not eligible for SMS notification:', {
                            recipientId,
                            hasPhone: !!recipientProfile?.phone,
                            smsConsent: recipientProfile?.sms_consent,
                            reason: recipientProfile?.sms_consent === false 
                              ? 'SMS consent is disabled' 
                              : 'Missing phone or consent'
                          });
          } else {
            // SMS consent verified - proceed with sending
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
              // Prepare message preview
              const messagePreview = content.length > 50 ? content.substring(0, 50) + '...' : content;
              const senderName = message.sender?.first_name || message.sender?.full_name || 'Someone';

              logger.info('🚀 Preparing to send message SMS:', {
                                recipientId,
                                recipientName: recipientProfile.first_name,
                                phone: formattedPhone,
                                senderName,
                                messagePreview: messagePreview.substring(0, 30) + '...'
                              });

              // Import SMSNotificationService
              const { SMSNotificationService } = await import('@/lib/services/sms/smsNotificationService');

              // Send SMS notification (don't await - fire and forget)
              SMSNotificationService.sendMessageNotification(
                formattedPhone,
                recipientProfile.first_name || 'Member',
                senderName,
                messagePreview,
                recipientProfile.id,
                recipientProfile.chapter_id || ''
              )
                .then(success => {
                  logger.info('✅ Message SMS notification result:', {
                                        messageId: message.id,
                                        recipientId,
                                        success,
                                        phoneNumber: formattedPhone
                                      });
                })
                .catch(error => {
                  logger.error('❌ Message SMS notification failed:', {
                                        messageId: message.id,
                                        recipientId,
                                        error: error.message,
                                        stack: error.stack
                                      });
                });
            }
          }
        } catch (smsError) {
          logger.error('❌ Error in SMS notification process for message:', {
                        messageId: message.id,
                        error: smsError instanceof Error ? smsError.message : 'Unknown error',
                        stack: smsError instanceof Error ? smsError.stack : undefined
                      });
        }
      }
    } catch (notificationError) {
      logger.error('❌ Error in notification process:', { context: [notificationError] });
      // Don't fail message creation if notifications fail
    }

    return NextResponse.json({ message });
  } catch (error) {
    logger.error('API error:', { context: [error] });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}