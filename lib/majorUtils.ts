import { majors, minors } from './alumniConstants';

/**
 * Maps free-text major input to the closest matching preset major
 * This handles existing free-text data in the database
 */
export function normalizeMajor(majorInput: string | null | undefined): string | null {
  if (!majorInput) return null;
  
  const normalized = majorInput.trim();
  if (!normalized) return null;
  
  // Exact match (case-insensitive)
  const exactMatch = majors.find(
    major => major.toLowerCase() === normalized.toLowerCase()
  );
  if (exactMatch) return exactMatch;
  
  // Fuzzy matching for common variations
  const lowerInput = normalized.toLowerCase();
  
  // Computer Science variations
  if (['cs', 'computer science', 'comp sci', 'computing', 'software engineering'].some(v => lowerInput.includes(v))) {
    return 'Computer Science';
  }
  
  // Business Administration variations
  if (['business', 'business admin', 'business administration', 'biz admin', 'management'].some(v => lowerInput.includes(v))) {
    return 'Business Administration';
  }
  
  // Engineering variations
  if (['engineering', 'eng', 'engr'].some(v => lowerInput.includes(v))) {
    // Try to match specific engineering type
    if (lowerInput.includes('mechanical')) return 'Mechanical Engineering';
    if (lowerInput.includes('electrical')) return 'Electrical Engineering';
    if (lowerInput.includes('civil')) return 'Civil Engineering';
    if (lowerInput.includes('chemical')) return 'Chemical Engineering';
    if (lowerInput.includes('computer')) return 'Computer Engineering';
    if (lowerInput.includes('biomedical')) return 'Biomedical Engineering';
    if (lowerInput.includes('aerospace')) return 'Aerospace Engineering';
    if (lowerInput.includes('environmental')) return 'Environmental Engineering';
    if (lowerInput.includes('industrial')) return 'Industrial Engineering';
    if (lowerInput.includes('agricultural')) return 'Agricultural Engineering';
  }
  
  // Finance variations
  if (['finance', 'financial', 'fin'].some(v => lowerInput.includes(v))) {
    return 'Finance';
  }
  
  // Marketing variations
  if (['marketing', 'mktg', 'mkt'].some(v => lowerInput.includes(v))) {
    return 'Marketing';
  }
  
  // Communications variations
  if (['communications', 'comm', 'communication'].some(v => lowerInput.includes(v))) {
    return 'Communications';
  }
  
  // Psychology variations
  if (['psychology', 'psych', 'psy'].some(v => lowerInput.includes(v))) {
    return 'Psychology';
  }
  
  // Biology variations
  if (['biology', 'bio', 'biological sciences'].some(v => lowerInput.includes(v))) {
    return 'Biology';
  }
  
  // If no match found, return null (will fall back to partial matching)
  return null;
}

/**
 * Maps free-text minor input to the closest matching preset minor
 */
export function normalizeMinor(minorInput: string | null | undefined): string | null {
  if (!minorInput) return null;
  
  const normalized = minorInput.trim();
  if (!normalized) return null;
  
  // Exact match (case-insensitive)
  const exactMatch = minors.find(
    minor => minor.toLowerCase() === normalized.toLowerCase()
  );
  if (exactMatch) return exactMatch;
  
  // Fuzzy matching similar to majors
  const lowerInput = normalized.toLowerCase();
  
  if (['business', 'business admin'].some(v => lowerInput.includes(v))) {
    return 'Business';
  }
  
  if (['computer science', 'cs', 'comp sci'].some(v => lowerInput.includes(v))) {
    return 'Computer Science';
  }
  
  if (['psychology', 'psych'].some(v => lowerInput.includes(v))) {
    return 'Psychology';
  }
  
  return null;
}

/**
 * Checks if a major value matches a preset major (case-insensitive)
 */
export function isPresetMajor(major: string | null | undefined): boolean {
  if (!major) return false;
  return majors.some(m => m.toLowerCase() === major.trim().toLowerCase());
}

/**
 * Checks if a minor value matches a preset minor (case-insensitive)
 */
export function isPresetMinor(minor: string | null | undefined): boolean {
  if (!minor) return false;
  return minors.some(m => m.toLowerCase() === minor.trim().toLowerCase());
}

/**
 * Gets all preset majors
 */
export function getPresetMajors(): string[] {
  return [...majors];
}

/**
 * Gets all preset minors
 */
export function getPresetMinors(): string[] {
  return [...minors];
}