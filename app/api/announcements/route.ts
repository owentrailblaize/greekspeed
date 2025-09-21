import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

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
    const { title, content, announcement_type, is_scheduled, scheduled_at, metadata } = body;

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
        console.log('📧 Starting email notification process...');
        
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
          console.log('⚠️ No chapter members found for email notifications');
        } else {
          console.log('📊 Chapter members found:', members.length);
          
          // Map to recipients - no email_preferences filtering since column doesn't exist
          const recipients = members.map(member => ({
            email: member.email,
            firstName: member.first_name || 'Member',
            chapterName: chapterName
          }));

          console.log(' Recipients prepared:', recipients.length);
          console.log(' Recipient emails:', recipients.map(r => r.email));

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

            console.log('✅ Email sending result:', result);
          }
        }
      } catch (emailError) {
        console.error('❌ Error sending announcement emails:', emailError);
        // Don't fail the announcement creation if email fails
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
