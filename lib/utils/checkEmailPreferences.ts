// lib/utils/checkEmailPreferences.ts
import { createClient } from '@supabase/supabase-js';
import { logger } from "@/lib/utils/logger";

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
      connection_notifications
    `)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // If an unexpected error occurs, be conservative: allow send (fail-open) or log and block
    logger.error('Failed to load notification_settings:', { context: [error] });
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
    default:
      return true;
  }
}