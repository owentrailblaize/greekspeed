import {
  ParsedLinkedInData,
  ParsedExperience,
  ParsedEducation,
  ImportConfidence,
  ConfidenceLevel,
} from '@/types/profile-import';

// ============================================================================
// LinkedIn PDF Parser v1
// Extracts structured data from LinkedIn PDF text
// ============================================================================

// --- Section Markers ---
const SECTION_MARKERS = {
  experience: /^Experience$/m,
  education: /^Education$/m,
  skills: /^Skills$/m,
  about: /^About$/m,
  contact: /^Contact$/m,
  topSkills: /^Top Skills$/m,
  certifications: /^Certifications$/m,
  languages: /^Languages$/m,
  honors: /^Honors/m,
};

// --- Date Patterns ---
const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

const MONTH_ABBREV = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
];

// Matches: "January 2020 - Present", "Jan 2020 - Dec 2023", "2020 - Present", "2020 - 2023"
const DATE_RANGE_PATTERNS = [
  // "January 2020 - December 2023" or "January 2020 - Present"
  /(\w+)\s+(\d{4})\s*[-–—]\s*(\w+)\s+(\d{4})/i,
  /(\w+)\s+(\d{4})\s*[-–—]\s*Present/i,
  // "2020 - 2023" or "2020 - Present"
  /(\d{4})\s*[-–—]\s*(\d{4})/,
  /(\d{4})\s*[-–—]\s*Present/i,
];

// Duration pattern: "(2 years 3 months)" or "(5 months)"
const DURATION_PATTERN = /\((\d+)\s*years?\s*(\d+)?\s*months?\)|\((\d+)\s*months?\)/i;

// ============================================================================
// Location Validation Data
// ============================================================================

// US State names and abbreviations
const US_STATES: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
  'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
  'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia',
};

// Common countries (for international users)
const COUNTRIES = [
  'United States', 'USA', 'US', 'Canada', 'United Kingdom', 'UK', 'England',
  'Australia', 'Germany', 'France', 'Spain', 'Italy', 'Netherlands', 'Ireland',
  'India', 'China', 'Japan', 'Brazil', 'Mexico', 'Singapore', 'Hong Kong',
  'Switzerland', 'Sweden', 'Norway', 'Denmark', 'Belgium', 'Austria',
  'New Zealand', 'South Africa', 'Israel', 'UAE', 'Dubai', 'Poland',
  'Portugal', 'Greece', 'Czech Republic', 'Finland', 'Philippines',
];

// Canadian provinces
const CA_PROVINCES = [
  'Ontario', 'ON', 'Quebec', 'QC', 'British Columbia', 'BC', 'Alberta', 'AB',
  'Manitoba', 'MB', 'Saskatchewan', 'SK', 'Nova Scotia', 'NS',
  'New Brunswick', 'NB', 'Newfoundland', 'NL', 'Prince Edward Island', 'PE',
];

// Common US metro areas/regions LinkedIn uses (without explicit state)
const KNOWN_METRO_AREAS = [
  'Tampa Bay', 'San Francisco Bay', 'Bay Area', 'Silicon Valley',
  'Research Triangle', 'Twin Cities', 'Tri-State', 'Inland Empire',
  'Hampton Roads', 'Piedmont Triad', 'Lehigh Valley', 'Gold Coast',
  'Space Coast', 'Treasure Coast', 'Sun Coast', 'Palm Beach',
  'Central Florida', 'South Florida', 'North Texas', 'DFW',
  'DMV', 'SoCal', 'NorCal', 'Chicagoland', 'Puget Sound',
];

// Major US cities that LinkedIn might list without state
const MAJOR_US_CITIES = [
  'New York City', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
  'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
  'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte',
  'Indianapolis', 'San Francisco', 'Seattle', 'Denver', 'Washington',
  'Boston', 'Nashville', 'Detroit', 'Portland', 'Las Vegas',
  'Memphis', 'Louisville', 'Baltimore', 'Milwaukee', 'Albuquerque',
  'Tucson', 'Fresno', 'Sacramento', 'Atlanta', 'Miami', 'Tampa',
  'Orlando', 'Pittsburgh', 'Cincinnati', 'Cleveland', 'Raleigh',
  'Minneapolis', 'St. Louis', 'New Orleans', 'Kansas City', 'Salt Lake City',
];

// ============================================================================
// Location Validation Functions
// ============================================================================

/**
 * Check if text contains a valid US state (name or abbreviation)
 */
function containsUSState(text: string): boolean {
  const upperText = text.toUpperCase();
  const lowerText = text.toLowerCase();

  // Check for state abbreviations (at word boundary)
  for (const abbrev of Object.keys(US_STATES)) {
    const abbrevPattern = new RegExp(`\\b${abbrev}\\b`, 'i');
    if (abbrevPattern.test(upperText)) {
      return true;
    }
  }

  // Check for full state names
  for (const stateName of Object.values(US_STATES)) {
    if (lowerText.includes(stateName.toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * Check if text contains a valid country name
 */
function containsCountry(text: string): boolean {
  const lowerText = text.toLowerCase();
  return COUNTRIES.some(country => lowerText.includes(country.toLowerCase()));
}

/**
 * Check if text contains a Canadian province
 */
function containsCanadianProvince(text: string): boolean {
  const upperText = text.toUpperCase();
  const lowerText = text.toLowerCase();

  for (const province of CA_PROVINCES) {
    if (province.length === 2) {
      const pattern = new RegExp(`\\b${province}\\b`, 'i');
      if (pattern.test(upperText)) return true;
    } else {
      if (lowerText.includes(province.toLowerCase())) return true;
    }
  }
  return false;
}

/**
 * Check if text matches a metro area pattern (e.g., "Greater Tampa Bay Area")
 */
function isMetroAreaFormat(text: string): boolean {
  const lowerText = text.toLowerCase();

  // Pattern: "Greater [City/Region] Area"
  if (/^greater\s+[\w\s]+\s+area$/i.test(text)) {
    return true;
  }

  // Pattern: "[City] Metropolitan Area" or "[City] Metro Area"
  if (/[\w\s]+\s+metro(politan)?\s+area$/i.test(text)) {
    return true;
  }

  // Pattern: "[City] Area" (simple, with word limit)
  if (/^[\w\s]+\s+area$/i.test(text) && text.split(/\s+/).length <= 4) {
    return true;
  }

  // Check for known metro areas
  if (KNOWN_METRO_AREAS.some(metro => lowerText.includes(metro.toLowerCase()))) {
    return true;
  }

  // Check for major US cities (might be listed without state)
  if (MAJOR_US_CITIES.some(city => lowerText === city.toLowerCase())) {
    return true;
  }

  return false;
}

/**
 * Validate if a string looks like a valid location
 */
function isValidLocation(text: string): boolean {
  // Basic length check - locations are typically short
  if (text.length > 60 || text.length < 3) return false;

  // Check word count - real locations usually have 2-6 words max
  const words = text.split(/\s+/);
  if (words.length > 6) return false;

  // Option 1: Metro area format (e.g., "Greater Tampa Bay Area") - check first
  if (isMetroAreaFormat(text)) {
    return true;
  }

  // Option 2: Standard "City, State" format - MUST have comma AND real state/country
  // This is the primary validation for most locations
  if (text.includes(',')) {
    // Split by comma and check that the part AFTER comma contains a valid state/country
    const parts = text.split(',').map(p => p.trim());

    // The state/country should be in the latter part(s), not the city name
    const afterComma = parts.slice(1).join(', ');

    if (containsUSState(afterComma) || containsCountry(afterComma) || containsCanadianProvince(afterComma)) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// Main Parser Function
// ============================================================================

export interface ParseResult {
  data: ParsedLinkedInData;
  confidence: ImportConfidence;
}

/**
 * Parse LinkedIn PDF text into structured data
 */
export function parseLinkedInPdf(text: string): ParseResult {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Extract sections
  const sections = extractSections(text);

  // Parse header (name, headline, location)
  const header = parseHeader(lines, sections);

  // Parse experiences
  const experiences = parseExperiences(sections.experience || '');

  // Parse education
  const education = parseEducation(sections.education || '');

  // Parse skills
  const skills = parseSkills(sections.skills || '', sections.topSkills || '');

  // Build parsed data
  const data: ParsedLinkedInData = {
    fullName: header.fullName,
    headline: header.headline,
    location: header.location,
    experiences,
    education,
    skills,
  };

  // Calculate confidence scores
  const confidence = calculateConfidence(data);

  return { data, confidence };
}

// ============================================================================
// Section Extraction
// ============================================================================

interface Sections {
  header: string;
  experience: string;
  education: string;
  skills: string;
  topSkills: string;
  about: string;
  contact: string;
  [key: string]: string;
}

/**
 * Split text into sections based on markers
 */
function extractSections(text: string): Sections {
  const sections: Sections = {
    header: '',
    experience: '',
    education: '',
    skills: '',
    topSkills: '',
    about: '',
    contact: '',
  };

  // Find all section positions
  const sectionPositions: { name: string; start: number; end: number }[] = [];

  for (const [name, pattern] of Object.entries(SECTION_MARKERS)) {
    const match = text.match(pattern);
    if (match && match.index !== undefined) {
      sectionPositions.push({
        name,
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  // Sort by position
  sectionPositions.sort((a, b) => a.start - b.start);

  // Extract header (everything before first section)
  if (sectionPositions.length > 0) {
    sections.header = text.slice(0, sectionPositions[0].start).trim();
  } else {
    sections.header = text;
  }

  // Extract each section's content
  for (let i = 0; i < sectionPositions.length; i++) {
    const current = sectionPositions[i];
    const next = sectionPositions[i + 1];

    const contentStart = current.end;
    const contentEnd = next ? next.start : text.length;

    sections[current.name] = text.slice(contentStart, contentEnd).trim();
  }

  return sections;
}

// ============================================================================
// Header Parsing (Name, Headline, Location)
// ============================================================================

interface HeaderInfo {
  fullName?: string;
  headline?: string;
  location?: string;
}

/**
 * Parse name, headline, and location from header section
 */
function parseHeader(lines: string[], sections: Sections): HeaderInfo {
  const header: HeaderInfo = {};
  const headerText = sections.header || '';
  const headerLines = headerText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Skip page markers, contact info, skills
  const skipPatterns = [
    /^Page \d+ of \d+$/i,
    /^Contact$/i,
    /^Top Skills$/i,
    /^Summary$/i,
    /^Certifications$/i,
    /linkedin\.com/i,
    /^www\./i,
    /^\(/,  // Parenthetical notes like "(Mobile)"
    /\@/,  // Email addresses
    /^\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/,  // Phone numbers
    /^\d+/,  // Lines starting with numbers
    /\.com/i,  // URLs
    /\.edu/i,
    /\.org/i,
  ];

  // Known skill/certification keywords to skip
  const skillKeywords = [
    'problem solving', 'leadership', 'building', 'management',
    'certificate', 'certification', 'foundations',
    'orchestration', 'services', 'development', 'engineering',
    'analytics', 'automation', 'architecture', 'design',
    'agile', 'scrum', 'devops', 'cloud', 'data',
    'proactive', 'collaborative', 'relationship',
  ];

  // Collect candidate name lines
  const candidateNames: string[] = [];

  for (const line of headerLines) {
    const lowerLine = line.toLowerCase();

    // Skip if matches skip patterns
    if (skipPatterns.some(p => p.test(line))) continue;

    // Skip if it looks like a skill (single word or skill keyword)
    if (skillKeywords.some(k => lowerLine.includes(k))) continue;

    // Skip very short lines
    if (line.length < 3) continue;

    // Skip lines with special characters that names don't have
    if (/[•·|@#$%^&*()+=\[\]{}:;<>?/\\]/.test(line)) continue;

    // Check if this looks like a proper name:
    // - 2-4 words
    // - Each word starts with uppercase
    // - Only letters, spaces, hyphens, apostrophes
    const words = line.split(/\s+/);
    const isNameLike =
      words.length >= 2 &&
      words.length <= 4 &&
      /^[A-Z][a-zA-Z\-']*$/.test(words[0]) &&  // First word capitalized
      words.every(w => /^[A-Za-z\-'\.]+$/.test(w)) &&  // All words are letters
      words.slice(0, 2).every(w => /^[A-Z]/.test(w));  // First 2 words capitalized

    if (isNameLike) {
      candidateNames.push(line);
    }
  }

  // Take the first name-like candidate
  if (candidateNames.length > 0) {
    header.fullName = candidateNames[0];
  }

  // Build meaningful lines for headline/location (excluding the name)
  const meaningfulLines: string[] = [];
  for (const line of headerLines) {
    const lowerLine = line.toLowerCase();
    if (skipPatterns.some(p => p.test(line))) continue;
    if (line.length < 3) continue;
    if (line === header.fullName) continue;  // Skip the name we already found
    meaningfulLines.push(line);
  }

  // Look for headline (contains " at " or job title patterns)
  for (const line of meaningfulLines) {
    if (line.toLowerCase().includes(' at ')) {
      header.headline = line;
      break;
    }
    // Common title patterns with company context
    if (/\b(manager|director|engineer|developer|analyst|consultant|specialist)\b/i.test(line) &&
      line.length > 15) {  // Headline should be descriptive
      header.headline = line;
      break;
    }
  }

  // Look for location - validate against real states/countries/metro areas
  for (const line of meaningfulLines) {
    // Skip if it's the headline
    if (line === header.headline) continue;

    // Skip lines that contain " at " (likely headline text)
    if (line.toLowerCase().includes(' at ')) continue;

    // Validate that this looks like a real location
    if (isValidLocation(line)) {
      header.location = line;
      break;
    }
  }

  return header;
}

// ============================================================================
// Experience Parsing
// ============================================================================

/**
 * Parse experiences from the Experience section
 */
function parseExperiences(experienceText: string): ParsedExperience[] {
  if (!experienceText.trim()) return [];

  const experiences: ParsedExperience[] = [];
  const lines = experienceText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Skip page markers
  const filteredLines = lines.filter(l => !/^Page \d+ of \d+$/i.test(l));

  let currentExperience: Partial<ParsedExperience> | null = null;
  let currentCompany: string | null = null;
  let descriptionLines: string[] = [];

  for (let i = 0; i < filteredLines.length; i++) {
    const line = filteredLines[i];
    const nextLine = filteredLines[i + 1] || '';

    // Check if this is a date line
    const dateInfo = parseDateRange(line);

    // Check if this is a duration-only line (indicates same company, different role)
    const isDurationLine = DURATION_PATTERN.test(line) && !dateInfo;

    // Check if this looks like a company name (followed by a title or duration)
    const looksLikeCompany = !dateInfo && !isDurationLine &&
      nextLine && (parseDateRange(nextLine) || isLikelyJobTitle(nextLine));

    // Check if this looks like a job title
    const looksLikeTitle = isLikelyJobTitle(line);

    if (dateInfo) {
      // This line has dates - the previous non-date line was likely a title
      if (currentExperience && currentExperience.title && !currentExperience.startYear) {
        // Update current experience with dates
        Object.assign(currentExperience, dateInfo);
      }
    } else if (looksLikeCompany && !looksLikeTitle) {
      // Save previous experience
      if (currentExperience && currentExperience.title && currentExperience.company) {
        currentExperience.description = descriptionLines.join(' ').trim() || undefined;
        experiences.push(currentExperience as ParsedExperience);
      }

      // Start tracking new company
      currentCompany = line;
      currentExperience = null;
      descriptionLines = [];
    } else if (looksLikeTitle && currentCompany) {
      // Save previous experience at same company
      if (currentExperience && currentExperience.title) {
        currentExperience.description = descriptionLines.join(' ').trim() || undefined;
        experiences.push(currentExperience as ParsedExperience);
      }

      // Start new experience
      currentExperience = {
        title: line,
        company: currentCompany,
        isCurrent: false,
      };
      descriptionLines = [];
    } else if (isLocationLine(line) && currentExperience) {
      // This is a location line
      currentExperience.location = line;
    } else if (line.startsWith('-') || line.startsWith('•')) {
      // This is a description bullet
      descriptionLines.push(line.replace(/^[-•]\s*/, ''));
    } else if (currentExperience && currentExperience.startYear) {
      // After we have dates, remaining text might be description
      if (line.length > 20) {
        descriptionLines.push(line);
      }
    }
  }

  // Don't forget the last experience
  if (currentExperience && currentExperience.title && currentExperience.company) {
    currentExperience.description = descriptionLines.join(' ').trim() || undefined;
    experiences.push(currentExperience as ParsedExperience);
  }

  // Mark first experience as current if it says "Present"
  if (experiences.length > 0 && experiences[0].isCurrent === false) {
    // Check if the raw text indicates "Present"
    if (experienceText.toLowerCase().includes('present')) {
      experiences[0].isCurrent = true;
    }
  }

  return experiences;
}

/**
 * Parse date range from a line
 */
function parseDateRange(line: string): Partial<ParsedExperience> | null {
  const lowerLine = line.toLowerCase();

  // Check for "Present"
  const isCurrent = lowerLine.includes('present');

  // Try each date pattern
  for (const pattern of DATE_RANGE_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      const result: Partial<ParsedExperience> = { isCurrent };

      if (match.length === 5) {
        // "Month Year - Month Year"
        result.startMonth = parseMonth(match[1]);
        result.startYear = parseInt(match[2]);
        result.endMonth = parseMonth(match[3]);
        result.endYear = parseInt(match[4]);
      } else if (match.length === 3 && /^\d{4}$/.test(match[1])) {
        // "Year - Year"
        result.startYear = parseInt(match[1]);
        result.endYear = parseInt(match[2]);
      } else if (match.length === 3) {
        // "Month Year - Present"
        result.startMonth = parseMonth(match[1]);
        result.startYear = parseInt(match[2]);
      } else if (match.length === 2 && /^\d{4}$/.test(match[1])) {
        // "Year - Present"
        result.startYear = parseInt(match[1]);
      }

      return result;
    }
  }

  return null;
}

/**
 * Parse month name to number (1-12)
 */
function parseMonth(monthStr: string): number | undefined {
  const lower = monthStr.toLowerCase();

  // Check full month names
  const fullIndex = MONTH_NAMES.findIndex(m => m === lower);
  if (fullIndex !== -1) return fullIndex + 1;

  // Check abbreviated month names
  const abbrevIndex = MONTH_ABBREV.findIndex(m => lower.startsWith(m));
  if (abbrevIndex !== -1) return abbrevIndex + 1;

  return undefined;
}

/**
 * Check if a line looks like a job title
 */
function isLikelyJobTitle(line: string): boolean {
  const titleKeywords = [
    'manager', 'director', 'engineer', 'developer', 'analyst',
    'consultant', 'specialist', 'coordinator', 'assistant',
    'associate', 'senior', 'junior', 'lead', 'head', 'chief',
    'vice president', 'vp', 'president', 'officer', 'executive',
    'intern', 'trainee', 'teacher', 'professor', 'instructor',
    'recruiter', 'recruiting', 'supervisor', 'administrator',
  ];

  const lower = line.toLowerCase();
  return titleKeywords.some(keyword => lower.includes(keyword));
}

/**
 * Check if a line looks like a location
 */
function isLocationLine(line: string): boolean {
  // Pattern: "City, State" or "City, State, Country"
  const locationPattern = /^[A-Za-z\s]+,\s*[A-Za-z\s]+/;

  // Common location indicators
  const locationIndicators = [
    'united states', 'usa', 'uk', 'united kingdom', 'canada',
    'california', 'new york', 'texas', 'florida', 'illinois',
    'north carolina', 'south carolina', 'georgia', 'virginia',
  ];

  const lower = line.toLowerCase();

  if (locationPattern.test(line)) {
    return locationIndicators.some(loc => lower.includes(loc)) ||
      line.split(',').length >= 2;
  }

  return false;
}

// ============================================================================
// Education Parsing
// ============================================================================

/**
 * Parse education entries from Education section
 */
function parseEducation(educationText: string): ParsedEducation[] {
  if (!educationText.trim()) return [];

  const education: ParsedEducation[] = [];
  const lines = educationText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Skip page markers
  const filteredLines = lines.filter(l => !/^Page \d+ of \d+$/i.test(l));

  let currentEducation: Partial<ParsedEducation> | null = null;

  for (let i = 0; i < filteredLines.length; i++) {
    const line = filteredLines[i];

    // Check if this line has years (indicates education dates)
    const yearMatch = line.match(/\(?\s*(\d{4})\s*[-–—]\s*(\d{4})\s*\)?/);
    const singleYearMatch = line.match(/\(?\s*(\d{4})\s*\)?$/);

    // Check if line contains degree indicators
    const hasDegreeIndicator = /\b(bachelor|master|phd|doctor|associate|certificate|diploma|b\.?a\.?|b\.?s\.?|m\.?a\.?|m\.?s\.?|m\.?b\.?a\.?)\b/i.test(line);

    if (yearMatch) {
      // This line has year range
      if (currentEducation) {
        currentEducation.startYear = parseInt(yearMatch[1]);
        currentEducation.endYear = parseInt(yearMatch[2]);

        // Check if degree info is on same line
        const beforeYears = line.slice(0, line.indexOf(yearMatch[0])).trim();
        if (beforeYears && !currentEducation.degree) {
          parseDegreeField(beforeYears, currentEducation);
        }
      }
    } else if (singleYearMatch && currentEducation) {
      // Single year (graduation year)
      currentEducation.endYear = parseInt(singleYearMatch[1]);
    } else if (hasDegreeIndicator) {
      // This line contains degree information
      if (currentEducation) {
        parseDegreeField(line, currentEducation);
      }
    } else if (isLikelySchoolName(line)) {
      // Save previous education
      if (currentEducation && currentEducation.school) {
        education.push(currentEducation as ParsedEducation);
      }

      // Start new education entry
      currentEducation = {
        school: line,
      };
    } else if (currentEducation && !currentEducation.degree && line.length > 5) {
      // Might be degree/field info
      parseDegreeField(line, currentEducation);
    }
  }

  // Don't forget the last education
  if (currentEducation && currentEducation.school) {
    education.push(currentEducation as ParsedEducation);
  }

  return education;
}

/**
 * Parse degree and field from a line
 */
function parseDegreeField(line: string, education: Partial<ParsedEducation>): void {
  // Common degree patterns
  const degreePatterns = [
    /Bachelor of (?:Arts|Science|Engineering|Business)/i,
    /Master of (?:Arts|Science|Business|Engineering)/i,
    /B\.?A\.?|B\.?S\.?|M\.?A\.?|M\.?S\.?|M\.?B\.?A\.?|Ph\.?D\.?/i,
    /Associate(?:'s)? (?:Degree|of)/i,
  ];

  for (const pattern of degreePatterns) {
    const match = line.match(pattern);
    if (match) {
      education.degree = match[0];

      // Try to extract field after degree
      const afterDegree = line.slice(line.indexOf(match[0]) + match[0].length);
      const fieldMatch = afterDegree.match(/,?\s*([A-Za-z\s&;]+)/);
      if (fieldMatch && fieldMatch[1].trim().length > 2) {
        education.field = fieldMatch[1].trim().replace(/^,\s*/, '');
      }
      return;
    }
  }

  // If no degree pattern found, might just be the field
  if (!education.field && line.length > 3) {
    // Remove common noise
    const cleaned = line.replace(/Minor\s*·?/i, '').replace(/\(.*?\)/g, '').trim();
    if (cleaned.length > 3) {
      education.field = cleaned;
    }
  }
}

/**
 * Check if a line looks like a school name
 */
function isLikelySchoolName(line: string): boolean {
  const schoolIndicators = [
    'university', 'college', 'institute', 'school', 'academy',
    'polytechnic', 'community college',
  ];

  const lower = line.toLowerCase();
  return schoolIndicators.some(indicator => lower.includes(indicator));
}

// ============================================================================
// Skills Parsing
// ============================================================================

/**
 * Parse skills from Skills and Top Skills sections
 */
function parseSkills(skillsText: string, topSkillsText: string): string[] {
  const skills: Set<string> = new Set();

  // Parse top skills first
  if (topSkillsText) {
    const topSkillLines = topSkillsText.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 2 && !/^Page \d+ of \d+$/i.test(l));

    for (const line of topSkillLines) {
      // Skip section headers and noise
      if (!line.toLowerCase().includes('skills') && !line.includes('·')) {
        skills.add(line);
      }
    }
  }

  // Parse skills section
  if (skillsText) {
    const skillLines = skillsText.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 2 && !/^Page \d+ of \d+$/i.test(l));

    for (const line of skillLines) {
      // Skip endorsement counts and section headers
      if (!/^\d+$/.test(line) && !line.toLowerCase().includes('endorsement')) {
        skills.add(line);
      }
    }
  }

  return Array.from(skills).slice(0, 20); // Limit to 20 skills
}

// ============================================================================
// Confidence Calculation
// ============================================================================

/**
 * Calculate confidence scores for parsed data
 */
function calculateConfidence(data: ParsedLinkedInData): ImportConfidence {
  const fields: Record<string, ConfidenceLevel> = {};
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  // Name confidence
  if (data.fullName) {
    const words = data.fullName.split(/\s+/);
    if (words.length >= 2 && words.length <= 4) {
      fields.fullName = 'high';
      highCount++;
    } else {
      fields.fullName = 'medium';
      mediumCount++;
    }
  } else {
    fields.fullName = 'low';
    lowCount++;
  }

  // Headline confidence
  if (data.headline && data.headline.toLowerCase().includes(' at ')) {
    fields.headline = 'high';
    highCount++;
  } else if (data.headline) {
    fields.headline = 'medium';
    mediumCount++;
  } else {
    fields.headline = 'low';
    lowCount++;
  }

  // Location confidence
  if (data.location && data.location.includes(',')) {
    fields.location = 'high';
    highCount++;
  } else if (data.location) {
    fields.location = 'medium';
    mediumCount++;
  } else {
    fields.location = 'low';
    lowCount++;
  }

  // Current experience confidence
  if (data.experiences.length > 0) {
    const current = data.experiences[0];

    // Title confidence
    if (current.title && isLikelyJobTitle(current.title)) {
      fields.currentTitle = 'high';
      highCount++;
    } else if (current.title) {
      fields.currentTitle = 'medium';
      mediumCount++;
    } else {
      fields.currentTitle = 'low';
      lowCount++;
    }

    // Company confidence
    if (current.company && current.company.length > 2) {
      fields.currentCompany = 'high';
      highCount++;
    } else {
      fields.currentCompany = 'low';
      lowCount++;
    }

    // Dates confidence
    if (current.startYear && current.startMonth) {
      fields.experienceDates = 'high';
      highCount++;
    } else if (current.startYear) {
      fields.experienceDates = 'medium';
      mediumCount++;
    } else {
      fields.experienceDates = 'low';
      lowCount++;
    }
  } else {
    fields.currentTitle = 'low';
    fields.currentCompany = 'low';
    fields.experienceDates = 'low';
    lowCount += 3;
  }

  // Education confidence
  if (data.education.length > 0) {
    const edu = data.education[0];

    if (edu.school && edu.endYear) {
      fields.education = 'high';
      highCount++;
    } else if (edu.school) {
      fields.education = 'medium';
      mediumCount++;
    } else {
      fields.education = 'low';
      lowCount++;
    }
  } else {
    fields.education = 'low';
    lowCount++;
  }

  // Calculate overall confidence
  let overall: ConfidenceLevel;
  const total = highCount + mediumCount + lowCount;

  if (highCount >= total * 0.7) {
    overall = 'high';
  } else if (lowCount >= total * 0.5) {
    overall = 'low';
  } else {
    overall = 'medium';
  }

  return { overall, fields };
}

// ============================================================================
// Export
// ============================================================================

export { parseLinkedInPdf as default };
