// lib/utils/checkEmailPreferences.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

type EmailType =
  | 'announcement'
  | 'event'
  | 'event_reminder'
  | 'message'
  | 'connection'
  | 'connection_accepted'
  | 'post_comment'
  | 'comment_reply'
  | 'post_like'
  | 'comment_like'
  | 'inactivity_reminder'
  | 'password_reset'
  | 'password_change';

export async function canSendEmailNotification(
  userId: string,
  notificationType: EmailType
): Promise<boolean> {
  if (!userId) return false;

  const { data: settings, error } = await supabase
    .from('notification_settings')
    .select(`
      email_enabled,
      announcement_notifications,
      event_notifications,
      event_reminder_notifications,
      message_notifications,
      connection_notifications,
      post_comment_notifications,
      comment_reply_notifications,
      post_like_notifications,
      comment_like_notifications,
      inactivity_reminder_notifications
    `)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // If an unexpected error occurs, be conservative: allow send (fail-open) or log and block
    console.error('Failed to load notification_settings:', error);
  }

  // Defaults: opt-in (true) when missing
  const emailEnabled = settings?.email_enabled ?? true;
  if (!emailEnabled) return false;

  // Password/security emails are always on (do not block)
  if (notificationType === 'password_reset' || notificationType === 'password_change') {
    return true;
  }

  switch (notificationType) {
    case 'announcement':
      return settings?.announcement_notifications ?? true;
    case 'event':
      return settings?.event_notifications ?? true;
    case 'event_reminder':
      return settings?.event_reminder_notifications ?? true;
    case 'message':
      return settings?.message_notifications ?? true;
    case 'connection':
    case 'connection_accepted':
      return settings?.connection_notifications ?? true;
    case 'post_comment':
      return settings?.post_comment_notifications ?? true;
    case 'comment_reply':
      return settings?.comment_reply_notifications ?? true;
    case 'post_like':
      return settings?.post_like_notifications ?? true;
    case 'comment_like':
      return settings?.comment_like_notifications ?? true;
    case 'inactivity_reminder':
      return settings?.inactivity_reminder_notifications ?? true;
    default:
      return true;
  }
}