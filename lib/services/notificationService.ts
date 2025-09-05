import { createClient } from '@supabase/supabase-js';
import { SMSService } from './smsService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface NotificationRecipient {
  id: string;
  phone: string | null;
  full_name: string;
  first_name: string | null;
}

export class NotificationService {
  /**
   * Get all chapter members with phone numbers for SMS notifications
   */
  static async getChapterMembersForSMS(chapterId: string): Promise<NotificationRecipient[]> {
    try {
      const { data: members, error } = await supabase
        .from('profiles')
        .select('id, phone, full_name, first_name')
        .eq('chapter_id', chapterId)
        .not('phone', 'is', null) // Only get members with phone numbers
        .in('role', ['admin', 'active_member', 'alumni']); // Include all relevant roles

      if (error) {
        console.error('Error fetching chapter members:', error);
        return [];
      }

      return members || [];
    } catch (error) {
      console.error('Error in getChapterMembersForSMS:', error);
      return [];
    }
  }

  /**
   * Send announcement notification via SMS
   */
  static async sendAnnouncementSMS(
    chapterId: string, 
    announcementTitle: string, 
    announcementContent: string,
    senderName: string
  ): Promise<{ success: boolean; sentCount: number; errors: string[] }> {
    try {
      // Get all chapter members with phone numbers
      const members = await this.getChapterMembersForSMS(chapterId);
      
      if (members.length === 0) {
        return { success: true, sentCount: 0, errors: ['No members with phone numbers found'] };
      }

      // Create SMS messages
      const messages = members
        .filter(member => member.phone && SMSService.isValidPhoneNumber(member.phone))
        .map(member => ({
          to: SMSService.formatPhoneNumber(member.phone!),
          body: this.formatAnnouncementMessage(announcementTitle, announcementContent, senderName, member.first_name || member.full_name)
        }));

      if (messages.length === 0) {
        return { success: true, sentCount: 0, errors: ['No valid phone numbers found'] };
      }

      // Send SMS messages
      const results = await SMSService.sendBulkSMS(messages);
      
      const successCount = results.filter(r => r.success).length;
      const errors = results.filter(r => !r.success).map(r => r.error || 'Unknown error');

      return {
        success: successCount > 0,
        sentCount: successCount,
        errors
      };
    } catch (error) {
      console.error('Error sending announcement SMS:', error);
      return {
        success: false,
        sentCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Format announcement message for SMS
   */
  private static formatAnnouncementMessage(
    title: string, 
    content: string, 
    senderName: string, 
    recipientName: string
  ): string {
    // Truncate content if too long (SMS has 160 character limit for single message)
    const maxLength = 140; // Leave room for sender info
    const truncatedContent = content.length > maxLength 
      ? content.substring(0, maxLength - 3) + '...'
      : content;

    return `Hi ${recipientName}! ${senderName} sent an announcement: "${title}" - ${truncatedContent}`;
  }

  /**
   * Send dues reminder SMS
   */
  static async sendDuesReminderSMS(
    chapterId: string,
    duesAmount: string,
    dueDate: string,
    senderName: string
  ): Promise<{ success: boolean; sentCount: number; errors: string[] }> {
    try {
      const members = await this.getChapterMembersForSMS(chapterId);
      
      const messages = members
        .filter(member => member.phone && SMSService.isValidPhoneNumber(member.phone))
        .map(member => ({
          to: SMSService.formatPhoneNumber(member.phone!),
          body: `Hi ${member.first_name || member.full_name}! Reminder from ${senderName}: Dues of $${duesAmount} are due by ${dueDate}. Please pay promptly.`
        }));

      if (messages.length === 0) {
        return { success: true, sentCount: 0, errors: ['No valid phone numbers found'] };
      }

      const results = await SMSService.sendBulkSMS(messages);
      const successCount = results.filter(r => r.success).length;
      const errors = results.filter(r => !r.success).map(r => r.error || 'Unknown error');

      return {
        success: successCount > 0,
        sentCount: successCount,
        errors
      };
    } catch (error) {
      console.error('Error sending dues reminder SMS:', error);
      return {
        success: false,
        sentCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Send task reminder SMS
   */
  static async sendTaskReminderSMS(
    chapterId: string,
    taskTitle: string,
    dueDate: string,
    senderName: string
  ): Promise<{ success: boolean; sentCount: number; errors: string[] }> {
    try {
      const members = await this.getChapterMembersForSMS(chapterId);
      
      const messages = members
        .filter(member => member.phone && SMSService.isValidPhoneNumber(member.phone))
        .map(member => ({
          to: SMSService.formatPhoneNumber(member.phone!),
          body: `Hi ${member.first_name || member.full_name}! Task reminder from ${senderName}: "${taskTitle}" is due by ${dueDate}.`
        }));

      if (messages.length === 0) {
        return { success: true, sentCount: 0, errors: ['No valid phone numbers found'] };
      }

      const results = await SMSService.sendBulkSMS(messages);
      const successCount = results.filter(r => r.success).length;
      const errors = results.filter(r => !r.success).map(r => r.error || 'Unknown error');

      return {
        success: successCount > 0,
        sentCount: successCount,
        errors
      };
    } catch (error) {
      console.error('Error sending task reminder SMS:', error);
      return {
        success: false,
        sentCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}
