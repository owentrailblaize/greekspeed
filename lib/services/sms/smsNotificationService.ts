import { SMSService } from './smsServiceTelnyx';
import { SMSMessageFormatter } from './smsMessageFormatter';
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
    // Sample: [Trailblaize] Event reminder: Chapter formal is this Saturday at 8 PM. Check your email for details. Reply STOP to unsubscribe or HELP for help. Msg & data rates may apply
    const senderPrefix = '[Trailblaize]';
    const reminderPrefix = 'Event reminder: ';
    const optOutText = ' Reply STOP to unsubscribe or HELP for help.';
    const complianceText = ' Msg & data rates may apply';

    // Build event content - match sample format: "Event reminder: {details}"
    // Sample uses: "Chapter formal is this Saturday at 8 PM. Check your email for details."
    // We'll use: "{eventTitle} on {eventDate}."
    const eventContent = `${eventTitle} on ${eventDate}.`;
    
    // Use formatter to ensure compliance text is never truncated
    const messageParts = SMSMessageFormatter.formatCompliantMessage(
      `${reminderPrefix}${eventContent}`,
      {
        senderPrefix,
        optOutText,
        complianceText,
        // No maxParts limit - let Telnyx handle full message concatenation
      }
    );

    console.log('📝 SMS message prepared:', {
      to: formattedPhone,
      messageLength: messageParts.fullMessage.length,
      parts: messageParts.estimatedParts,
      encoding: messageParts.encoding,
      messagePreview: messageParts.fullMessage.substring(0, 80) + '...'
    });

    // Send full message - Telnyx handles concatenation automatically
    const result = await SMSService.sendSMS({ to: formattedPhone, body: messageParts.fullMessage });
    
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
      messageContent: messageParts.fullMessage
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
    // Pattern: [Trailblaize] Message notification: New message from {name}. Reply STOP to opt-out. Msg & data rates may apply
    const senderPrefix = '[Trailblaize]';
    const messagePrefix = 'Message notification: ';
    const optOutText = ' Reply STOP to opt-out.';
    const complianceText = ' Msg & data rates may apply';

    // Build message content
    const messageContent = `New message from ${senderName}.`;
    
    // Use formatter to ensure compliance text is never truncated
    const messageParts = SMSMessageFormatter.formatCompliantMessage(
      `${messagePrefix}${messageContent}`,
      {
        senderPrefix,
        optOutText,
        complianceText,
        // No maxParts limit - let Telnyx handle full message concatenation
      }
    );
    
    console.log('📝 SMS message prepared:', {
      to: formattedPhone,
      messageLength: messageParts.fullMessage.length,
      parts: messageParts.estimatedParts,
      encoding: messageParts.encoding,
      messagePreview: messageParts.fullMessage.substring(0, 80) + '...'
    });

    // Send full message - Telnyx handles concatenation automatically
    const result = await SMSService.sendSMS({ to: formattedPhone, body: messageParts.fullMessage });
    
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
      messageContent: messageParts.fullMessage
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

    // Format message to match Telnyx campaign sample pattern
    // Pattern: [Trailblaize] Connection request: {content}. Check your email for details. Reply STOP to unsubscribe or HELP for help. Msg & data rates may apply
    const connectionPrefix = 'Connection request: ';
    const optOutText = ' Reply STOP to unsubscribe or HELP for help.';
    const complianceText = ' Msg & data rates may apply';

    // Build connection content - match sample format
    // Sample: "{requesterName} wants to connect with you on Trailblaize. Check your email for details."
    const connectionContent = `${requesterName} wants to connect with you on Trailblaize. Check your email for details.`;
    
    // Use formatter to ensure compliance text is never truncated
    const messageParts = SMSMessageFormatter.formatConnectionMessage(
      connectionPrefix,
      connectionContent,
      {
        optOutText,
        complianceText,
        // No maxParts limit - let Telnyx handle full message concatenation
      }
    );
    
    console.log('📝 SMS message prepared:', {
      to: formattedPhone,
      messageLength: messageParts.fullMessage.length,
      parts: messageParts.estimatedParts,
      encoding: messageParts.encoding,
      messagePreview: messageParts.fullMessage.substring(0, 80) + '...'
    });

    // Send full message - Telnyx handles concatenation automatically
    const result = await SMSService.sendSMS({ to: formattedPhone, body: messageParts.fullMessage });
    
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
      messageContent: messageParts.fullMessage
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

    // Format message to match Telnyx campaign sample pattern
    // Pattern: [Trailblaize] Connection update: {content}. Check your email for details. Reply STOP to unsubscribe or HELP for help. Msg & data rates may apply
    const connectionPrefix = 'Connection update: ';
    const optOutText = ' Reply STOP to unsubscribe or HELP for help.';
    const complianceText = ' Msg & data rates may apply';

    // Build connection content - match sample format
    // Sample: "{accepterName} accepted your connection request on Trailblaize! Check your email for details."
    const connectionContent = `${accepterName} accepted your connection request on Trailblaize! Check your email for details.`;
    
    // Use formatter to ensure compliance text is never truncated
    const messageParts = SMSMessageFormatter.formatConnectionMessage(
      connectionPrefix,
      connectionContent,
      {
        optOutText,
        complianceText,
        // No maxParts limit - let Telnyx handle full message concatenation
      }
    );
    
    console.log('📝 SMS message prepared:', {
      to: formattedPhone,
      messageLength: messageParts.fullMessage.length,
      parts: messageParts.estimatedParts,
      encoding: messageParts.encoding,
      messagePreview: messageParts.fullMessage.substring(0, 80) + '...'
    });

    // Send full message - Telnyx handles concatenation automatically
    const result = await SMSService.sendSMS({ to: formattedPhone, body: messageParts.fullMessage });
    
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
      messageContent: messageParts.fullMessage
    }, result.success, result.messageId, result.error);
    
    return result.success;
  }
}