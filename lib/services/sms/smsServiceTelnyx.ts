import { logger } from "@/lib/utils/logger";

// @ts-ignore
const Telnyx = require('telnyx');

// Lazy initialization to prevent build errors
let telnyx: any = null;

function getTelnyxClient() {
  if (!telnyx) {
    const apiKey = process.env.TELNYX_API_KEY;
    if (!apiKey) {
      logger.warn('Telnyx API key missing; SMS limited to sandbox mode', {
        envVar: 'TELNYX_API_KEY',
      });
      return null;
    }
    // CRITICAL FIX: Telnyx SDK is a function, NOT a constructor
    // Remove 'new' keyword - it should be called as a function
    telnyx = Telnyx(apiKey);
    
    logger.debug('Telnyx client initialized', {
      hasMessages: !!telnyx.messages,
      hasMessaging: !!telnyx.messaging,
      clientKeys: Object.keys(telnyx).slice(0, 10),
      messagesType: typeof telnyx.messages,
      messagesKeys: telnyx.messages ? Object.keys(telnyx.messages).slice(0, 20) : [],
      messagesCreateExists: !!(telnyx.messages && telnyx.messages.create),
      messagesCreateType: telnyx.messages ? typeof telnyx.messages.create : 'undefined',
    });
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
  static async sendSMS(message: SMSMessage): Promise<SMSResult> {
    try {
      // Read environment variables dynamically on each call
      const fromNumber = process.env.TELNYX_PHONE_NUMBER;
      const isSandboxMode = process.env.TELNYX_SANDBOX_MODE === 'true';

      logger.debug('Telnyx environment configuration', {
        TELNYX_SANDBOX_MODE: process.env.TELNYX_SANDBOX_MODE,
        isSandboxMode,
        TELNYX_PHONE_NUMBER: fromNumber ? 'SET' : 'NOT SET',
        TELNYX_API_KEY: process.env.TELNYX_API_KEY ? 'SET' : 'NOT SET',
      });

      // Sandbox mode simulation - doesn't need real phone number
      if (isSandboxMode) {
        logger.info('Simulating Telnyx SMS send', {
          mode: 'sandbox',
          from: fromNumber || 'SANDBOX',
          to: message.to,
          bodyPreview: `${message.body.substring(0, 50)}...`,
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
          success: true,
          messageId: `sandbox_${Date.now()}`,
        };
      }

      // Real SMS requires phone number
      if (!fromNumber) {
        throw new Error('Telnyx phone number not configured');
      }

      // Lazy initialization check
      const client = getTelnyxClient();
      if (!client) {
        logger.warn('Telnyx client not initialized; sandbox mode active', {
          reason: 'missing_telnyx_client',
        });
        return {
          success: false,
          error: 'Telnyx API key not configured',
        };
      }

      // Real SMS sending via Telnyx API
      logger.info('Sending Telnyx SMS', {
        from: fromNumber,
        to: message.to,
        bodyPreview: `${message.body.substring(0, 50)}...`,
      });

      let result;
      let usedSDK = false;
      
      // Try SDK methods first
      if (client) {
        try {
          // Pattern 1: Standard messages.create
          if (client.messages?.create && typeof client.messages.create === 'function') {
            logger.debug('Attempting Telnyx SDK send', {
              method: 'client.messages.create',
            });
            result = await client.messages.create({
              from: fromNumber,
              to: message.to,
              text: message.body,
            });
            usedSDK = true;
          }
          // Pattern 2: Check if messages is a function
          else if (typeof client.messages === 'function') {
            logger.debug('Attempting Telnyx SDK send', {
              method: 'client.messages()',
            });
            result = await client.messages({
              from: fromNumber,
              to: message.to,
              text: message.body,
            });
            usedSDK = true;
          }
          // Pattern 3: Check messaging API
          else if (client.messaging?.messages?.create && typeof client.messaging.messages.create === 'function') {
            logger.debug('Attempting Telnyx SDK send', {
              method: 'client.messaging.messages.create',
            });
            result = await client.messaging.messages.create({
              from: fromNumber,
              to: message.to,
              text: message.body,
            });
            usedSDK = true;
          }
        } catch (sdkError: any) {
          // Log SDK error but don't throw - fallback to REST API
          logger.warn('Telnyx SDK send failed; falling back to REST API', {
            error: {
              message: sdkError.message,
              stack: sdkError.stack,
            },
          });
        }
      }

      // Fallback to REST API if SDK didn't work
      if (!usedSDK) {
        logger.debug('Falling back to Telnyx REST API');
        
        // Get API key for REST API call
        const telnyxApiKey = process.env.TELNYX_API_KEY;
        if (!telnyxApiKey) {
          throw new Error('TELNYX_API_KEY not configured for REST API fallback');
        }
        
        const telnyxApiUrl = 'https://api.telnyx.com/v2/messages';
        
        try {
          const requestBody = {
            from: fromNumber,
            to: message.to,
            text: message.body,
          };

          logger.debug('Dispatching Telnyx REST request', {
            url: telnyxApiUrl,
            from: fromNumber,
            to: message.to,
            bodyLength: message.body.length,
          });

          const response = await fetch(telnyxApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${telnyxApiKey}`,
            },
            body: JSON.stringify(requestBody),
          });

          const responseText = await response.text();
          logger.debug('Received Telnyx REST response', {
            status: response.status,
            statusText: response.statusText,
            bodyPreview: responseText.substring(0, 500),
          });

          try {
            result = JSON.parse(responseText);
          } catch (parseError) {
            throw new Error(`Failed to parse Telnyx response: ${responseText}`);
          }

          // Check for errors in response
          if (result.errors && result.errors.length > 0) {
            const errorMessages = result.errors.map((e: any) => 
              `${e.code || 'UNKNOWN'}: ${e.title || e.detail || JSON.stringify(e)}`
            ).join(', ');
            throw new Error(`Telnyx API errors: ${errorMessages}`);
          }

          // Validate response structure
          const messageId = result?.data?.id || result?.id || result?.record?.id;
          
          if (!messageId) {
            logger.error('Telnyx REST response missing message ID', {
              status: response.status,
              response: JSON.stringify(result),
            });
            throw new Error('Telnyx API did not return a message ID. Response: ' + JSON.stringify(result).substring(0, 200));
          }

          logger.debug('Validated Telnyx REST response', {
            status: response.status,
            messageId,
            recordType: result?.data?.record_type || 'unknown',
            statusField: result?.data?.to?.[0]?.status || 'unknown',
          });

        } catch (fetchError: any) {
          logger.error('Telnyx REST API request failed', {
            error: {
              message: fetchError.message,
              stack: fetchError.stack?.split('\n').slice(0, 5),
            },
          });
          throw fetchError;
        }
      }

      // Extract message ID from response (for both SDK and REST API)
      const messageId = result?.data?.id || result?.id || result?.record?.id;
      const recordType = result?.data?.record_type;
      const status = result?.data?.to?.[0]?.status || result?.data?.status;
      
      // Validate we have a message ID
      if (!messageId) {
        throw new Error('No message ID returned from Telnyx API');
      }
      
      logger.info('Sent Telnyx SMS', {
        method: usedSDK ? 'SDK' : 'REST API',
        messageId,
        recordType,
        status,
        responsePreview: JSON.stringify(result).substring(0, 400),
      });

      return {
        success: true,
        messageId: messageId,
      };
    } catch (error) {
      logger.error('Failed to send SMS via Telnyx', {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
        } : error,
        to: message.to,
      });
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
    return process.env.TELNYX_SANDBOX_MODE !== 'false';
  }
}