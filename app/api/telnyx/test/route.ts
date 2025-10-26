import { NextRequest, NextResponse } from 'next/server';
import { SMSService } from '@/lib/services/smsServiceTelnyx';

export async function GET() {
  return NextResponse.json({
    message: 'Telnyx Test Endpoint',
    instructions: 'Use POST method to send test SMS',
    config: {
      hasApiKey: !!process.env.TELNYX_API_KEY,
      phoneNumber: process.env.TELNYX_PHONE_NUMBER || 'Not configured',
      sandboxMode: process.env.TELNYX_SANDBOX_MODE === 'true',
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, message } = body;

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Phone number (to) and message are required' },
        { status: 400 }
      );
    }

    // Format the phone number
    const formattedPhone = SMSService.formatPhoneNumber(to);
    
    // Validate
    if (!SMSService.isValidPhoneNumber(to)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Send SMS via Telnyx
    const result = await SMSService.sendSMS({
      to: formattedPhone,
      body: message,
    });

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'SMS sent successfully' : 'Failed to send SMS',
      details: {
        to: formattedPhone,
        messageId: result.messageId,
        error: result.error,
        sandboxMode: SMSService.isInSandboxMode(),
      },
    });

  } catch (error) {
    console.error('Telnyx test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send test SMS',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}