import { Alumni } from '@/lib/mockAlumni';
import { Profile } from '@/types/profile';

export interface ProfileCompletenessScore {
  totalScore: number;
  maxScore: number;
  percentage: number;
  breakdown: {
    basicInfo: number;
    professionalInfo: number;
    contactInfo: number;
    socialInfo: number;
    verification: number;
  };
  missingFields: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface AlumniWithCompleteness extends Alumni {
  completenessScore: ProfileCompletenessScore;
}

/**
 * Calculate profile completeness score for alumni
 * Higher scores indicate more complete profiles
 */
export function calculateAlumniCompleteness(alumni: Alumni): ProfileCompletenessScore {
  const scores = {
    basicInfo: 0,
    professionalInfo: 0,
    contactInfo: 0,
    socialInfo: 0,
    verification: 0
  };

  const missingFields: string[] = [];
  const maxScores = {
    basicInfo: 25,    // Name, chapter, graduation year
    professionalInfo: 30, // Job title, company, industry
    contactInfo: 20,     // Email, phone, location
    socialInfo: 15,      // Bio, avatar, mutual connections
    verification: 10     // Verified status, profile completeness
  };

  // Basic Information (25 points max)
  if (isValidField(alumni.fullName)) {
    scores.basicInfo += 10;
  } else {
    missingFields.push('Full Name');
  }

  if (isValidField(alumni.chapter)) {
    scores.basicInfo += 8;
  } else {
    missingFields.push('Chapter');
  }

  if (isValidField(alumni.graduationYear)) {
    scores.basicInfo += 7;
  } else {
    missingFields.push('Graduation Year');
  }

  // Professional Information (30 points max)
  if (isValidField(alumni.jobTitle)) {
    scores.professionalInfo += 12;
  } else {
    missingFields.push('Job Title');
  }

  if (isValidField(alumni.company)) {
    scores.professionalInfo += 10;
  } else {
    missingFields.push('Company');
  }

  if (isValidField(alumni.industry)) {
    scores.professionalInfo += 8;
  } else {
    missingFields.push('Industry');
  }

  // Contact Information (20 points max)
  if (isValidField(alumni.email)) {
    scores.contactInfo += 10;
  } else {
    missingFields.push('Email');
  }

  if (isValidField(alumni.phone)) {
    scores.contactInfo += 6;
  } else {
    missingFields.push('Phone');
  }

  if (isValidField(alumni.location)) {
    scores.contactInfo += 4;
  } else {
    missingFields.push('Location');
  }

  // Social Information (15 points max)
  if (isValidField(alumni.description)) {
    scores.socialInfo += 8;
  } else {
    missingFields.push('Bio/Description');
  }

  if (isValidField(alumni.avatar)) {
    scores.socialInfo += 4;
  } else {
    missingFields.push('Profile Picture');
  }

  if (alumni.mutualConnectionsCount > 0) {
    scores.socialInfo += 3;
  }

  // Verification (10 points max)
  if (alumni.verified) {
    scores.verification += 5;
  }

  if (alumni.hasProfile) {
    scores.verification += 5;
  }

  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const maxScore = Object.values(maxScores).reduce((sum, score) => sum + score, 0);
  const percentage = Math.round((totalScore / maxScore) * 100);

  // Determine priority based on completeness
  let priority: 'high' | 'medium' | 'low';
  if (percentage >= 80) {
    priority = 'high';
  } else if (percentage >= 60) {
    priority = 'medium';
  } else {
    priority = 'low';
  }

  return {
    totalScore,
    maxScore,
    percentage,
    breakdown: scores,
    missingFields,
    priority
  };
}

/**
 * Calculate profile completeness for regular profiles
 */
export function calculateProfileCompleteness(profile: Profile): ProfileCompletenessScore {
  const scores = {
    basicInfo: 0,
    professionalInfo: 0,
    contactInfo: 0,
    socialInfo: 0,
    verification: 0
  };

  const missingFields: string[] = [];
  const maxScores = {
    basicInfo: 30,    // Name, chapter, role, graduation year
    professionalInfo: 20, // Major, minor, GPA
    contactInfo: 25,     // Email, phone, location, hometown
    socialInfo: 15,      // Bio, avatar, banner
    verification: 10     // Developer status, access level
  };

  // Basic Information (30 points max)
  if (isValidField(profile.full_name)) {
    scores.basicInfo += 10;
  } else {
    missingFields.push('Full Name');
  }

  if (isValidField(profile.chapter)) {
    scores.basicInfo += 8;
  } else {
    missingFields.push('Chapter');
  }

  if (isValidField(profile.role)) {
    scores.basicInfo += 7;
  } else {
    missingFields.push('Role');
  }

  if (isValidField(profile.grad_year)) {
    scores.basicInfo += 5;
  } else {
    missingFields.push('Graduation Year');
  }

  // Professional Information (20 points max)
  if (isValidField(profile.major)) {
    scores.professionalInfo += 8;
  } else {
    missingFields.push('Major');
  }

  if (isValidField(profile.minor)) {
    scores.professionalInfo += 6;
  } else {
    missingFields.push('Minor');
  }

  if (isValidField(profile.gpa)) {
    scores.professionalInfo += 6;
  } else {
    missingFields.push('GPA');
  }

  // Contact Information (25 points max)
  if (isValidField(profile.email)) {
    scores.contactInfo += 10;
  } else {
    missingFields.push('Email');
  }

  if (isValidField(profile.phone)) {
    scores.contactInfo += 8;
  } else {
    missingFields.push('Phone');
  }

  if (isValidField(profile.location)) {
    scores.contactInfo += 4;
  } else {
    missingFields.push('Location');
  }

  if (isValidField(profile.hometown)) {
    scores.contactInfo += 3;
  } else {
    missingFields.push('Hometown');
  }

  // Social Information (15 points max)
  if (isValidField(profile.bio)) {
    scores.socialInfo += 8;
  } else {
    missingFields.push('Bio');
  }

  if (isValidField(profile.avatar_url)) {
    scores.socialInfo += 4;
  } else {
    missingFields.push('Profile Picture');
  }

  if (isValidField(profile.banner_url)) {
    scores.socialInfo += 3;
  } else {
    missingFields.push('Banner Image');
  }

  // Verification (10 points max)
  if (profile.is_developer) {
    scores.verification += 5;
  }

  if (profile.access_level && profile.access_level !== 'standard') {
    scores.verification += 5;
  }

  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const maxScore = Object.values(maxScores).reduce((sum, score) => sum + score, 0);
  const percentage = Math.round((totalScore / maxScore) * 100);

  // Determine priority based on completeness
  let priority: 'high' | 'medium' | 'low';
  if (percentage >= 80) {
    priority = 'high';
  } else if (percentage >= 60) {
    priority = 'medium';
  } else {
    priority = 'low';
  }

  return {
    totalScore,
    maxScore,
    percentage,
    breakdown: scores,
    missingFields,
    priority
  };
}

/**
 * Sort alumni by completeness score (highest first)
 */
export function sortAlumniByCompleteness(alumni: Alumni[]): AlumniWithCompleteness[] {
  return alumni
    .map(alumni => ({
      ...alumni,
      completenessScore: calculateAlumniCompleteness(alumni)
    }))
    .sort((a, b) => b.completenessScore.totalScore - a.completenessScore.totalScore);
}

/**
 * Helper function to validate field values
 */
function isValidField(value: any): boolean {
  if (!value) return false;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed !== "" && 
           trimmed !== "Not specified" && 
           trimmed !== "N/A" && 
           trimmed !== "Unknown" &&
           trimmed !== "null" &&
           trimmed !== "undefined";
  }
  if (typeof value === 'number') {
    return !isNaN(value) && value > 0;
  }
  return true;
}

/**
 * Get completeness badge color based on score
 */
export function getCompletenessBadgeColor(percentage: number): string {
  if (percentage >= 80) return 'bg-green-100 text-green-800';
  if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

/**
 * Get completeness priority color
 */
export function getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'high': return 'text-green-600';
    case 'medium': return 'text-yellow-600';
    case 'low': return 'text-red-600';
  }
}
