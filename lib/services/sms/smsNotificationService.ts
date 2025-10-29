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
  
  // Log SMS attempt to database
  private static async logSMS(data: SMSNotificationData, success: boolean, messageId?: string, error?: string) {
    try {
      await supabase.from('sms_logs').insert({
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

    const message = `New event: ${eventTitle} on ${eventDate}. RSVP: trailblaize.net/dashboard`;
    
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

    const message = `New message from ${senderName}: ${preview.substring(0, 50)}... View: trailblaize.net/dashboard/messages`;
    
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

    const message = `${requesterName} wants to connect with you on Trailblaize. View: trailblaize.net/dashboard/notifications`;
    
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

    const message = `${accepterName} accepted your connection request on Trailblaize!`;
    
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