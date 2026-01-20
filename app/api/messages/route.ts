import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EmailService } from '@/lib/services/emailService';
import { canSendEmailNotification } from '@/lib/utils/checkEmailPreferences';

// Configure function timeout for Vercel (60 seconds for Pro plan)
export const maxDuration = 60;

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
      .order('created_at', { ascending: true }) // Changed from false to true
      .range((page - 1) * limit, page * limit - 1);

    if (before) {
      query = query.gt('created_at', before); // Changed from lt to gt (greater than, not less than)
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Message fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({ 
      messages: messages || [],
      page,
      limit,
      hasMore: messages && messages.length === limit
    });
  } catch (error) {
    console.error('API error:', error);
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

    console.log('Verifying connection:', {
      connectionId,
      userId: user.id,
      hasToken: !!token
    });

    // Verify connection exists and user is part of it
    // First, fetch the connection by ID
    const { data: connection, error: connectionError } = await supabase
      .from('connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (connectionError) {
      console.error('Connection fetch error details:', {
        error: connectionError,
        connectionId,
        userId: user.id,
        errorCode: connectionError.code,
        errorMessage: connectionError.message
      });
      return NextResponse.json({ 
        error: 'Connection not found',
        details: connectionError.message 
      }, { status: 400 });
    }

    if (!connection) {
      console.error('Connection not found:', {
        connectionId,
        userId: user.id
      });
      return NextResponse.json({ error: 'Connection not found' }, { status: 400 });
    }

    console.log('Connection found:', {
      connectionId: connection.id,
      status: connection.status,
      requesterId: connection.requester_id,
      recipientId: connection.recipient_id,
      userId: user.id
    });

    // Then verify the connection is accepted and user is part of it
    if (connection.status !== 'accepted') {
      console.error('Connection not accepted:', {
        connectionId: connection.id,
        status: connection.status
      });
      return NextResponse.json({ 
        error: 'Connection is not accepted',
        status: connection.status 
      }, { status: 400 });
    }

    if (connection.requester_id !== user.id && connection.recipient_id !== user.id) {
      console.error('User not part of connection:', {
        connectionId: connection.id,
        requesterId: connection.requester_id,
        recipientId: connection.recipient_id,
        userId: user.id
      });
      return NextResponse.json({ 
        error: 'User is not part of this connection' 
      }, { status: 403 });
    }

    // ✅ FIXED: Use the actual authenticated user's ID as sender_id
    const senderId = user.id;

    // ✅ NEW: Validate profile message type and profile existence
    if (messageType === 'profile') {
      const profileId = metadata?.shared_profile_id;
      const profileType = metadata?.shared_profile_type;

      if (!profileId) {
        return NextResponse.json({ 
          error: 'Profile ID required for profile message type' 
        }, { status: 400 });
      }

      if (!profileType || !['member', 'alumni'].includes(profileType)) {
        return NextResponse.json({ 
          error: 'Valid profile type (member or alumni) required' 
        }, { status: 400 });
      }

      // Validate profile exists in database
      let profileExists = false;
      let profileData = null;

      if (profileType === 'alumni') {
        // Check alumni table
        const { data: alumniData, error: alumniError } = await supabase
          .from('alumni')
          .select('user_id, first_name, last_name, full_name, avatar_url')
          .eq('user_id', profileId)
          .single();

        if (!alumniError && alumniData) {
          profileExists = true;
          profileData = {
            id: alumniData.user_id,
            name: alumniData.full_name || `${alumniData.first_name || ''} ${alumniData.last_name || ''}`.trim(),
            avatar: alumniData.avatar_url || null,
            type: 'alumni' as const
          };
        }
      } else {
        // Check profiles table for member
        const { data: profileRecord, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, first_name, last_name, avatar_url')
          .eq('id', profileId)
          .single();

        if (!profileError && profileRecord) {
          profileExists = true;
          profileData = {
            id: profileRecord.id,
            name: profileRecord.full_name || `${profileRecord.first_name || ''} ${profileRecord.last_name || ''}`.trim(),
            avatar: profileRecord.avatar_url || null,
            type: 'member' as const
          };
        }
      }

      if (!profileExists) {
        return NextResponse.json({ 
          error: 'Profile not found in database' 
        }, { status: 404 });
      }

      // Build validated metadata object
      metadata.shared_profile_id = profileData.id;
      metadata.shared_profile_name = profileData.name;
      if (profileData.avatar) {
        metadata.shared_profile_avatar = profileData.avatar;
      }
      metadata.shared_profile_type = profileData.type;
    }

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
      console.error('Message creation error:', error);
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
        console.error('❌ Error fetching recipient profile:', recipientError);
      } else {
        // Send email notification (respect user preferences)
        if (recipientProfile.email && recipientProfile.first_name && message.sender?.first_name) {
          const allowed = await canSendEmailNotification(recipientProfile.id as string, 'message');
          console.log('Email preference check (message):', {
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
              console.error('Failed to send message notification email:', emailError);
            });
          }
        }

        // Send SMS notification (parallel to email, don't block if SMS fails)
        try {
          console.log('📱 Starting SMS notification process for message:', {
            messageId: message.id,
            connectionId: connectionId,
            senderId: senderId,
            recipientId: recipientId
          });

          // CRITICAL: Must have sms_consent = true to send SMS
          if (!recipientProfile.phone || recipientProfile.sms_consent !== true) {
            console.log('ℹ️ Recipient not eligible for SMS notification:', {
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
              console.log('⚠️ Invalid phone number format:', {
                recipientId,
                phone: recipientProfile.phone,
                formatted: formattedPhone
              });
            } else {
              // Prepare message preview
              const messagePreview = content.length > 50 ? content.substring(0, 50) + '...' : content;
              const senderName = message.sender?.first_name || message.sender?.full_name || 'Someone';

              console.log('🚀 Preparing to send message SMS:', {
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
                  console.log('✅ Message SMS notification result:', {
                    messageId: message.id,
                    recipientId,
                    success,
                    phoneNumber: formattedPhone
                  });
                })
                .catch(error => {
                  console.error('❌ Message SMS notification failed:', {
                    messageId: message.id,
                    recipientId,
                    error: error.message,
                    stack: error.stack
                  });
                });
            }
          }
        } catch (smsError) {
          console.error('❌ Error in SMS notification process for message:', {
            messageId: message.id,
            error: smsError instanceof Error ? smsError.message : 'Unknown error',
            stack: smsError instanceof Error ? smsError.stack : undefined
          });
        }
      }
    } catch (notificationError) {
      console.error('❌ Error in notification process:', notificationError);
      // Don't fail message creation if notifications fail
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}