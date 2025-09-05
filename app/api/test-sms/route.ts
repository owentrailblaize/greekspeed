import { NextRequest, NextResponse } from 'next/server';
import { SMSService } from '@/lib/services/smsService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, message } = body;

    if (!to || !message) {
      return NextResponse.json({ error: 'Missing required fields: to, message' }, { status: 400 });
    }

    // Test SMS sending
    const result = await SMSService.sendSMS({
      to: SMSService.formatPhoneNumber(to),
      body: message
    });

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      formattedNumber: SMSService.formatPhoneNumber(to)
    });
  } catch (error) {
    console.error('Test SMS error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'SMS Test Endpoint',
    usage: 'POST with { "to": "phone_number", "message": "test message" }',
    environment: {
      hasTwilioAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasTwilioAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasTwilioPhoneNumber: !!process.env.TWILIO_PHONE_NUMBER,
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER
    }
  });
}
