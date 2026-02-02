// Word lists for generating memorable passwords
const adjectives = [
  'blue', 'red', 'green', 'gold', 'silver', 'happy', 'swift', 'bright',
  'cool', 'warm', 'bold', 'calm', 'fresh', 'sharp', 'sunny', 'clear',
  'grand', 'prime', 'noble', 'royal', 'vivid', 'quick', 'smart', 'brave'
];

const nouns = [
  'river', 'tiger', 'eagle', 'ocean', 'storm', 'falcon', 'summit', 'valley',
  'forest', 'canyon', 'meadow', 'harbor', 'bridge', 'castle', 'garden', 'temple',
  'beacon', 'anchor', 'arrow', 'shield', 'crown', 'flame', 'frost', 'dawn'
];

/**
 * Generates a simple, human-friendly temporary password
 * Format: adjective-noun-number (e.g., "blue-river-42")
 * 
 * This is intentionally simple for first-time login - users should
 * be prompted to change their password after first login.
 */
export function generateSimplePassword(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 90) + 10; // 10-99
  
  return `${adjective}-${noun}-${number}`;
}

/**
 * @deprecated Use generateSimplePassword() for better UX
 * Kept for backward compatibility
 */
export function generateTempPassword(length: number = 12): string {
  // Redirect to simple password generator
  return generateSimplePassword();
}