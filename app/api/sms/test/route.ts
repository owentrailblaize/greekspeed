import { NextRequest, NextResponse } from 'next/server';
import { SMSService } from '@/lib/services/sms/smsServiceTelnyx';
import { logger } from "@/lib/utils/logger";

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json();
    
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Hardcoded test message
    const testMessage = "🧪 Test SMS from GreekSpeed! If you received this, your Telnyx integration is working! 🎉";
    
    const result = await SMSService.sendSMS({
      to: phoneNumber,
      body: testMessage,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test SMS sent successfully!',
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: result.error || 'Failed to send SMS'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Test SMS error:', { context: [error] });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}