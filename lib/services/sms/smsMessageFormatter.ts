/**
 * SMS Message Formatter
 *
 * Handles proper formatting of SMS messages with:
 * - Encoding detection (GSM-7 vs UCS-2/Unicode)
 * - Multi-part message calculation
 * - Compliance text preservation (Option A: full / short / none)
 * - Automatic concatenation support (Telnyx handles this)
 * - Short 3-line structure: headline, detail, CTA with optional emoji
 */

export type ComplianceLevel = 'full' | 'short' | 'none';

export interface SMSMessageParts {
  fullMessage: string;
  estimatedParts: number;
  encoding: 'GSM-7' | 'UCS-2';
  willBeConcatenated: boolean;
}

const DEFAULT_SENDER_PREFIX = 'Trailblaize: ';

const COMPLIANCE = {
  full: ' Turn off sms alerts in app settings.',
  short: 'Turn off in app settings.',
  none: '',
} as const;

function getComplianceSuffix(level: ComplianceLevel): string {
  return COMPLIANCE[level];
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
   * Formats a compliant SMS message ensuring compliance text is never truncated.
   * Supports Option A compliance: full (marketing), short (transactional), or none.
   */
  static formatCompliantMessage(
    content: string,
    options: {
      senderPrefix?: string;
      optOutText?: string;
      complianceText?: string;
      complianceLevel?: ComplianceLevel;
      maxParts?: number;
    } = {}
  ): SMSMessageParts {
    const { senderPrefix = DEFAULT_SENDER_PREFIX, maxParts } = options;
    const complianceSuffix =
      options.optOutText !== undefined && options.complianceText !== undefined
        ? options.optOutText + options.complianceText
        : getComplianceSuffix(options.complianceLevel ?? 'short');

    const fullMessage = `${senderPrefix}${content}${complianceSuffix}`;
    const encoding = this.detectEncoding(fullMessage);
    let estimatedParts = this.calculateParts(fullMessage);

    if (maxParts && estimatedParts > maxParts) {
      const singleLimit = encoding === 'GSM-7' ? this.GSM_7_SINGLE : this.UCS_2_SINGLE;
      const multiLimit = encoding === 'GSM-7' ? this.GSM_7_MULTI : this.UCS_2_MULTI;
      const maxTotalLength = singleLimit + (maxParts - 1) * multiLimit;
      const fixedTextLength = senderPrefix.length + complianceSuffix.length;
      const maxContentLength = maxTotalLength - fixedTextLength;
      const truncatedContent = content.substring(0, Math.max(0, maxContentLength));
      const truncatedMessage = `${senderPrefix}${truncatedContent}${complianceSuffix}`;

      return {
        fullMessage: truncatedMessage,
        estimatedParts: this.calculateParts(truncatedMessage),
        encoding,
        willBeConcatenated: this.calculateParts(truncatedMessage) > 1,
      };
    }

    return {
      fullMessage,
      estimatedParts,
      encoding,
      willBeConcatenated: estimatedParts > 1,
    };
  }

  /**
   * Builds a short 3-line SMS: [emoji] headline / detail / CTA -> link.
   * Target ~120 chars for body; compliance appended per level.
   */
  static formatShortMessage(
    headline: string,
    detail: string,
    ctaText: string,
    ctaUrl: string,
    options: {
      emoji?: string;
      senderPrefix?: string;
      complianceLevel?: ComplianceLevel;
      maxParts?: number;
    } = {}
  ): SMSMessageParts {
    const prefix = options.senderPrefix ?? DEFAULT_SENDER_PREFIX;
    const complianceSuffix = getComplianceSuffix(options.complianceLevel ?? 'short');
    const emojiPart = options.emoji ? `${options.emoji} ` : '';
    const body = `${emojiPart}${headline}\n${detail}\n${ctaText} ➲ ${ctaUrl}`;
    const content = `${prefix}${body}${complianceSuffix}`;

    const encoding = this.detectEncoding(content);
    const estimatedParts = this.calculateParts(content);

    return {
      fullMessage: content,
      estimatedParts,
      encoding,
      willBeConcatenated: estimatedParts > 1,
    };
  }
  
  /**
   * Formats announcement SMS with title and content. Use complianceLevel 'full' for
   * marketing/broadcast announcements (Option A).
   */
  static formatAnnouncementMessage(
    title: string,
    content: string,
    options: {
      optOutText?: string;
      complianceText?: string;
      complianceLevel?: ComplianceLevel;
      senderPrefix?: string;
      maxParts?: number;
    } = {}
  ): SMSMessageParts {
    const prefix = options.senderPrefix ?? DEFAULT_SENDER_PREFIX;
    const complianceSuffix =
      options.optOutText !== undefined && options.complianceText !== undefined
        ? options.optOutText + options.complianceText
        : getComplianceSuffix(options.complianceLevel ?? 'full');
    const titlePrefix = `${prefix}${title}: `;

    const fullMessage = `${titlePrefix}${content}${complianceSuffix}`;
    const encoding = this.detectEncoding(fullMessage);
    let estimatedParts = this.calculateParts(fullMessage);

    if (options.maxParts && estimatedParts > options.maxParts) {
      const singleLimit = encoding === 'GSM-7' ? this.GSM_7_SINGLE : this.UCS_2_SINGLE;
      const multiLimit = encoding === 'GSM-7' ? this.GSM_7_MULTI : this.UCS_2_MULTI;
      const maxTotalLength = singleLimit + (options.maxParts - 1) * multiLimit;
      const fixedTextLength = titlePrefix.length + complianceSuffix.length;
      const maxContentLength = maxTotalLength - fixedTextLength;
      const truncatedContent = content.substring(0, Math.max(0, maxContentLength));
      const truncatedMessage = `${titlePrefix}${truncatedContent}${complianceSuffix}`;

      return {
        fullMessage: truncatedMessage,
        estimatedParts: this.calculateParts(truncatedMessage),
        encoding,
        willBeConcatenated: this.calculateParts(truncatedMessage) > 1,
      };
    }

    return {
      fullMessage,
      estimatedParts,
      encoding,
      willBeConcatenated: estimatedParts > 1,
    };
  }
  
  /**
   * Formats connection notification messages. Use complianceLevel 'short' for transactional.
   */
  static formatConnectionMessage(
    prefix: string,
    content: string,
    options: {
      optOutText?: string;
      complianceText?: string;
      complianceLevel?: ComplianceLevel;
      senderPrefix?: string;
      maxParts?: number;
    } = {}
  ): SMSMessageParts {
    const senderPrefix = options.senderPrefix ?? DEFAULT_SENDER_PREFIX;
    const complianceSuffix =
      options.optOutText !== undefined && options.complianceText !== undefined
        ? options.optOutText + options.complianceText
        : getComplianceSuffix(options.complianceLevel ?? 'short');
    const fullPrefix = `${senderPrefix}${prefix}`;

    const fullMessage = `${fullPrefix}${content}${complianceSuffix}`;
    const encoding = this.detectEncoding(fullMessage);
    let estimatedParts = this.calculateParts(fullMessage);

    if (options.maxParts && estimatedParts > options.maxParts) {
      const singleLimit = encoding === 'GSM-7' ? this.GSM_7_SINGLE : this.UCS_2_SINGLE;
      const multiLimit = encoding === 'GSM-7' ? this.GSM_7_MULTI : this.UCS_2_MULTI;
      const maxTotalLength = singleLimit + (options.maxParts - 1) * multiLimit;
      const fixedTextLength = fullPrefix.length + complianceSuffix.length;
      const maxContentLength = maxTotalLength - fixedTextLength;
      const truncatedContent = content.substring(0, Math.max(0, maxContentLength));
      const truncatedMessage = `${fullPrefix}${truncatedContent}${complianceSuffix}`;

      return {
        fullMessage: truncatedMessage,
        estimatedParts: this.calculateParts(truncatedMessage),
        encoding,
        willBeConcatenated: this.calculateParts(truncatedMessage) > 1,
      };
    }

    return {
      fullMessage,
      estimatedParts,
      encoding,
      willBeConcatenated: estimatedParts > 1,
    };
  }
}

