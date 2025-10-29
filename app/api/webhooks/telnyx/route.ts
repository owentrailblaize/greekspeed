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
    const status = mapEventTypeToStatus(eventType);
    const deliveredAt = eventType === 'message.delivered' ? new Date().toISOString() : null;
    const failedAt = eventType === 'message.delivery.failed' ? new Date().toISOString() : null;
    const errorMessage = payload.errors?.[0]?.detail || null;

    console.log('📊 Updating message status:', {
      messageId,
      status,
      eventType,
      to: payload.to?.[0]?.phone_number,
      from: payload.from?.phone_number,
      messageStatus: payload.to?.[0]?.status,
    });

    // Update SMS log if exists
    const { error } = await supabase
      .from('sms_logs')
      .update({
        status: status,
        delivered_at: deliveredAt,
        failed_at: failedAt,
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('telnyx_id', messageId);

    if (error) {
      console.error('Failed to update SMS log:', error);
    } else {
      console.log('✅ SMS log updated successfully');
    }
  } catch (error) {
    console.error('Error handling message status update:', error);
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