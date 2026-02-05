import { NextRequest, NextResponse } from 'next/server';
import { SMSService } from '@/lib/services/sms/smsServiceTelnyx';
import { createClient } from '@supabase/supabase-js';

// Configure function timeout for Vercel (60 seconds for Pro plan)
export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      recipients, 
      message, 
      announcementId, 
      chapterId,
      sentBy 
    } = body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'Recipients required' }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    console.log('📤 SMS Processing Job Started:', {
      timestamp: new Date().toISOString(),
      recipientsCount: recipients.length,
      messageLength: message.length,
      announcementId,
      chapterId,
    });

    // Process SMS sending with retry logic (handled internally by SMSService)
    const result = await SMSService.sendBulkSMS(recipients, message);

    // Log results to database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (announcementId && chapterId) {
      try {
        await supabase.from('sms_logs').insert({
          chapter_id: chapterId,
          sent_by: sentBy || null,
          message: message,
          recipients_count: recipients.length,
          success_count: result.success,
          failed_count: result.failed,
          test_mode: false,
        });
      } catch (logError) {
        console.error('Failed to log SMS to database:', logError);
        // Don't fail the request if logging fails
      }
    }

    console.log('✅ SMS Processing Job Completed:', {
      timestamp: new Date().toISOString(),
      total: recipients.length,
      success: result.success,
      failed: result.failed,
      announcementId,
    });

    return NextResponse.json({
      success: true,
      stats: {
        total: recipients.length,
        success: result.success,
        failed: result.failed,
      },
    });

  } catch (error) {
    console.error('❌ SMS Processing Job Failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { 
        error: 'SMS processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
