import { SMSService } from './smsServiceTelnyx';
import { SMSMessageFormatter } from './smsMessageFormatter';
import { createClient } from '@supabase/supabase-js';
import { toGsmSafe } from '@/lib/utils/smsUtils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://trailblaize.net';

interface SMSNotificationData {
  userId: string;
  chapterId: string;
  phoneNumber: string;
  messageType: string;
  messageContent: string;
}

export class SMSNotificationService {

  // Log SMS attempt to database
  private static async logSMS(data: SMSNotificationData, success: boolean, messageId?: string, error?: string) {
    try {
      await supabase.from('sms_notification_logs').insert({
        user_id: data.userId,
        chapter_id: data.chapterId,
        message_type: data.messageType,
        message_content: data.messageContent,
        phone_number: data.phoneNumber,
        status: success ? 'sent' : 'failed',
        telnyx_id: messageId,
        error: error
      });
    } catch (logError) {
      console.error('Failed to log SMS:', logError);
    }
  }

  // For announcements (marketing/broadcast: use full compliance per Option A)
  static async sendAnnouncementNotification(
    phoneNumber: string,
    userName: string,
    announcementTitle: string,
    userId: string,
    chapterId: string,
    options?: { contentSummary?: string; link?: string }
  ): Promise<boolean> {
    const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);
    const link = options?.link ?? `${BASE_URL}/dashboard/announcements`;
    const detail = toGsmSafe((options?.contentSummary ?? announcementTitle).slice(0, 60));
    const headline = toGsmSafe(announcementTitle.slice(0, 40));

    const messageParts = SMSMessageFormatter.formatShortMessage(
      headline,
      detail,
      'Read more',
      link,
      { complianceLevel: 'full' }
    );

    const result = await SMSService.sendSMS({ to: formattedPhone, body: messageParts.fullMessage });
    await this.logSMS(
      { userId, chapterId, phoneNumber: formattedPhone, messageType: 'announcement', messageContent: messageParts.fullMessage },
      result.success,
      result.messageId,
      result.error
    );
    return result.success;
  }

  // For events (transactional: short compliance)
  static async sendEventNotification(
    phoneNumber: string,
    userName: string,
    eventTitle: string,
    eventDate: string,
    userId: string,
    chapterId: string,
    options?: { link?: string }
  ): Promise<boolean> {
    const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);
    const link = options?.link ?? `${BASE_URL}/dashboard`;
    const headline = toGsmSafe(eventTitle.slice(0, 50));
    const detail = toGsmSafe(eventDate.slice(0, 40));

    const messageParts = SMSMessageFormatter.formatShortMessage(
      headline,
      detail,
      'RSVP',
      link,
      { complianceLevel: 'short' }
    );

    const result = await SMSService.sendSMS({ to: formattedPhone, body: messageParts.fullMessage });
    await this.logSMS(
      { userId, chapterId, phoneNumber: formattedPhone, messageType: 'event', messageContent: messageParts.fullMessage },
      result.success,
      result.messageId,
      result.error
    );
    return result.success;
  }

  // For messages (transactional: short compliance)
  static async sendMessageNotification(
    phoneNumber: string,
    userName: string,
    senderName: string,
    preview: string,
    userId: string,
    chapterId: string,
    options?: { link?: string }
  ): Promise<boolean> {
    const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);
    const link = options?.link ?? `${BASE_URL}/dashboard/messages`;
    const headline = `New message from ${toGsmSafe(senderName.slice(0, 30))}`;

    const messageParts = SMSMessageFormatter.formatShortMessage(
      headline,
      'Tap to reply',
      'Open',
      link,
      { complianceLevel: 'short' }
    );

    const result = await SMSService.sendSMS({ to: formattedPhone, body: messageParts.fullMessage });
    await this.logSMS(
      { userId, chapterId, phoneNumber: formattedPhone, messageType: 'message', messageContent: messageParts.fullMessage },
      result.success,
      result.messageId,
      result.error
    );
    return result.success;
  }

  // For connection requests (transactional: short compliance)
  static async sendConnectionRequestNotification(
    phoneNumber: string,
    userName: string,
    requesterName: string,
    userId: string,
    chapterId: string,
    options?: { link?: string }
  ): Promise<boolean> {
    const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);
    const link = options?.link ?? `${BASE_URL}/dashboard/notifications`;
    const headline = `${toGsmSafe(requesterName.slice(0, 30))} wants to connect`;

    const messageParts = SMSMessageFormatter.formatShortMessage(
      headline,
      'View profile to accept',
      'View',
      link,
      { complianceLevel: 'short' }
    );

    const result = await SMSService.sendSMS({ to: formattedPhone, body: messageParts.fullMessage });
    await this.logSMS(
      { userId, chapterId, phoneNumber: formattedPhone, messageType: 'connection_request', messageContent: messageParts.fullMessage },
      result.success,
      result.messageId,
      result.error
    );
    return result.success;
  }

  // For connection accepted (transactional: short compliance)
  static async sendConnectionAcceptedNotification(
    phoneNumber: string,
    userName: string,
    accepterName: string,
    userId: string,
    chapterId: string,
    options?: { link?: string }
  ): Promise<boolean> {
    const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);
    const link = options?.link ?? `${BASE_URL}/dashboard/notifications`;
    const headline = `${toGsmSafe(accepterName.slice(0, 30))} accepted your request`;

    const messageParts = SMSMessageFormatter.formatShortMessage(
      headline,
      'Say hello',
      'Open',
      link,
      { complianceLevel: 'short' }
    );

    const result = await SMSService.sendSMS({ to: formattedPhone, body: messageParts.fullMessage });
    await this.logSMS(
      { userId, chapterId, phoneNumber: formattedPhone, messageType: 'connection_accepted', messageContent: messageParts.fullMessage },
      result.success,
      result.messageId,
      result.error
    );
    return result.success;
  }
}
