import twilio from 'twilio';
import { logger } from "@/lib/utils/logger";

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
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
  private static fromNumber = process.env.TWILIO_PHONE_NUMBER;
  private static isSandboxMode = process.env.TWILIO_SANDBOX_MODE === 'true';

  /**
   * Send a single SMS message
   */
  static async sendSMS(message: SMSMessage): Promise<SMSResult> {
    try {
      if (!this.fromNumber) {
        throw new Error('Twilio phone number not configured');
      }

      // In sandbox mode, we'll simulate sending but not actually send
      if (this.isSandboxMode) {
        // SANDBOX MODE: Would send SMS
        
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
          success: true,
          messageId: `sandbox_${Date.now()}`,
        };
      }

      const result = await client.messages.create({
        body: message.body,
        from: this.fromNumber,
        to: message.to,
      });

      return {
        success: true,
        messageId: result.sid,
      };
    } catch (error) {
      logger.error('SMS sending error:', { context: [error] });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send SMS to multiple recipients
   */
  static async sendBulkSMS(
    recipients: string[],
    message: string
  ): Promise<{ success: number; failed: number; results: SMSResult[] }> {
    const results: SMSResult[] = [];
    let successCount = 0;
    let failedCount = 0;

    // Process messages in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (phoneNumber) => {
        const result = await this.sendSMS({
          to: phoneNumber,
          body: message,
        });
        
        if (result.success) {
          successCount++;
        } else {
          failedCount++;
        }
        
        return result;
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches to respect rate limits
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return {
      success: successCount,
      failed: failedCount,
      results,
    };
  }

  /**
   * Format phone number for Twilio (ensure it starts with +1 for US numbers)
   */
  static formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // If it's 10 digits, add +1
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    // If it's 11 digits and starts with 1, add +
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    // If it already has +, return as is
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }
    
    // Default: add +1
    return `+1${cleaned}`;
  }

  /**
   * Validate phone number format
   */
  static isValidPhoneNumber(phoneNumber: string): boolean {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length === 10 || cleaned.length === 11;
  }

  /**
   * Check if we're in sandbox mode
   */
  static isInSandboxMode(): boolean {
    return this.isSandboxMode;
  }
}
