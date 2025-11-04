import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { SMSService } from '@/lib/services/sms/smsServiceTelnyx';
import { canSendEmailNotification } from '@/lib/utils/checkEmailPreferences';

// Configure function timeout for Vercel (60 seconds for Pro plan)
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!chapterId) {
      return NextResponse.json({ error: 'Chapter ID required' }, { status: 400 });
    }

    // Get authenticated user to check read status
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Fetch announcements with sender information and read status for current user
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select(`
        *,
        sender:profiles!sender_id(
          id,
          full_name,
          first_name,
          last_name,
          avatar_url
        ),
        recipients:announcement_recipients!inner(
          is_read,
          read_at
        )
      `)
      .eq('chapter_id', chapterId)
      .eq('recipients.recipient_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Announcements fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
    }

    // Transform the data to include read status
    const transformedAnnouncements = announcements?.map(announcement => ({
      ...announcement,
      is_read: announcement.recipients?.[0]?.is_read || false,
      read_at: announcement.recipients?.[0]?.read_at || null
    })) || [];

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('chapter_id', chapterId);

    return NextResponse.json({
      announcements: transformedAnnouncements,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json();
    const { title, content, announcement_type, is_scheduled, scheduled_at, send_sms, metadata } = body;

    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Get user profile to verify chapter and role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('chapter_id, chapter_role, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.chapter_id) {
      return NextResponse.json({ error: 'User not associated with a chapter' }, { status: 400 });
    }

    // Check if user has permission to create announcements
    const allowedChapterRoles = ['president', 'vice_president', 'secretary', 'treasurer', 'executive_board'];
    const isSystemAdmin = profile.role === 'admin';
    const hasChapterRole = profile.chapter_role && allowedChapterRoles.includes(profile.chapter_role);

    if (!isSystemAdmin && !hasChapterRole) {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Only admins, presidents, vice presidents, secretaries, treasurers, and executive board members can create announcements.' 
      }, { status: 403 });
    }

    // Create announcement
    const { data: announcement, error: createError } = await supabase
      .from('announcements')
      .insert({
        chapter_id: profile.chapter_id,
        sender_id: user.id,
        title,
        content,
        announcement_type,
        is_scheduled: is_scheduled || false,
        scheduled_at: scheduled_at || null,
        metadata: metadata || {},
        is_sent: !is_scheduled, // If not scheduled, mark as sent
        sent_at: !is_scheduled ? new Date().toISOString() : null
      })
      .select(`
        *,
        sender:profiles!sender_id(
          id,
          full_name,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .single();

    if (createError) {
      console.error('Announcement creation error:', createError);
      return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
    }

    // If announcement is not scheduled, create recipient records and send notifications
    if (!is_scheduled) {
      await createRecipientRecords(announcement.id, profile.chapter_id, supabase);
      
      // Send email notifications directly
      try {
        // Starting email notification process
        
        // Get chapter name first
        const { data: chapter, error: chapterError } = await supabase
          .from('chapters')
          .select('name')
          .eq('id', profile.chapter_id)
          .single();

        const chapterName = chapter?.name || 'Your Chapter';
        
        // Get chapter members for email - FIXED QUERY
        const { data: members, error: membersError } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            first_name,
            last_name,
            chapter_id,
            role
          `)
          .eq('chapter_id', profile.chapter_id)
          .in('role', ['active_member', 'admin'])
          .not('email', 'is', null);

        if (membersError) {
          console.error('❌ Failed to fetch chapter members:', membersError);
        } else if (!members || members.length === 0) {
          // No chapter members found for email notifications
        } else {
          // Chapter members found
          
          // Filter by email preferences (email_enabled AND announcement_notifications)
          const allowedMembers = await Promise.all(
            members.map(async (member) => {
              try {
                const allowed = await canSendEmailNotification(member.id, 'announcement');
                return allowed ? member : null;
              } catch {
                // On error, default to not sending to be safe
                return null;
              }
            })
          );

          const recipients = allowedMembers
            .filter((m): m is NonNullable<typeof m> => Boolean(m))
            .map(member => ({
              email: member.email,
              firstName: member.first_name || 'Member',
              chapterName: chapterName
            }));

          if (recipients.length > 0) {
            const { EmailService } = await import('@/lib/services/emailService');
            
            const result = await EmailService.sendAnnouncementToChapter(
              recipients,
              {
                title: announcement.title,
                summary: '',
                content: announcement.content,
                announcementId: announcement.id,
                announcementType: announcement.announcement_type
              }
            );

            // Email sending result received
          }
        }
      } catch (emailError) {
        console.error('❌ Error sending announcement emails:', emailError);
        // Don't fail the announcement creation if email fails
      }

      // Send SMS notifications only if send_sms is true (parallel to email, don't block if SMS fails)
      if (send_sms === true) {
        try {
          // Get chapter members with phone numbers and SMS consent
          const { data: smsMembers, error: smsMembersError } = await supabase
            .from('profiles')
            .select(`
              id,
              phone,
              first_name,
              chapter_id,
              role
            `)
            .eq('chapter_id', profile.chapter_id)
            .in('role', ['active_member', 'admin'])
            .not('phone', 'is', null)
            .neq('phone', '')
            .eq('sms_consent', true);

          if (!smsMembersError && smsMembers && smsMembers.length > 0) {
            // Format and validate phone numbers
            const validSMSMembers = smsMembers
              .map(member => ({
                ...member,
                formattedPhone: SMSService.formatPhoneNumber(member.phone!),
              }))
              .filter(member => SMSService.isValidPhoneNumber(member.phone!));

            if (validSMSMembers.length > 0) {
              // Get Chapter Name for Personalization
              const { data: chapter } = await supabase
                .from('chapters')
                .select('name')
                .eq('id', profile.chapter_id)
                .single();
              
              // Format message to match your Telnyx approved sample messages exactly
              // CRITICAL: Must match case and format from your Telnyx campaign samples
              const senderPrefix = '[Trailblaize]'; // Match your sample messages (capitalized, not all caps)
              const optOutText = ' Reply STOP to unsubscribe or HELP for help.';
              const complianceText = ' Msg & data rates may apply. Message frequency varies.';
              const contactText = ' Contact support@trailblaize.net';

              // Calculate available space (160-char SMS limit)
              const fixedTextLength = 
                senderPrefix.length + 1 + // +1 for space after prefix
                ': '.length + // Space after title colon
                optOutText.length + 
                complianceText.length + 
                contactText.length;
              
              // Account for title length and ellipsis (3 chars)
              const titlePrefix = `${senderPrefix} ${announcement.title}: `;
              const availableForContent = 160 - fixedTextLength - titlePrefix.length;
              
              // Truncate content if needed
              const truncatedContent = announcement.content.substring(0, Math.max(0, availableForContent - 3));
              const needsEllipsis = announcement.content.length > truncatedContent.length;

              // Build compliant message matching your Telnyx samples exactly
              const smsMessage = `${titlePrefix}${truncatedContent}${needsEllipsis ? '...' : ''}${optOutText}${complianceText}${contactText}`.substring(0, 160);

              // Create SMS message (truncate if needed - SMS has 160 char limit per message)

              // Get phone numbers
              const phoneNumbers = validSMSMembers.map(member => member.formattedPhone);

              // Determine if we should use test mode (same logic as email)
              const isSandbox = SMSService.isInSandboxMode();
              const recipientsToUse = isSandbox ? phoneNumbers.slice(0, 3) : phoneNumbers;

              // Send SMS via dedicated processing route (async but tracked)
              if (recipientsToUse.length > 0) {
                console.log('🚀 Initiating SMS processing for announcement:', {
                  announcementId: announcement.id,
                  recipientsCount: recipientsToUse.length,
                  messagePreview: smsMessage.substring(0, 50) + '...',
                  timestamp: new Date().toISOString(),
                });

                // Await the SMS call to ensure it completes before function returns
                try {
                  const result = await SMSService.sendBulkSMS(recipientsToUse, smsMessage);
                  
                  console.log('✅ Announcement SMS sent:', {
                    total: recipientsToUse.length,
                    success: result.success,
                    failed: result.failed,
                    announcementId: announcement.id
                  });

                  // Log to database
                  try {
                    const supabase = createServerSupabaseClient();
                    await supabase.from('sms_logs').insert({
                      chapter_id: profile.chapter_id,
                      sent_by: user.id,
                      message: smsMessage,
                      recipients_count: recipientsToUse.length,
                      success_count: result.success,
                      failed_count: result.failed,
                      test_mode: false,
                    });
                  } catch (logError) {
                    console.error('Failed to log SMS to database:', logError);
                  }
                } catch (error) {
                  console.error('❌ Announcement SMS failed:', {
                    error: error instanceof Error ? error.message : String(error),
                    announcementId: announcement.id,
                    stack: error instanceof Error ? error.stack : undefined
                  });
                  // Don't throw - SMS failure shouldn't block announcement creation
                }
              }
            }
          }
        } catch (smsError) {
          console.error('❌ Error sending announcement SMS:', smsError);
          // Don't fail the announcement creation if SMS fails
        }
      }
    }

    return NextResponse.json({ announcement });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function createRecipientRecords(announcementId: string, chapterId: string, supabase: any) {
  try {
    // Get all active members of the chapter
    const { data: members, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('chapter_id', chapterId)
      .eq('role', 'active_member');

    if (error || !members) {
      console.error('Failed to fetch chapter members:', error);
      return;
    }

    // Create recipient records for all members
    const recipientRecords = members.map((member: { id: string }) => ({
        announcement_id: announcementId,
        recipient_id: member.id
    }));

    const { error: insertError } = await supabase
      .from('announcement_recipients')
      .insert(recipientRecords);

    if (insertError) {
      console.error('Failed to create recipient records:', insertError);
    }
  } catch (error) {
    console.error('Error creating recipient records:', error);
  }
}
