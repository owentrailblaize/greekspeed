// @ts-ignore
const Telnyx = require('telnyx');

// Lazy initialization to prevent build errors
let telnyx: any = null;

function getTelnyxClient() {
  if (!telnyx) {
    const apiKey = process.env.TELNYX_API_KEY;
    if (!apiKey) {
      console.warn('TELNYX_API_KEY not found. SMS will work in sandbox mode only.');
      return null;
    }
    telnyx = Telnyx(apiKey);
  }
  return telnyx;
}

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
  private static fromNumber = process.env.TELNYX_PHONE_NUMBER;
  private static isSandboxMode = process.env.TELNYX_SANDBOX_MODE === 'true';

  static async sendSMS(message: SMSMessage): Promise<SMSResult> {
    try {
      if (!this.fromNumber) {
        throw new Error('Telnyx phone number not configured');
      }

      // Sandbox mode simulation
      if (this.isSandboxMode) {
        console.log('🔧 SANDBOX MODE: Simulating SMS send', {
          from: this.fromNumber,
          to: message.to,
          body: message.body.substring(0, 50) + '...'
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
          success: true,
          messageId: `sandbox_${Date.now()}`,
        };
      }

      // Lazy initialization check
      const client = getTelnyxClient();
      if (!client) {
        console.warn('Telnyx client not initialized. Running in sandbox mode.');
        return {
          success: false,
          error: 'Telnyx API key not configured',
        };
      }

      // Real SMS sending via Telnyx API v2
      const result = await client.messages.create({
        from: this.fromNumber,
        to: message.to,
        text: message.body,
      });

      return {
        success: true,
        messageId: result.data.id,
      };
    } catch (error) {
      console.error('SMS sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async sendBulkSMS(
    recipients: string[],
    message: string
  ): Promise<{ success: number; failed: number; results: SMSResult[] }> {
    const results: SMSResult[] = [];
    let successCount = 0;
    let failedCount = 0;

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

  static formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }
    
    return `+1${cleaned}`;
  }

  static isValidPhoneNumber(phoneNumber: string): boolean {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length === 10 || cleaned.length === 11;
  }

  static isInSandboxMode(): boolean {
    return this.isSandboxMode;
  }
}