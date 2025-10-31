import { logger } from "@/lib/utils/logger";
import { SMSService } from "./smsServiceTelnyx";
import { createClient } from "@supabase/supabase-js";

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
  private static async logSMS(
    data: SMSNotificationData,
    success: boolean,
    messageId?: string,
    error?: string,
  ) {
    try {
      await supabase.from("sms_logs").insert({
        user_id: data.userId,
        chapter_id: data.chapterId,
        message_type: data.messageType,
        message_content: data.messageContent,
        phone_number: data.phoneNumber,
        status: success ? "sent" : "failed",
        telnyx_id: messageId,
        error,
      });
    } catch (logError) {
      logger.error("Failed to log SMS", { logError, data });
    }
  }

  static async sendAnnouncementNotification(
    phoneNumber: string,
    userName: string,
    announcementTitle: string,
    userId: string,
    chapterId: string,
  ): Promise<boolean> {
    const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);
    const message = `New announcement: ${announcementTitle}. View at: trailblaize.net/dashboard`;

    const result = await SMSService.sendSMS({ to: formattedPhone, body: message });

    if (!result.success) {
      logger.error("Announcement SMS send failed", {
        error: result.error,
        messageId: result.messageId,
        phoneNumber: formattedPhone,
        chapterId,
        userId,
      });
    } else {
      logger.info("Announcement SMS sent", {
        messageId: result.messageId,
        phoneNumber: formattedPhone,
        chapterId,
        userId,
      });
    }

    await this.logSMS(
      {
        userId,
        chapterId,
        phoneNumber: formattedPhone,
        messageType: "announcement",
        messageContent: message,
      },
      result.success,
      result.messageId,
      result.error,
    );

    return result.success;
  }

  static async sendEventNotification(
    phoneNumber: string,
    userName: string,
    eventTitle: string,
    eventDate: string,
    userId: string,
    chapterId: string,
  ): Promise<boolean> {
    logger.info("Sending event SMS notification", {
      userId,
      userName,
      phoneNumber,
      eventTitle,
      eventDate,
      chapterId,
    });

    const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);
    const message = `New event: ${eventTitle} on ${eventDate}. RSVP: trailblaize.net/dashboard`;

    logger.debug("Prepared event SMS payload", {
      to: formattedPhone,
      messageLength: message.length,
      messagePreview: `${message.substring(0, 50)}...`,
    });

    const result = await SMSService.sendSMS({ to: formattedPhone, body: message });

    logger.info("Event SMS send result", {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      phoneNumber: formattedPhone,
    });

    if (!result.success) {
      logger.error("Event SMS send failed", {
        error: result.error,
        messageId: result.messageId,
        phoneNumber: formattedPhone,
      });
    }

    await this.logSMS(
      {
        userId,
        chapterId,
        phoneNumber: formattedPhone,
        messageType: "event",
        messageContent: message,
      },
      result.success,
      result.messageId,
      result.error,
    );

    return result.success;
  }

  static async sendMessageNotification(
    phoneNumber: string,
    userName: string,
    senderName: string,
    preview: string,
    userId: string,
    chapterId: string,
  ): Promise<boolean> {
    logger.info("Sending message SMS notification", {
      userId,
      userName,
      phoneNumber,
      senderName,
      previewLength: preview.length,
      chapterId,
    });

    const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);
    const message = `New message from ${senderName}: ${preview.substring(0, 50)}... View: trailblaize.net/dashboard/messages`;

    logger.debug("Prepared message SMS payload", {
      to: formattedPhone,
      messageLength: message.length,
      messagePreview: `${message.substring(0, 50)}...`,
    });

    const result = await SMSService.sendSMS({ to: formattedPhone, body: message });

    logger.info("Message SMS send result", {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      phoneNumber: formattedPhone,
    });

    if (!result.success) {
      logger.error("Message SMS send failed", {
        error: result.error,
        messageId: result.messageId,
        phoneNumber: formattedPhone,
      });
    }

    await this.logSMS(
      {
        userId,
        chapterId,
        phoneNumber: formattedPhone,
        messageType: "message",
        messageContent: message,
      },
      result.success,
      result.messageId,
      result.error,
    );

    return result.success;
  }

  static async sendConnectionRequestNotification(
    phoneNumber: string,
    userName: string,
    requesterName: string,
    userId: string,
    chapterId: string,
  ): Promise<boolean> {
    logger.info("Sending connection request SMS", {
      userId,
      userName,
      phoneNumber,
      requesterName,
      chapterId,
    });

    const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);
    const message = `${requesterName} wants to connect with you on Trailblaize. View: trailblaize.net/dashboard/notifications`;

    logger.debug("Prepared connection request SMS payload", {
      to: formattedPhone,
      messageLength: message.length,
      messagePreview: `${message.substring(0, 50)}...`,
    });

    const result = await SMSService.sendSMS({ to: formattedPhone, body: message });

    logger.info("Connection request SMS send result", {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      phoneNumber: formattedPhone,
    });

    if (!result.success) {
      logger.error("Connection request SMS send failed", {
        error: result.error,
        messageId: result.messageId,
        phoneNumber: formattedPhone,
      });
    }

    await this.logSMS(
      {
        userId,
        chapterId,
        phoneNumber: formattedPhone,
        messageType: "connection_request",
        messageContent: message,
      },
      result.success,
      result.messageId,
      result.error,
    );

    return result.success;
  }

  static async sendConnectionAcceptedNotification(
    phoneNumber: string,
    userName: string,
    accepterName: string,
    userId: string,
    chapterId: string,
  ): Promise<boolean> {
    logger.info("Sending connection accepted SMS", {
      userId,
      userName,
      phoneNumber,
      accepterName,
      chapterId,
    });

    const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);
    const message = `${accepterName} accepted your connection request on Trailblaize!`;

    logger.debug("Prepared connection accepted SMS payload", {
      to: formattedPhone,
      messageLength: message.length,
      messagePreview: `${message.substring(0, 50)}...`,
    });

    const result = await SMSService.sendSMS({ to: formattedPhone, body: message });

    logger.info("Connection accepted SMS send result", {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      phoneNumber: formattedPhone,
    });

    if (!result.success) {
      logger.error("Connection accepted SMS send failed", {
        error: result.error,
        messageId: result.messageId,
        phoneNumber: formattedPhone,
      });
    }

    await this.logSMS(
      {
        userId,
        chapterId,
        phoneNumber: formattedPhone,
        messageType: "connection_accepted",
        messageContent: message,
      },
      result.success,
      result.messageId,
      result.error,
    );

    return result.success;
  }
}