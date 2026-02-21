import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user's profile to get chapter_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('chapter_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const notifications: any[] = [];

    // 1. Get recent connection requests (pending, received by user)
    const { data: connectionRequests } = await supabase
      .from('connections')
      .select(`
        id,
        status,
        message,
        created_at,
        requester:profiles!requester_id(id, full_name, first_name, last_name, avatar_url)
      `)
      .eq('recipient_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    if (connectionRequests) {
      connectionRequests.forEach(conn => {
        notifications.push({
          id: `connection-request-${conn.id}`,
          type: 'connection_request',
          title: 'New Connection Request',
          message: `${conn.requester?.full_name || 'Someone'} wants to connect with you`,
          actionUrl: `/dashboard/notifications?connection=${conn.id}`,
          timestamp: conn.created_at,
          metadata: {
            connectionId: conn.id,
            requesterName: conn.requester?.full_name,
            requesterAvatar: conn.requester?.avatar_url,
            requesterId: conn.requester?.id,
            message: conn.message
          },
          read: false
        });
      });
    }

    // 2. Get recent connection accepted notifications
    // Only show to the request (the person who sent the request)
    const { data: acceptedConnections } = await supabase
      .from('connections')
      .select(`
        id,
        status,
        updated_at,
        requester_id,
        recipient_id,
        requester:profiles!requester_id(id, full_name, first_name, last_name, avatar_url),
        recipient:profiles!recipient_id(id, full_name, first_name, last_name, avatar_url)
      `)
      .eq('requester_id', userId)  // Only show to the requester
      .eq('status', 'accepted')
      .order('updated_at', { ascending: false })
      .limit(10);

    if (acceptedConnections) {
      acceptedConnections.forEach(conn => {
        // The other user is always the recipient since we filtered by requester_id
        const otherUser = conn.recipient;
        notifications.push({
          id: `connection-accepted-${conn.id}`,
          type: 'connection_accepted',
          title: 'Connection Accepted',
          message: `${otherUser?.full_name || 'Someone'} accepted your connection request`,
          actionUrl: `/dashboard/notifications?connection=${conn.id}`,
          timestamp: conn.updated_at,
          metadata: {
            connectionId: conn.id,
            userName: otherUser?.full_name,
            userAvatar: otherUser?.avatar_url,
            userId: otherUser?.id
          },
          read: false
        });
      });
    }

    // 3. Get unread messages (grouped by connection)
    // First, get all connection IDs where the user is involved
    const { data: userConnections } = await supabase
      .from('connections')
      .select('id')
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .eq('status', 'accepted'); // Only accepted connections can have messages

    const connectionIds = userConnections?.map(c => c.id) || [];

    // If user has no connections, skip messages
    let unreadMessages: any[] = [];
    if (connectionIds.length > 0) {
      const { data: messages } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          connection_id,
          sender:profiles!sender_id(id, full_name, first_name, last_name, avatar_url),
          connection:connections!connection_id(id)
        `)
        .in('connection_id', connectionIds)
        .neq('sender_id', userId)
        .is('read_at', null)
        .order('created_at', { ascending: false })
        .limit(20);

      unreadMessages = messages || [];
    }

    // Process unread messages into notifications (grouped by connection)
    if (unreadMessages.length > 0) {
      // Group by connection
      const messagesByConnection = new Map();
      unreadMessages.forEach(msg => {
        const connId = msg.connection_id;
        if (!messagesByConnection.has(connId)) {
          messagesByConnection.set(connId, {
            connectionId: connId,
            sender: msg.sender,
            latestMessage: msg,
            count: 0
          });
        }
        messagesByConnection.get(connId).count++;
      });

      // Create notifications for each connection group
      messagesByConnection.forEach((group, connId) => {
        notifications.push({
          id: `message-${connId}`,
          type: 'message',
          title: 'New Message',
          message: group.count === 1 
            ? `${group.sender?.full_name || 'Someone'} sent you a message`
            : `${group.sender?.full_name || 'Someone'} sent you ${group.count} messages`,
          actionUrl: `/dashboard/messages?connection=${connId}`,
          timestamp: group.latestMessage.created_at,
          metadata: {
            connectionId: connId,
            senderName: group.sender?.full_name,
            senderAvatar: group.sender?.avatar_url,
            senderId: group.sender?.id,
            messagePreview: group.latestMessage.content?.substring(0, 100),
            unreadCount: group.count
          },
          read: false
        });
      });
    }

    // 4. Get unread announcements
    if (profile.chapter_id) {
      const { data: unreadAnnouncements } = await supabase
        .from('announcement_recipients')
        .select(`
          id,
          is_read,
          created_at,
          announcement:announcements!announcement_id(
            id,
            title,
            content,
            announcement_type,
            created_at,
            sender_id,
            sender:profiles!sender_id(id, full_name, first_name, last_name, avatar_url)
          )
        `)
        .eq('recipient_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (unreadAnnouncements) {
        unreadAnnouncements.forEach(recipient => {
          const announcement = recipient.announcement;
          if (announcement) {
            notifications.push({
              id: `announcement-${announcement.id}`,
              type: 'announcement',
              title: 'New Announcement',
              message: announcement.title,
              actionUrl: `/dashboard/announcements`,
              timestamp: announcement.created_at,
              metadata: {
                announcementId: announcement.id,
                announcementType: announcement.announcement_type,
                senderName: announcement.sender?.full_name,
                senderAvatar: announcement.sender?.avatar_url,
                senderId: announcement.sender?.id,
                content: announcement.content?.substring(0, 150)
              },
              read: false
            });
          }
        });
      }
    }

    // 5. Get upcoming events (next 7 days)
    if (profile.chapter_id) {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      const { data: upcomingEvents } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          start_at,
          end_at,
          location,
          slug,
          created_by,
          creator:profiles!created_by(id, full_name, first_name, last_name, avatar_url)
        `)
        .eq('chapter_id', profile.chapter_id)
        .gte('start_at', new Date().toISOString())
        .lte('start_at', sevenDaysFromNow.toISOString())
        .order('start_at', { ascending: true })
        .limit(5);

      if (upcomingEvents) {
        upcomingEvents.forEach(event => {
          notifications.push({
            id: `event-${event.id}`,
            type: 'event',
            title: 'Upcoming Event',
            message: `${event.title} - ${new Date(event.start_at).toLocaleDateString()}`,
            actionUrl: event.slug ? `/event/${event.slug}` : `/event/${event.id}`,
            timestamp: event.start_at,
            metadata: {
              eventId: event.id,
              eventTitle: event.title,
              eventDate: event.start_at,
              eventLocation: event.location,
              creatorName: event.creator?.full_name,
              creatorAvatar: event.creator?.avatar_url,
              creatorId: event.creator?.id
            },
            read: false
          });
        });
      }
    }

    // 6. Get events user hasn't RSVP'd to (upcoming, within 7 days)
    if (profile.chapter_id) {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      // Get upcoming events
      const { data: upcomingEvents } = await supabase
        .from('events')
        .select(`
          id,
          title,
          start_at,
          slug,
          chapter_id
        `)
        .eq('chapter_id', profile.chapter_id)
        .gte('start_at', new Date().toISOString())
        .lte('start_at', sevenDaysFromNow.toISOString())
        .order('start_at', { ascending: true })
        .limit(5);
    
      if (upcomingEvents && upcomingEvents.length > 0) {
        // Get user's RSVPs
        const { data: userRsvps } = await supabase
          .from('event_rsvps')
          .select('event_id')
          .eq('user_id', userId)
          .in('event_id', upcomingEvents.map(e => e.id));
    
        const rsvpEventIds = new Set(userRsvps?.map(r => r.event_id) || []);
        
        // Show events user hasn't RSVP'd to
        upcomingEvents
          .filter(event => !rsvpEventIds.has(event.id))
          .forEach(event => {
            notifications.push({
              id: `event-rsvp-${event.id}`,
              type: 'event_reminder',
              title: 'Event Reminder',
              message: `Don't forget to RSVP for ${event.title}`,
              actionUrl: event.slug ? `/event/${event.slug}` : `/event/${event.id}`,
              timestamp: event.start_at,
              metadata: {
                eventId: event.id,
                eventTitle: event.title,
                eventDate: event.start_at,
                needsRsvp: true
              },
              read: false
            });
          });
      }
    }

    // Sort all notifications by timestamp (newest first)
    notifications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Limit to requested amount
    const limitedNotifications = notifications.slice(0, limit);

    return NextResponse.json({
      notifications: limitedNotifications,
      total: notifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
