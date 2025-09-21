import { NextRequest, NextResponse } from 'next/server';
import { SMSService } from '@/lib/services/smsService';

export async function GET() {
  try {
    // Test Twilio connection and configuration
    const isSandbox = SMSService.isInSandboxMode();
    
    // Test phone number formatting
    const testNumbers = ['5551234567', '+15551234567', '15551234567'];
    const formattedNumbers = testNumbers.map(num => SMSService.formatPhoneNumber(num));
    
    // Test validation
    const validationResults = testNumbers.map(num => SMSService.isValidPhoneNumber(num));
    
    return NextResponse.json({
      success: true,
      message: 'SMS service is properly configured',
      config: {
        sandboxMode: isSandbox,
        twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ? 'Configured' : 'Missing',
        twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ? 'Configured' : 'Missing',
        twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ? 'Configured' : 'Missing',
      },
      tests: {
        phoneNumberFormatting: {
          input: testNumbers,
          output: formattedNumbers,
        },
        phoneNumberValidation: {
          input: testNumbers,
          output: validationResults,
        },
      },
    });
  } catch (error) {
    console.error('SMS test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'SMS service configuration error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Add POST method for manual testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, message } = body;

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Format the phone number
    const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);
    
    // Validate the phone number
    if (!SMSService.isValidPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Send the test SMS
    const result = await SMSService.sendSMS({
      to: formattedPhone,
      body: message,
    });

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'SMS sent successfully' : 'Failed to send SMS',
      details: {
        phoneNumber: formattedPhone,
        messageId: result.messageId,
        error: result.error,
        sandboxMode: SMSService.isInSandboxMode(),
      },
    });

  } catch (error) {
    console.error('Manual SMS test error:', error);
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
