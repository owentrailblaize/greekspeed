/**
 * GSM 7-bit character set utilities
 * Ensures SMS messages are compatible with GSM7 encoding
 */

/**
 * Characters that need to be replaced for GSM7 compatibility
 */
const GSM7_REPLACEMENTS: Record<string, string> = {
  // Curly quotes
  '"': '"',
  '"': '"',
  ''': "'",
  ''': "'",
  // Em dashes
  '—': '-',
  '–': '-',
  // Ellipsis
  '…': '...',
  // Other common non-GSM chars
  '®': '(R)',
  '©': '(C)',
  '™': '(TM)',
};

/**
 * Converts a string to GSM7-safe format
 * Replaces non-GSM characters with closest equivalents
 */
export function toGsmSafe(text: string): string {
  let safe = text;
  
  // Replace known problematic characters
  for (const [char, replacement] of Object.entries(GSM7_REPLACEMENTS)) {
    safe = safe.replace(new RegExp(char, 'g'), replacement);
  }
  
  // Remove any remaining non-GSM characters (keep only ASCII printable + basic GSM extensions)
  // This is a conservative approach - keeps most common characters
  safe = safe.split('').map(char => {
    const code = char.charCodeAt(0);
    // Allow: ASCII printable (32-126), newline (10), carriage return (13)
    // And basic GSM7 extensions (some special chars)
    if (code >= 32 && code <= 126) return char;
    if (code === 10 || code === 13) return char;
    // Replace other chars with space or remove
    return ' ';
  }).join('');
  
  // Clean up multiple spaces
  safe = safe.replace(/\s+/g, ' ').trim();
  
  return safe;
}

/**
 * Checks if a string is GSM7-safe
 * Basic check - not comprehensive but catches most issues
 */
export function isGsmSafe(text: string): boolean {
  // Simple check: no curly quotes, em dashes, or common problematic chars
  const problematicChars = /[""''—–…®©™]/;
  return !problematicChars.test(text);
}

/**
 * Estimates GSM7 segment count for a message
 * GSM7: 160 chars per segment (153 for multipart)
 */
export function estimateGsm7Segments(text: string): number {
  const safe = toGsmSafe(text);
  if (safe.length <= 160) return 1;
  // Multipart: first segment 153 chars, subsequent segments 153 chars each
  return Math.ceil((safe.length - 160) / 153) + 1;
}

