/**
 * Maps notification events to OneSignal push payloads (title, body, url, icon).
 * Single source for push content and deep links so every channel uses the same structure.
 */

import type { NotificationType } from '@/lib/services/notificationTestRunner';
import type { OneSignalPushPayload } from '@/lib/services/oneSignalPushService';
import { getEmailBaseUrl } from '@/lib/utils/urlUtils';

/** Context fields used to build push payloads. Not all fields are required for every event. */
export interface NotificationPushContext {
  baseUrl?: string;

  announcementId?: string;
  announcementTitle?: string;

  eventId?: string;
  eventSlug?: string | null;
  eventTitle?: string;
  eventStartAt?: string;
  startAtRelative?: string;

  connectionId?: string;

  actorFirstName?: string;
  actorFullName?: string;
  chapterName?: string;

  messagePreview?: string;

  postId?: string;
  commentId?: string;
  contentPreview?: string;

  /** For system_alert / generic_notification */
  title?: string;
  body?: string;
}

const PUSH_EVENT_TYPES: NotificationType[] = [
  'chapter_announcement',
  'new_event',
  'event_reminder',
  'connection_request',
  'connection_accepted',
  'new_message',
  'post_comment',
  'comment_reply',
  'system_alert',
  'welcome',
  'generic_notification',
];

/**
 * Returns whether the given event type supports push (has a payload mapping).
 */
export function supportsPush(event: NotificationType): boolean {
  return PUSH_EVENT_TYPES.includes(event);
}

/**
 * Builds the OneSignal push payload for a notification event and context.
 * Uses app base URL for deep links (same as email CTAs).
 */
export function buildPushPayload(
  event: NotificationType,
  context: NotificationPushContext
): OneSignalPushPayload {
  const base = context.baseUrl ?? getEmailBaseUrl();

  switch (event) {
    case 'chapter_announcement':
      return {
        title: 'Chapter Announcement',
        body: context.announcementTitle ?? 'New announcement from your chapter',
        url: `${base}/dashboard/announcements`,
      };

    case 'new_event':
      return {
        title: 'New Event',
        body: context.eventTitle
          ? `${context.eventTitle} – check it out`
          : 'A new chapter event was created',
        url:
          context.eventId && (context.eventSlug || context.eventId)
            ? `${base}/event/${context.eventSlug ?? context.eventId}`
            : `${base}/dashboard`,
      };

    case 'event_reminder':
      return {
        title: 'Event Reminder',
        body: context.eventTitle
          ? context.startAtRelative
            ? `${context.eventTitle} – ${context.startAtRelative}`
            : context.eventTitle
          : 'An event is coming up',
        url:
          context.eventId && (context.eventSlug || context.eventId)
            ? `${base}/event/${context.eventSlug ?? context.eventId}`
            : `${base}/dashboard`,
      };

    case 'connection_request':
      return {
        title: 'New Connection Request',
        body: context.actorFirstName
          ? `${context.actorFirstName} wants to connect with you`
          : 'Someone wants to connect with you',
        url: context.connectionId
          ? `${base}/dashboard/notifications?connection=${context.connectionId}`
          : `${base}/dashboard/notifications`,
      };

    case 'connection_accepted':
      return {
        title: 'Connection Accepted',
        body: context.actorFirstName
          ? `${context.actorFirstName} accepted your connection request`
          : 'Your connection request was accepted',
        url: context.connectionId
          ? `${base}/dashboard/notifications?connection=${context.connectionId}`
          : `${base}/dashboard/notifications`,
      };

    case 'new_message':
      return {
        title: 'New Message',
        body: context.actorFirstName
          ? context.messagePreview
            ? `${context.actorFirstName}: ${context.messagePreview}`
            : `${context.actorFirstName} sent you a message`
          : 'You have a new message',
        url: context.connectionId
          ? `${base}/dashboard/messages?connection=${context.connectionId}`
          : `${base}/dashboard/messages`,
      };

    case 'post_comment':
      return {
        title: 'New Comment',
        body: context.actorFirstName
          ? context.contentPreview
            ? `${context.actorFirstName} commented: ${context.contentPreview}`
            : `${context.actorFirstName} commented on a post`
          : 'Someone commented on a post',
        url: context.postId
          ? `${base}/dashboard/post/${context.postId}`
          : `${base}/dashboard`,
      };

    case 'comment_reply':
      return {
        title: 'New Reply',
        body: context.actorFirstName
          ? context.contentPreview
            ? `${context.actorFirstName} replied: ${context.contentPreview}`
            : `${context.actorFirstName} replied to your comment`
          : 'Someone replied to your comment',
        url: context.postId
          ? `${base}/dashboard/post/${context.postId}`
          : `${base}/dashboard`,
      };

    case 'system_alert':
      return {
        title: context.title ?? 'Trailblaize',
        body: context.body ?? 'You have a new notification',
        url: `${base}/dashboard/notifications`,
      };

    case 'welcome':
      return {
        title: 'Welcome',
        body: context.actorFirstName
          ? `Welcome to Trailblaize, ${context.actorFirstName}`
          : 'Welcome to Trailblaize',
        url: `${base}/dashboard`,
      };

    case 'generic_notification':
      return {
        title: context.title ?? 'Trailblaize',
        body: context.body ?? 'You have a new notification',
        url: `${base}/dashboard`,
      };

    default:
      return {
        title: 'Trailblaize',
        body: 'You have a new notification',
        url: `${base}/dashboard/notifications`,
      };
  }
}
