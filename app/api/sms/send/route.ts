import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { SMSService } from '@/lib/services/sms/smsServiceTelnyx';

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

    // Send SMS messages
    const result = await SMSService.sendBulkSMS(phoneNumbers, message);

    // Log the SMS sending activity
    try {
      await supabase.from('sms_logs').insert({
        chapter_id: chapterId,
        sent_by: user.id,
        message: message,
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
