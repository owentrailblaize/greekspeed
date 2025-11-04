import { SMSService } from './smsServiceTelnyx';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SMSNotificationData {
  userId: string;
  chapterId: string;
  phoneNumber: string;
  messageType: string;
  messageContent: string;
}

export class SMSNotificationService {
  
  // Helper function to format compliant SMS messages
  private static formatCompliantMessage(
    content: string,
    maxLength: number = 160
  ): string {
    const senderPrefix = '[Trailblaize]';
    const optOutText = ' Reply STOP to opt out.';
    const complianceText = ' Msg & data rates may apply';
    
    const fixedLength = senderPrefix.length + 1 + optOutText.length + complianceText.length;
    const availableForContent = maxLength - fixedLength - 3; // -3 for ellipsis safety
    
    const truncatedContent = content.substring(0, Math.max(0, availableForContent));
    const needsEllipsis = content.length > truncatedContent.length;
    
    return `${senderPrefix} ${truncatedContent}${needsEllipsis ? '...' : ''}${optOutText}${complianceText}`.substring(0, maxLength);
  }

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

  // For announcements
  static async sendAnnouncementNotification(
    phoneNumber: string,
    userName: string,
    announcementTitle: string,
    userId: string,
    chapterId: string
  ): Promise<boolean> {
    // Format the phone number before sending
    const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);
    
    const message = `New announcement: ${announcementTitle}. View at: trailblaize.net/dashboard`;
    const result = await SMSService.sendSMS({ to: formattedPhone, body: message });
    
    await this.logSMS({
      userId,
      chapterId,
      phoneNumber: formattedPhone,
      messageType: 'announcement',
      messageContent: message
    }, result.success, result.messageId, result.error);
    
    return result.success;
  }

  // For events
  static async sendEventNotification(
    phoneNumber: string,
    userName: string,
    eventTitle: string,
    eventDate: string,
    userId: string,
    chapterId: string
  ): Promise<boolean> {
    console.log('📤 Sending event SMS notification:', {
      userId,
      userName,
      phoneNumber,
      eventTitle,
      eventDate,
      chapterId
    });

    // Format the phone number before sending
    const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);

    // Format message to match Telnyx campaign sample EXACTLY
    // Sample: [Trailblaize] Event reminder: Chapter formal is this Saturday at 8 PM. Check your email for details. Reply STOP to unsubscribe or HELP for help. Msg & data rates may apply. Message frequency varies. Contact support@trailblaize.net
    const senderPrefix = '[Trailblaize]';
    const reminderPrefix = 'Event reminder: ';
    const optOutText = ' Reply STOP to unsubscribe or HELP for help.';
    const complianceText = ' Msg & data rates may apply';

    // Build message prefix
    const messagePrefix = `${senderPrefix} ${reminderPrefix}`;
    const fixedComplianceLength = optOutText.length + complianceText.length;
    
    // Calculate available space for content (account for ellipsis if needed: 3 chars)
    // Note: SMS has 160 char limit, but we'll truncate if needed
    const availableForContent = 160 - messagePrefix.length - fixedComplianceLength - 3;
    
    // Build event content - match sample format: "Event reminder: {details}"
    // Sample uses: "Chapter formal is this Saturday at 8 PM. Check your email for details."
    // We'll use: "{eventTitle} on {eventDate}. Check your email for details."
    const eventContent = `${eventTitle} on ${eventDate}.`;
    const truncatedContent = eventContent.substring(0, Math.max(0, availableForContent));
    const needsEllipsis = eventContent.length > truncatedContent.length;

    // Build compliant message matching Telnyx sample exactly
    const message = `${messagePrefix}${truncatedContent}${needsEllipsis ? '...' : ''}${optOutText}${complianceText}`.substring(0, 160);
    
    console.log('📝 SMS message prepared:', {
      to: formattedPhone,
      messageLength: message.length,
      messagePreview: message.substring(0, 80) + '...'
    });

    const result = await SMSService.sendSMS({ to: formattedPhone, body: message });
    
    console.log('📬 SMS send result:', {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      phoneNumber: formattedPhone
    });
    
    await this.logSMS({
      userId,
      chapterId,
      phoneNumber: formattedPhone,
      messageType: 'event',
      messageContent: message
    }, result.success, result.messageId, result.error);
    
    return result.success;
  }

  // For messages
  static async sendMessageNotification(
    phoneNumber: string,
    userName: string,
    senderName: string,
    preview: string,
    userId: string,
    chapterId: string
  ): Promise<boolean> {
    console.log('📤 Sending message SMS notification:', {
      userId,
      userName,
      phoneNumber,
      senderName,
      previewLength: preview.length
    });

    // Format the phone number before sending
    const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);

    // Format message to match Telnyx campaign sample pattern
    // Pattern: [Trailblaize] Message notification: {content}. Check your email for details. Reply STOP to unsubscribe or HELP for help. Msg & data rates may apply
    const senderPrefix = '[Trailblaize]';
    const messagePrefix = 'Message notification: ';
    const optOutText = ' Reply STOP to unsubscribe or HELP for help.';
    const complianceText = ' Msg & data rates may apply';

    // Build message prefix
    const fullPrefix = `${senderPrefix} ${messagePrefix}`;
    const fixedComplianceLength = optOutText.length + complianceText.length;
    
    // Calculate available space for content (account for ellipsis if needed: 3 chars)
    const availableForContent = 160 - fullPrefix.length - fixedComplianceLength - 3 - 32; // -32 for "Check your email for details. "
    
    // Build message content - match sample format
    // Sample pattern: "New message from {sender}: {preview}. Check your email for details."
    const previewText = preview.substring(0, Math.min(60, availableForContent - 30)); // Reserve space for sender name
    const senderPart = `New message from ${senderName}: ${previewText}${preview.length > previewText.length ? '...' : ''}. Check your email for details.`;
    
    // Truncate if needed to fit available space
    const truncatedContent = senderPart.substring(0, Math.max(0, availableForContent));
    const needsEllipsis = senderPart.length > truncatedContent.length;

    // Build compliant message matching Telnyx sample pattern
    const message = `${fullPrefix}${truncatedContent}${needsEllipsis ? '...' : ''}${optOutText}${complianceText}`.substring(0, 160);
    
    console.log('📝 SMS message prepared:', {
      to: formattedPhone,
      messageLength: message.length,
      messagePreview: message.substring(0, 80) + '...'
    });

    const result = await SMSService.sendSMS({ to: formattedPhone, body: message });
    
    console.log('📬 SMS send result:', {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      phoneNumber: formattedPhone
    });
    
    await this.logSMS({
      userId,
      chapterId,
      phoneNumber: formattedPhone,
      messageType: 'message',
      messageContent: message
    }, result.success, result.messageId, result.error);
    
    return result.success;
  }

  // For connection requests
  static async sendConnectionRequestNotification(
    phoneNumber: string,
    userName: string,
    requesterName: string,
    userId: string,
    chapterId: string
  ): Promise<boolean> {
    console.log('📤 Sending connection request SMS notification:', {
      userId,
      userName,
      phoneNumber,
      requesterName,
      chapterId
    });

    // Format the phone number before sending
    const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);

    // Build compliant message content
    const content = `${requesterName} wants to connect with you on Trailblaize. View: trailblaize.net/dashboard/notifications`;
    const message = this.formatCompliantMessage(content);
    
    console.log('📝 SMS message prepared:', {
      to: formattedPhone,
      messageLength: message.length,
      messagePreview: message.substring(0, 50) + '...'
    });

    const result = await SMSService.sendSMS({ to: formattedPhone, body: message });
    
    console.log('📬 SMS send result:', {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      phoneNumber: formattedPhone
    });
    
    await this.logSMS({
      userId,
      chapterId,
      phoneNumber: formattedPhone,
      messageType: 'connection_request',
      messageContent: message
    }, result.success, result.messageId, result.error);
    
    return result.success;
  }

  // For connection accepted
  static async sendConnectionAcceptedNotification(
    phoneNumber: string,
    userName: string,
    accepterName: string,
    userId: string,
    chapterId: string
  ): Promise<boolean> {
    console.log('📤 Sending connection accepted SMS notification:', {
      userId,
      userName,
      phoneNumber,
      accepterName,
      chapterId
    });

    // Format the phone number before sending
    const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);

    // Build compliant message content
    const content = `${accepterName} accepted your connection request on Trailblaize! View: trailblaize.net/dashboard/connections`;
    const message = this.formatCompliantMessage(content);
    
    console.log('📝 SMS message prepared:', {
      to: formattedPhone,
      messageLength: message.length,
      messagePreview: message.substring(0, 50) + '...'
    });

    const result = await SMSService.sendSMS({ to: formattedPhone, body: message });
    
    console.log('📬 SMS send result:', {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      phoneNumber: formattedPhone
    });
    
    await this.logSMS({
      userId,
      chapterId,
      phoneNumber: formattedPhone,
      messageType: 'connection_accepted',
      messageContent: message
    }, result.success, result.messageId, result.error);
    
    return result.success;
  }
}