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
    // CRITICAL FIX: Telnyx SDK is a function, NOT a constructor
    // Remove 'new' keyword - it should be called as a function
    telnyx = Telnyx(apiKey);
    
    // Debug: Log client structure to understand API
    console.log('🔍 Telnyx Client Debug:', {
      hasMessages: !!telnyx.messages,
      hasMessaging: !!telnyx.messaging,
      clientKeys: Object.keys(telnyx).slice(0, 10), // First 10 keys
      messagesType: typeof telnyx.messages,
      // Deep inspection of messages object
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
    const startTime = Date.now();
    const logContext = {
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
      vercelUrl: process.env.VERCEL_URL || 'local',
      to: message.to,
      messageLength: message.body.length,
    };

    try {
      console.log('📤 SMS Send Request:', logContext);

      // Read environment variables dynamically on each call
      const fromNumber = process.env.TELNYX_PHONE_NUMBER;
      const apiKey = process.env.TELNYX_API_KEY;
      const isSandboxMode = process.env.TELNYX_SANDBOX_MODE === 'true';

      // Debug: Log environment variables with full context
      console.log('🔍 Environment Debug:', {
        ...logContext,
        TELNYX_SANDBOX_MODE: process.env.TELNYX_SANDBOX_MODE || 'UNDEFINED',
        isSandboxMode: isSandboxMode,
        TELNYX_PHONE_NUMBER: fromNumber ? 'SET' : 'NOT SET',
        TELNYX_API_KEY: apiKey ? 'SET' : 'NOT SET',
        NODE_ENV: process.env.NODE_ENV || 'UNDEFINED',
        VERCEL_ENV: process.env.VERCEL_ENV || 'local',
        VERCEL_URL: process.env.VERCEL_URL || 'local',
      });

      // Sandbox mode simulation - doesn't need real phone number
      if (isSandboxMode) {
        console.log('🔧 SANDBOX MODE: Simulating SMS send', {
          ...logContext,
          from: fromNumber || 'SANDBOX',
          body: message.body.substring(0, 50) + '...',
          simulated: true,
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const sandboxMessageId = `sandbox_${Date.now()}`;
        console.log('✅ Sandbox SMS "sent" successfully:', {
          ...logContext,
          messageId: sandboxMessageId,
          duration: Date.now() - startTime,
        });
        
        return {
          success: true,
          messageId: sandboxMessageId,
        };
      }

      // Real SMS requires phone number and API key
      if (!fromNumber) {
        const errorMsg = `Telnyx phone number not configured. Environment: ${process.env.VERCEL_ENV || 'local'}. Please add TELNYX_PHONE_NUMBER to your environment variables.`;
        console.error('❌ SMS Configuration Error - Missing Phone Number:', {
          ...logContext,
          error: errorMsg,
          missingVariable: 'TELNYX_PHONE_NUMBER',
          environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
        });
        return {
          success: false,
          error: errorMsg,
        };
      }

      if (!apiKey) {
        const errorMsg = `Telnyx API key not configured. Environment: ${process.env.VERCEL_ENV || 'local'}. Please add TELNYX_API_KEY to your environment variables.`;
        console.error('❌ SMS Configuration Error - Missing API Key:', {
          ...logContext,
          error: errorMsg,
          missingVariable: 'TELNYX_API_KEY',
          environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
        });
        return {
          success: false,
          error: errorMsg,
        };
      }

      // Lazy initialization check
      console.log('🔧 Initializing Telnyx client...', logContext);
      const client = getTelnyxClient();
      if (!client) {
        const errorMsg = 'Telnyx client not initialized. API key may be invalid or missing.';
        console.error('❌ SMS Configuration Error - Client Initialization Failed:', {
          ...logContext,
          error: errorMsg,
        });
        return {
          success: false,
          error: errorMsg,
        };
      }
      console.log('✅ Telnyx client initialized successfully', logContext);

      // Real SMS sending via Telnyx API
      console.log('✅ Sending REAL SMS via Telnyx:', {
        ...logContext,
        from: fromNumber,
        body: message.body.substring(0, 50) + '...',
      });

      let result;
      let usedSDK = false;
      
      // Try SDK methods first
      if (client) {
        try {
          // Pattern 1: Standard messages.create
          if (client.messages?.create && typeof client.messages.create === 'function') {
            console.log('📡 Attempting SDK: client.messages.create', logContext);
            result = await client.messages.create({
              from: fromNumber,
              to: message.to,
              text: message.body,
            });
            usedSDK = true;
            console.log('✅ SDK method succeeded: client.messages.create', logContext);
          }
          // Pattern 2: Check if messages is a function
          else if (typeof client.messages === 'function') {
            console.log('📡 Attempting SDK: client.messages() as function', logContext);
            result = await client.messages({
              from: fromNumber,
              to: message.to,
              text: message.body,
            });
            usedSDK = true;
            console.log('✅ SDK method succeeded: client.messages() as function', logContext);
          }
          // Pattern 3: Check messaging API
          else if (client.messaging?.messages?.create && typeof client.messaging.messages.create === 'function') {
            console.log('📡 Attempting SDK: client.messaging.messages.create', logContext);
            result = await client.messaging.messages.create({
              from: fromNumber,
              to: message.to,
              text: message.body,
            });
            usedSDK = true;
            console.log('✅ SDK method succeeded: client.messaging.messages.create', logContext);
          }
        } catch (sdkError: any) {
          // Log SDK error but don't throw - fallback to REST API
          console.warn('⚠️ SDK method failed, falling back to REST API:', {
            ...logContext,
            error: sdkError.message,
            errorStack: sdkError.stack?.split('\n').slice(0, 3),
            errorName: sdkError.name,
          });
        }
      }

      // Fallback to REST API if SDK didn't work
      if (!usedSDK) {
        console.log('📡 Using REST API: Direct HTTP call to Telnyx', {
          ...logContext,
          reason: 'SDK methods not available or failed',
        });
        
        // Get API key for REST API call
        const telnyxApiKey = process.env.TELNYX_API_KEY;
        if (!telnyxApiKey) {
          const errorMsg = 'TELNYX_API_KEY not configured for REST API fallback';
          console.error('❌ REST API Configuration Error:', {
            ...logContext,
            error: errorMsg,
          });
          return {
            success: false,
            error: errorMsg,
          };
        }
        
        const telnyxApiUrl = 'https://api.telnyx.com/v2/messages';
        
        try {
          const requestBody = {
            from: fromNumber,
            to: message.to,
            text: message.body,
          };

          console.log('📤 Sending to Telnyx REST API:', {
            ...logContext,
            url: telnyxApiUrl,
            from: fromNumber,
            bodyLength: message.body.length,
            apiKeySet: !!telnyxApiKey,
            requestBody: JSON.stringify(requestBody),
          });

          // Add timeout to fetch request (30 seconds)
          const fetchController = new AbortController();
          const timeoutId = setTimeout(() => {
            fetchController.abort();
            console.error('⏱️ Fetch timeout after 30 seconds', logContext);
          }, 30000);

          let response: Response;
          try {
            console.log('🌐 Initiating fetch request to Telnyx...', logContext);
            
            // Add more detailed logging before fetch
            console.log('🔍 Fetch Request Details:', {
              ...logContext,
              url: telnyxApiUrl,
              method: 'POST',
              hasApiKey: !!telnyxApiKey,
              apiKeyLength: telnyxApiKey?.length || 0,
              apiKeyPrefix: telnyxApiKey?.substring(0, 10) || 'N/A',
              requestBodySize: JSON.stringify(requestBody).length,
            });
            
            response = await fetch(telnyxApiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${telnyxApiKey}`,
              },
              body: JSON.stringify(requestBody),
              signal: fetchController.signal,
            });
            clearTimeout(timeoutId);
            console.log('✅ Fetch request completed', {
              ...logContext,
              status: response.status,
              statusText: response.statusText,
              ok: response.ok,
            });
          } catch (fetchInitError: any) {
            clearTimeout(timeoutId);
            console.error('❌ Fetch Init Error (before response):', {
              ...logContext,
              error: fetchInitError.message,
              errorName: fetchInitError.name,
              errorType: typeof fetchInitError,
              errorCode: fetchInitError.code,
              errorStack: fetchInitError.stack?.split('\n').slice(0, 5),
            });
            
            if (fetchInitError.name === 'AbortError') {
              const errorMsg = 'Request to Telnyx API timed out after 30 seconds';
              console.error('❌ REST API Timeout:', {
                ...logContext,
                error: errorMsg,
                duration: Date.now() - startTime,
              });
              return {
                success: false,
                error: errorMsg,
              };
            }
            throw fetchInitError;
          }

          const responseText = await response.text();
          console.log('📥 Raw Telnyx REST API Response:', {
            ...logContext,
            status: response.status,
            statusText: response.statusText,
            responseLength: responseText.length,
            bodyPreview: responseText.substring(0, 500),
            headers: Object.fromEntries(response.headers.entries()),
            ok: response.ok,
          });

          // Check if response is not OK
          if (!response.ok) {
            const errorMsg = `Telnyx API returned error status ${response.status}: ${response.statusText}`;
            console.error('❌ REST API HTTP Error:', {
              ...logContext,
              status: response.status,
              statusText: response.statusText,
              responseBody: responseText.substring(0, 1000),
              error: errorMsg,
            });
            return {
              success: false,
              error: errorMsg,
            };
          }

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
            const errorMsg = 'Telnyx API did not return a message ID. Response: ' + JSON.stringify(result).substring(0, 200);
            console.error('❌ REST API Response Validation Failed:', {
              ...logContext,
              status: response.status,
              error: errorMsg,
              fullResponse: JSON.stringify(result).substring(0, 1000),
            });
            return {
              success: false,
              error: errorMsg,
            };
          }

          console.log('✅ REST API Response Validated:', {
            ...logContext,
            status: response.status,
            messageId: messageId,
            recordType: result?.data?.record_type || 'unknown',
            statusField: result?.data?.to?.[0]?.status || 'unknown',
            responseStructure: {
              hasData: !!result?.data,
              hasId: !!result?.id,
              hasRecord: !!result?.record,
            },
          });

        } catch (fetchError: any) {
          console.error('❌ REST API Error:', {
            ...logContext,
            error: fetchError.message,
            errorName: fetchError.name,
            errorStack: fetchError.stack?.split('\n').slice(0, 10),
            errorCode: fetchError.code,
            duration: Date.now() - startTime,
          });
          return {
            success: false,
            error: fetchError instanceof Error ? fetchError.message : 'Unknown REST API error',
          };
        }
      }

      // Extract message ID from response (for both SDK and REST API)
      const messageId = result?.data?.id || result?.id || result?.record?.id;
      const recordType = result?.data?.record_type;
      const status = result?.data?.to?.[0]?.status || result?.data?.status;
      
      // Validate we have a message ID
      if (!messageId) {
        const errorMsg = 'No message ID returned from Telnyx API';
        console.error('❌ SMS Send Failed - No Message ID:', {
          ...logContext,
          error: errorMsg,
          method: usedSDK ? 'SDK' : 'REST API',
          resultKeys: Object.keys(result || {}),
          fullResponse: JSON.stringify(result).substring(0, 1000),
          duration: Date.now() - startTime,
        });
        return {
          success: false,
          error: errorMsg,
        };
      }
      
      console.log('✅ REAL SMS SENT via Telnyx:', {
        ...logContext,
        method: usedSDK ? 'SDK' : 'REST API',
        messageId: messageId,
        recordType: recordType,
        status: status,
        duration: Date.now() - startTime,
        responsePreview: JSON.stringify(result).substring(0, 400),
      });

      return {
        success: true,
        messageId: messageId,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ SMS Sending Error (Unhandled Exception):', {
        ...logContext,
        error: errorMsg,
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorStack: error instanceof Error ? error.stack?.split('\n').slice(0, 15) : undefined,
        duration: Date.now() - startTime,
      });
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  static async sendBulkSMS(
    recipients: string[],
    message: string
  ): Promise<{ success: number; failed: number; results: SMSResult[] }> {
    const startTime = Date.now();
    const logContext = {
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
      totalRecipients: recipients.length,
      messageLength: message.length,
    };

    console.log('📤 Bulk SMS Send Request:', logContext);

    const results: SMSResult[] = [];
    let successCount = 0;
    let failedCount = 0;

    const batchSize = 10;
    const totalBatches = Math.ceil(recipients.length / batchSize);
    
    console.log('📊 Bulk SMS Batch Configuration:', {
      ...logContext,
      batchSize: batchSize,
      totalBatches: totalBatches,
    });

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      console.log(`📦 Processing Batch ${batchNumber}/${totalBatches}:`, {
        ...logContext,
        batchNumber: batchNumber,
        batchSize: batch.length,
        recipients: batch,
      });
      
      const batchPromises = batch.map(async (phoneNumber) => {
        const result = await this.sendSMS({
          to: phoneNumber,
          body: message,
        });
        
        if (result.success) {
          successCount++;
        } else {
          failedCount++;
          console.warn(`⚠️ Failed to send SMS to ${phoneNumber}:`, {
            ...logContext,
            phoneNumber: phoneNumber,
            error: result.error,
          });
        }
        
        return result;
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      console.log(`✅ Batch ${batchNumber}/${totalBatches} completed:`, {
        ...logContext,
        batchNumber: batchNumber,
        batchSuccess: batchResults.filter(r => r.success).length,
        batchFailed: batchResults.filter(r => !r.success).length,
        cumulativeSuccess: successCount,
        cumulativeFailed: failedCount,
      });

      if (i + batchSize < recipients.length) {
        console.log(`⏳ Waiting 1 second before next batch...`, logContext);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const duration = Date.now() - startTime;
    console.log('✅ Bulk SMS Send Completed:', {
      ...logContext,
      totalSuccess: successCount,
      totalFailed: failedCount,
      successRate: recipients.length > 0 ? ((successCount / recipients.length) * 100).toFixed(2) + '%' : '0%',
      duration: duration,
      averageTimePerSMS: recipients.length > 0 ? (duration / recipients.length).toFixed(0) + 'ms' : 'N/A',
    });

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
    // Only sandbox if explicitly set to 'true'
    // Default to production mode if not set
    return process.env.TELNYX_SANDBOX_MODE === 'true';
  }
}