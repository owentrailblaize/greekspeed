import { Twilio } from 'twilio';

// Initialize Twilio client
const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export interface SMSMessage {
  to: string;
  body: string;
  from?: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class SMSService {
  private static fromNumber = process.env.TWILIO_PHONE_NUMBER!;

  /**
   * Send a single SMS message
   */
  static async sendSMS(message: SMSMessage): Promise<SMSResult> {
    try {
      if (!SMSService.fromNumber) {
        return { success: false, error: 'TWILIO_PHONE_NUMBER is not configured' };
      }

      const result = await twilioClient.messages.create({
        body: message.body,
        from: message.from || SMSService.fromNumber,
        to: message.to
      });

      return {
        success: true,
        messageId: result.sid
      };
    } catch (error: any) {
      console.error('SMS sending error:', error);
      return {
        success: false,
        error: error.message || 'Unknown error'
      };
    }
  }

  /**
   * Send SMS to multiple recipients
   */
  static async sendBulkSMS(messages: SMSMessage[]): Promise<SMSResult[]> {
    const results: SMSResult[] = [];
    
    // Send messages in parallel with rate limiting
    const batchSize = 10; // Twilio allows up to 10 concurrent requests
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const batchPromises = batch.map(message => this.sendSMS(message));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < messages.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Format phone number for Twilio (ensure it starts with +1 for US numbers)
   */
  static formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If it's a 10-digit number, add +1
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    // If it's an 11-digit number starting with 1, add +
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    // If it already has +, return as is
    if (phone.startsWith('+')) {
      return phone;
    }
    
    // Default: assume it needs +1
    return `+1${cleaned}`;
  }

  /**
   * Validate phone number format
   */
  static isValidPhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 || cleaned.length === 11;
  }
}
