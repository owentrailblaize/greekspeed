import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { NotificationService } from '@/lib/services/notificationService';
import { AnnouncementPostService } from '@/lib/services/announcementPostService';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    const { title, content, announcement_type, is_scheduled, scheduled_at, metadata, send_sms, create_as_pinned_post } = body;

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
      .select('chapter_id, chapter_role, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.chapter_id) {
      return NextResponse.json({ error: 'User not associated with a chapter' }, { status: 400 });
    }

    // Check if user has permission to create announcements
    const allowedRoles = ['president', 'vice_president', 'secretary', 'treasurer', 'executive_board'];
    if (!profile.chapter_role || !allowedRoles.includes(profile.chapter_role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
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
        sent_at: !is_scheduled ? new Date().toISOString() : null,
        is_pinned_post: create_as_pinned_post || false,
        auto_unpin_at: create_as_pinned_post ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null // Auto-unpin after 7 days
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
      
      // Create pinned post if requested
      if (create_as_pinned_post) {
        const postId = await AnnouncementPostService.createPinnedPostFromAnnouncement(announcement);
        if (postId) {
          console.log('Created pinned post for announcement:', postId);
        }
      }
      
      // Send SMS notifications if requested
      if (send_sms) {
        try {
          const smsResult = await NotificationService.sendAnnouncementSMS(
            profile.chapter_id,
            title,
            content,
            profile.full_name || 'Chapter Officer'
          );
          
          console.log('SMS notification result:', smsResult);
          
          if (smsResult.success) {
            await supabase
              .from('announcements')
              .update({
                metadata: {
                  ...announcement.metadata,
                  sms_sent: true,
                  sms_sent_count: smsResult.sentCount,
                  sms_errors: smsResult.errors
                }
              })
              .eq('id', announcement.id);
          }
        } catch (smsError) {
          console.error('SMS notification error:', smsError);
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

