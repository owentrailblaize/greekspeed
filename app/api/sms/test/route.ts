import { NextResponse } from 'next/server';
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
