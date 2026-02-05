import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const TELNYX_WEBHOOK_SECRET = process.env.TELNYX_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('telnyx-signature');
    const timestamp = request.headers.get('telnyx-timestamp');

    // Telnyx sends different payload structures:
    // 1. Event webhooks: { data: { event_type: '...', payload: {...} } }
    // 2. Direct message payloads: { record_type: 'message', id: '...', ... }
    
    let eventType: string | null = null;
    let payload: any = null;

    if (body.data?.event_type) {
      // Structured webhook event
      eventType = body.data.event_type;
      payload = body.data.payload || body.data;
    } else if (body.record_type === 'message') {
      // Direct message payload (from message.sent events)
      eventType = 'message.sent';
      payload = body;
    } else {
      // Fallback
      eventType = body.event_type || 'unknown';
      payload = body.payload || body;
    }

    console.log('📨 Telnyx Webhook Received:', {
      eventType,
      messageId: payload.id,
      timestamp: timestamp,
      from: payload.from?.phone_number,
      to: payload.to?.[0]?.phone_number,
      status: payload.to?.[0]?.status,
      direction: payload.direction,
      // CRITICAL: Check for errors
      errors: payload.errors || [],
      errorCodes: payload.errors?.map((e: any) => e.code) || [],
      errorMessages: payload.errors?.map((e: any) => e.title || e.detail) || [],
      // Check delivery status details
      deliveryStatus: payload.to?.[0]?.status,
      deliveryError: payload.to?.[0]?.error_message,
      carrier: payload.to?.[0]?.carrier,
      // Full payload for debugging (first 1000 chars)
      fullPayload: JSON.stringify(body).substring(0, 1000),
    });

    // Check if there are delivery errors
    if (payload.errors && payload.errors.length > 0) {
        console.error('❌ SMS DELIVERY ERRORS DETECTED:', {
          messageId: payload.id,
          errors: payload.errors.map((e: any) => ({
            code: e.code,
            title: e.title,
            detail: e.detail,
            meta: e.meta,
          })),
        });
      }

    // Check individual recipient status
    if (payload.to && payload.to.length > 0) {
        payload.to.forEach((recipient: any, idx: number) => {
            if (recipient.status !== 'delivered' && recipient.status !== 'sent') {
            console.warn(`⚠️ Recipient ${idx + 1} Delivery Issue:`, {
                phone: recipient.phone_number,
                status: recipient.status,
                error: recipient.error_message || recipient.error,
                carrier: recipient.carrier,
            });
            }
        });
    }

    // Initialize Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials for webhook handler');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (eventType) {
      case 'message.finalized':
      case 'message.sent':
      case 'message.delivered':
      case 'message.delivery.failed':
        await handleMessageStatusUpdate(supabase, payload, eventType);
        break;
      
      case 'message.received':
        await handleInboundMessage(supabase, payload);
        break;
      
      default:
        console.log(`ℹ️ Unhandled webhook event type: ${eventType}`);
    }

    // Return 200 immediately to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    // Still return 200 to prevent Telnyx from retrying
    // Log errors internally instead
    return NextResponse.json(
      { error: 'Webhook processing failed', received: false },
      { status: 200 }
    );
  }
}

async function handleMessageStatusUpdate(
  supabase: any,
  payload: any,
  eventType: string
) {
  try {
    const messageId = payload.id;
    const errorMessage = payload.errors?.[0]?.detail || null;

    console.log('📊 Updating message status:', {
      messageId,
      eventType,
      to: payload.to?.[0]?.phone_number,
      from: payload.from?.phone_number,
      messageStatus: payload.to?.[0]?.status,
      hasErrors: !!(payload.errors && payload.errors.length > 0)
    });

    // First, check if the record exists in sms_notification_logs
    const { data: existingLog, error: fetchError } = await supabase
      .from('sms_notification_logs')
      .select('id, status, telnyx_id')
      .eq('telnyx_id', messageId)
      .single();

    if (fetchError || !existingLog) {
      console.log('ℹ️ SMS notification log not found for update:', {
        messageId,
        reason: fetchError?.message || 'No matching record',
        hint: 'This might be a bulk SMS or log was not created during send'
      });
      return; // Exit gracefully if log doesn't exist
    }

    // Map Telnyx delivery status to our status values
    let updateStatus = 'sent'; // default
    
    // Check for delivery errors first (highest priority)
    if (payload.errors && payload.errors.length > 0) {
      updateStatus = 'failed';
    } 
    // Check individual recipient status
    else if (payload.to && payload.to.length > 0) {
      const recipientStatus = payload.to[0].status;
      
      if (recipientStatus === 'delivered') {
        updateStatus = 'delivered';
      } else if (recipientStatus === 'delivery_failed' || recipientStatus === 'failed') {
        updateStatus = 'failed';
      } else if (recipientStatus === 'sent' || recipientStatus === 'queued') {
        updateStatus = 'sent';
      } else if (eventType === 'message.finalized') {
        // message.finalized can have different statuses
        if (payload.errors && payload.errors.length > 0) {
          updateStatus = 'failed';
        } else {
          // Keep current status or default to sent
          updateStatus = existingLog.status || 'sent';
        }
      }
    }

    // Build update data - only include fields that exist in sms_notification_logs
    const updateData: any = {
      status: updateStatus,
    };

    // Update error field if there's an error message
    if (errorMessage) {
      updateData.error = errorMessage;
    }

    // Update SMS notification log
    const { error } = await supabase
      .from('sms_notification_logs')
      .update(updateData)
      .eq('telnyx_id', messageId);

    if (error) {
      console.error('Failed to update SMS notification log:', {
        error,
        messageId,
        attemptedUpdate: updateData,
        existingRecord: existingLog
      });
    } else {
      console.log('✅ SMS notification log updated successfully:', {
        messageId,
        oldStatus: existingLog.status,
        newStatus: updateStatus,
        to: payload.to?.[0]?.phone_number
      });
    }

    // Log error details to console if present
    if (errorMessage) {
      console.warn('⚠️ SMS delivery error:', {
        messageId,
        error: errorMessage,
        status: updateStatus,
        to: payload.to?.[0]?.phone_number,
        carrier: payload.to?.[0]?.carrier
      });
    }
  } catch (error) {
    console.error('Error handling message status update:', {
      error,
      messageId: payload?.id,
      eventType
    });
  }
}

async function handleInboundMessage(supabase: any, payload: any) {
  try {
    console.log('📩 Inbound message received:', {
      from: payload.from?.phone_number,
      to: payload.to?.[0]?.phone_number,
      text: payload.text,
    });

    // TODO: Implement inbound message handling
  } catch (error) {
    console.error('Error handling inbound message:', error);
  }
}

function mapEventTypeToStatus(eventType: string): string {
  switch (eventType) {
    case 'message.sent':
      return 'sent';
    case 'message.delivered':
      return 'delivered';
    case 'message.delivery.failed':
      return 'failed';
    case 'message.finalized':
      return 'finalized';
    default:
      return 'unknown';
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Telnyx webhook endpoint',
    status: 'active'
  });
}