/**
 * SMS Message Formatter
 * 
 * Handles proper formatting of SMS messages with:
 * - Encoding detection (GSM-7 vs UCS-2/Unicode)
 * - Multi-part message calculation
 * - Compliance text preservation
 * - Automatic concatenation support (Telnyx handles this)
 */

export interface SMSMessageParts {
  fullMessage: string;
  estimatedParts: number;
  encoding: 'GSM-7' | 'UCS-2';
  willBeConcatenated: boolean;
}

export class SMSMessageFormatter {
  // GSM-7 character set (standard SMS) - basic regex for common characters
  // Note: Full GSM-7 includes more characters, but this covers most use cases
  private static readonly GSM_7_CHARS = /^[A-Za-z0-9\s@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#$%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\[~\]|€]*$/;
  
  // Character limits per SMS standard
  private static readonly GSM_7_SINGLE = 160;
  private static readonly GSM_7_MULTI = 153; // 160 - 7 (UDH overhead for concatenation)
  private static readonly UCS_2_SINGLE = 70;
  private static readonly UCS_2_MULTI = 67; // 70 - 3 (UDH overhead for concatenation)
  
  /**
   * Detects if message requires Unicode encoding
   * Returns 'UCS-2' if message contains non-GSM-7 characters (emojis, special Unicode, etc.)
   */
  static detectEncoding(message: string): 'GSM-7' | 'UCS-2' {
    // Check for Unicode characters (emojis, special chars, etc.)
    // If message contains characters outside GSM-7, it needs UCS-2 encoding
    return this.GSM_7_CHARS.test(message) ? 'GSM-7' : 'UCS-2';
  }
  
  /**
   * Calculates how many SMS parts a message will use
   * Based on encoding and SMS concatenation standards
   */
  static calculateParts(message: string): number {
    const encoding = this.detectEncoding(message);
    const singleLimit = encoding === 'GSM-7' ? this.GSM_7_SINGLE : this.UCS_2_SINGLE;
    const multiLimit = encoding === 'GSM-7' ? this.GSM_7_MULTI : this.UCS_2_MULTI;
    
    if (message.length <= singleLimit) {
      return 1;
    }
    
    // Multi-part: first part uses single limit, subsequent parts use multi limit
    const remaining = message.length - singleLimit;
    return 1 + Math.ceil(remaining / multiLimit);
  }
  
  /**
   * Formats a compliant SMS message ensuring compliance text is never truncated
   * 
   * @param content - The main message content
   * @param options - Formatting options
   * @returns Formatted message with metadata
   */
  static formatCompliantMessage(
    content: string,
    options: {
      senderPrefix?: string;
      optOutText?: string;
      complianceText?: string;
      maxParts?: number; // Optional: limit to N parts (default: no limit, let Telnyx handle)
    } = {}
  ): SMSMessageParts {
    const {
      senderPrefix = '[Trailblaize]',
      optOutText = ' Reply STOP to opt out.',
      complianceText = ' Msg & data rates may apply',
      maxParts
    } = options;
    
    // Build the full message with compliance text
    const fullMessage = `${senderPrefix} ${content}${optOutText}${complianceText}`;
    
    // Detect encoding
    const encoding = this.detectEncoding(fullMessage);
    
    // Calculate parts
    let estimatedParts = this.calculateParts(fullMessage);
    
    // If maxParts is specified and we exceed it, truncate content (but NEVER compliance text)
    if (maxParts && estimatedParts > maxParts) {
      const singleLimit = encoding === 'GSM-7' ? this.GSM_7_SINGLE : this.UCS_2_SINGLE;
      const multiLimit = encoding === 'GSM-7' ? this.GSM_7_MULTI : this.UCS_2_MULTI;
      
      // Calculate max content length for N parts
      // Total available = (first part) + (remaining parts * multi limit) - fixed text
      const maxTotalLength = singleLimit + (maxParts - 1) * multiLimit;
      const fixedTextLength = senderPrefix.length + 1 + optOutText.length + complianceText.length;
      const maxContentLength = maxTotalLength - fixedTextLength;
      
      // Truncate ONLY the content, preserve compliance text
      const truncatedContent = content.substring(0, Math.max(0, maxContentLength));
      const truncatedMessage = `${senderPrefix} ${truncatedContent}${optOutText}${complianceText}`;
      
      return {
        fullMessage: truncatedMessage,
        estimatedParts: this.calculateParts(truncatedMessage),
        encoding,
        willBeConcatenated: this.calculateParts(truncatedMessage) > 1
      };
    }
    
    return {
      fullMessage,
      estimatedParts,
      encoding,
      willBeConcatenated: estimatedParts > 1
    };
  }
  
  /**
   * Formats announcement SMS with title and content
   * 
   * @param title - Announcement title
   * @param content - Announcement content
   * @param options - Formatting options
   * @returns Formatted message with metadata
   */
  static formatAnnouncementMessage(
    title: string,
    content: string,
    options: {
      optOutText?: string;
      complianceText?: string;
      maxParts?: number;
    } = {}
  ): SMSMessageParts {
    const {
      optOutText = ' Reply STOP to opt out.',
      complianceText = ' Msg & data rates may apply',
      maxParts
    } = options;
    
    const senderPrefix = '[Trailblaize]';
    const titlePrefix = `${senderPrefix} ${title}: `;
    
    // Build full message
    const fullMessage = `${titlePrefix}${content}${optOutText}${complianceText}`;
    
    const encoding = this.detectEncoding(fullMessage);
    let estimatedParts = this.calculateParts(fullMessage);
    
    // If we need to truncate due to maxParts limit
    if (maxParts && estimatedParts > maxParts) {
      const singleLimit = encoding === 'GSM-7' ? this.GSM_7_SINGLE : this.UCS_2_SINGLE;
      const multiLimit = encoding === 'GSM-7' ? this.GSM_7_MULTI : this.UCS_2_MULTI;
      
      // Calculate available space for content
      // Total available = (first part) + (remaining parts * multi limit) - fixed text
      const maxTotalLength = singleLimit + (maxParts - 1) * multiLimit;
      const fixedTextLength = titlePrefix.length + optOutText.length + complianceText.length;
      const maxContentLength = maxTotalLength - fixedTextLength;
      
      // Truncate ONLY content, preserve title prefix and compliance text
      const truncatedContent = content.substring(0, Math.max(0, maxContentLength));
      const truncatedMessage = `${titlePrefix}${truncatedContent}${optOutText}${complianceText}`;
      
      return {
        fullMessage: truncatedMessage,
        estimatedParts: this.calculateParts(truncatedMessage),
        encoding,
        willBeConcatenated: this.calculateParts(truncatedMessage) > 1
      };
    }
    
    return {
      fullMessage,
      estimatedParts,
      encoding,
      willBeConcatenated: estimatedParts > 1
    };
  }
  
  /**
   * Formats connection notification messages
   */
  static formatConnectionMessage(
    prefix: string,
    content: string,
    options: {
      optOutText?: string;
      complianceText?: string;
      maxParts?: number;
    } = {}
  ): SMSMessageParts {
    const {
      optOutText = ' Reply STOP to unsubscribe or HELP for help.',
      complianceText = ' Msg & data rates may apply',
      maxParts
    } = options;
    
    const senderPrefix = '[Trailblaize]';
    const fullPrefix = `${senderPrefix} ${prefix}`;
    
    // Build full message
    const fullMessage = `${fullPrefix}${content}${optOutText}${complianceText}`;
    
    const encoding = this.detectEncoding(fullMessage);
    let estimatedParts = this.calculateParts(fullMessage);
    
    // If we need to truncate due to maxParts limit
    if (maxParts && estimatedParts > maxParts) {
      const singleLimit = encoding === 'GSM-7' ? this.GSM_7_SINGLE : this.UCS_2_SINGLE;
      const multiLimit = encoding === 'GSM-7' ? this.GSM_7_MULTI : this.UCS_2_MULTI;
      
      // Calculate available space for content
      const maxTotalLength = singleLimit + (maxParts - 1) * multiLimit;
      const fixedTextLength = fullPrefix.length + optOutText.length + complianceText.length;
      const maxContentLength = maxTotalLength - fixedTextLength;
      
      // Truncate ONLY content, preserve prefix and compliance text
      const truncatedContent = content.substring(0, Math.max(0, maxContentLength));
      const truncatedMessage = `${fullPrefix}${truncatedContent}${optOutText}${complianceText}`;
      
      return {
        fullMessage: truncatedMessage,
        estimatedParts: this.calculateParts(truncatedMessage),
        encoding,
        willBeConcatenated: this.calculateParts(truncatedMessage) > 1
      };
    }
    
    return {
      fullMessage,
      estimatedParts,
      encoding,
      willBeConcatenated: estimatedParts > 1
    };
  }
}

