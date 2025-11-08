export interface Alumni {
  id: string; // This will be the user_id for connection functionality
  alumniId?: string; // Original alumni table ID
  firstName: string;
  lastName: string;
  fullName: string;
  chapter: string;
  industry: string;
  graduationYear: number;
  company: string;
  jobTitle: string;
  email: string | null;
  phone: string | null;
  is_email_public?: boolean;
  is_phone_public?: boolean;
  isEmailPublic?: boolean;  // camelCase version for API response
  isPhonePublic?: boolean;  // camelCase version for API response
  location: string;
  description: string;
  mutualConnections: MutualConnection[];
  mutualConnectionsCount: number;
  avatar?: string;
  verified?: boolean;
  isActivelyHiring?: boolean;
  lastContact?: string;
  tags: string[];
  hasProfile?: boolean; // Indicates if this alumni has a linked profile
  // Simplified activity data - from profiles table
  lastActiveAt?: string;
  lastLoginAt?: string;
}

export interface MutualConnection {
  id?: string; // Optional ID for React keys
  name: string;
  avatar?: string;
}

export const getGraduationYears = (): number[] => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];

  // Generate years from current year down to 2005
  const startYear = currentYear;
  const endYear = currentYear - 20;

  for (let year = startYear; year >= endYear; year--) {
    years.push(year);
  }

  return years;
}

export const graduationYears = getGraduationYears();

export const getEarlierCutoffYear = (): number => {
  const years = getGraduationYears();
  return years[years.length - 1] - 1;
}

export const industries = [
  "Technology",
  "Finance", 
  "Consulting",
  "Healthcare",
  "Education",
  "Marketing",
  "Sales",
  "Legal",
  "Non-profit"
];

export const chapters = [
  "Sigma Chi",
  "Delta Gamma", 
  "Kappa Alpha",
  "Phi Mu",
  "Pi Kappa Alpha",
  "Alpha Delta Pi",
  "Sigma Nu",
  "Delta Delta Delta"
];

export const locations = [
  "Jackson, MS",
  "Oxford, MS", 
  "Atlanta, GA",
  "Dallas, TX",
  "Nashville, TN",
  "Birmingham, AL",
  "Memphis, TN",
  "New Orleans, LA"
]; 