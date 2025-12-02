import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { SMSService } from '@/lib/services/sms/smsServiceTelnyx';
import { toGsmSafe } from '@/lib/utils/smsUtils';

// Configure function timeout for Vercel (60 seconds for Pro plan)
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // SMS Send API called
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createServerSupabaseClient();
    
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No auth header
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      // Authentication failed
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // User authenticated successfully

    const body = await request.json();
    const { chapterId, message, testMode = false } = body;


    if (!chapterId || !message) {
      return NextResponse.json(
        { error: 'Chapter ID and message are required' },
        { status: 400 }
      );
    }

    // Get user's profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('chapter_id, chapter_role, role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }


    if (!profile || profile.chapter_id !== chapterId) {
      // Chapter mismatch
      return NextResponse.json({ error: 'Access denied - chapter mismatch' }, { status: 403 });
    }

    // Check if user has permission to send announcements
    const canSendAnnouncements = 
      profile.role === 'admin' || 
      ['president', 'vice_president', 'secretary'].includes(profile.chapter_role || '');


    if (!canSendAnnouncements) {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Only admins, presidents, vice presidents, and secretaries can send SMS.' 
      }, { status: 403 });
    }

    // Get all chapter members with phone numbers AND SMS consent
    const { data: members, error: membersError } = await supabase
      .from('profiles')
      .select('phone, full_name')
      .eq('chapter_id', chapterId)
      .not('phone', 'is', null)
      .neq('phone', '')
      .eq('sms_consent', true);  // ← ADD THIS LINE

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }


    if (!members || members.length === 0) {
      return NextResponse.json({ 
        error: 'No members with phone numbers found in this chapter' 
      }, { status: 400 });
    }

    // Format phone numbers and filter valid ones
    const validMembers = members
      .map(member => ({
        ...member,
        formattedPhone: SMSService.formatPhoneNumber(member.phone!),
      }))
      .filter(member => SMSService.isValidPhoneNumber(member.phone!));


    if (validMembers.length === 0) {
      return NextResponse.json({ 
        error: 'No valid phone numbers found' 
      }, { status: 400 });
    }

    // In sandbox mode or test mode, only send to first 3 members
    const isSandbox = SMSService.isInSandboxMode();
    const shouldUseTestMode = testMode || isSandbox;
    
    const recipientsToUse = shouldUseTestMode 
      ? validMembers.slice(0, 3)
      : validMembers;

    const phoneNumbers = recipientsToUse.map(member => member.formattedPhone);

    // Format message with compliance text (if not already included)
    const senderPrefix = '[Trailblaize]';
    const optOutText = ' Reply STOP to opt out.';
    const complianceText = ' Msg/data rates apply';
    
    // Check if message already has compliance text
    const hasCompliance = message.includes('Reply STOP') || message.includes('[Trailblaize]');
    
    let compliantMessage: string;
    if (hasCompliance) {
      // Message already has compliance text, use as-is (but ensure GSM-safe and under 160)
      compliantMessage = toGsmSafe(message).substring(0, 160);
    } else {
      // Add compliance text
      const safeMessage = toGsmSafe(message);
      const fixedLength = senderPrefix.length + 1 + optOutText.length + complianceText.length;
      const availableForContent = 160 - fixedLength - 3;
      const truncatedContent = safeMessage.substring(0, Math.max(0, availableForContent));
      const needsEllipsis = safeMessage.length > truncatedContent.length;
      
      compliantMessage = `${senderPrefix} ${truncatedContent}${needsEllipsis ? '...' : ''}${optOutText}${complianceText}`.substring(0, 160);
    }

    // Send SMS messages
    const result = await SMSService.sendBulkSMS(phoneNumbers, compliantMessage);

    // Log the SMS sending activity
    try {
      await supabase.from('sms_logs').insert({
        chapter_id: chapterId,
        sent_by: user.id,
        message: compliantMessage, // Log the formatted message
        recipients_count: phoneNumbers.length,
        success_count: result.success,
        failed_count: result.failed,
        test_mode: testMode,
      });
    } catch (logError) {
      console.error('Error logging SMS activity:', logError);
      // Don't fail the request if logging fails
    }

    const modeText = isSandbox ? ' (SANDBOX MODE - No actual SMS sent)' : '';

    return NextResponse.json({
      success: true,
      message: `SMS sent to ${result.success} recipients${shouldUseTestMode ? ' (test mode)' : ''}${modeText}`,
      stats: {
        total: phoneNumbers.length,
        success: result.success,
        failed: result.failed,
        testMode: shouldUseTestMode,
        sandboxMode: isSandbox,
      },
    });

  } catch (error) {
    console.error('SMS API error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
