import { z } from 'zod';

// ============================================================================
// Onboarding Step Definitions
// ============================================================================

export type OnboardingStep = 
    'linkedin-import'
  | 'profile-basics'
  | 'profile-photo'
  | 'notifications'
  | 'complete';

export const ONBOARDING_STEPS: OnboardingStep[] = [
  'linkedin-import',     
  'profile-basics',      
  'profile-photo',
  'notifications',
  'complete',
];

export const STEP_CONFIG: Record<OnboardingStep, {
  title: string;
  description: string;
  path: string;
  optional: boolean;
  order: number;
}> = {
  'linkedin-import': {
    title: 'Import from LinkedIn',
    description: 'Quickly fill your profile',
    path: '/onboarding/steps/linkedin-import',
    optional: true,
    order: 1,  // Changed from 3
  },
  'profile-basics': {
    title: 'Profile Basics',
    description: 'Tell us about yourself',
    path: '/onboarding/steps/profile-basics',
    optional: false,
    order: 2,  // Changed from 1
  },
  'profile-photo': {
    title: 'Profile Photo',
    description: 'Add a profile picture',
    path: '/onboarding/steps/profile-photo',
    optional: true,
    order: 3,  // Changed from 2
  },
  'notifications': {
    title: 'Notifications',
    description: 'Set your preferences',
    path: '/onboarding/steps/notifications',
    optional: false,
    order: 4,
  },
  'complete': {
    title: 'All Done!',
    description: 'Welcome to Trailblaize',
    path: '/onboarding/complete',
    optional: false,
    order: 5,
  },
};

// ============================================================================
// Onboarding State
// ============================================================================

export interface OnboardingState {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  skippedSteps: OnboardingStep[];
  isComplete: boolean;
}

export interface OnboardingProgress {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  skippedSteps: OnboardingStep[];
  startedAt: string;
  completedAt?: string;
}

// ============================================================================
// Profile Basics Form Data
// ============================================================================

export interface ProfileBasicsFormData {
  firstName: string;
  lastName: string;
  chapter: string;
  chapterId: string;
  role: 'alumni' | 'active_member';
  graduationYear: number;
  major?: string;
  // Alumni-specific fields
  company?: string;
  jobTitle?: string;
  industry?: string;
  location?: string;
}

export const profileBasicsSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  chapter: z.string().min(1, 'Chapter is required'),
  chapterId: z.string().min(1, 'Chapter ID is required'),
  role: z.enum(['alumni', 'active_member']),
  graduationYear: z.number()
    .min(1950, 'Invalid graduation year')
    .max(new Date().getFullYear() + 10, 'Invalid graduation year'),
  major: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
});

// ============================================================================
// Notification Preferences
// ============================================================================

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  // Specific notification types
  connectionRequests: boolean;
  messages: boolean;
  announcements: boolean;
  events: boolean;
  weeklyDigest: boolean;
}

export const notificationPreferencesSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  connectionRequests: z.boolean(),
  messages: z.boolean(),
  announcements: z.boolean(),
  events: z.boolean(),
  weeklyDigest: z.boolean(),
});

// ============================================================================
// Helper Functions
// ============================================================================

export function getStepIndex(step: OnboardingStep): number {
  return ONBOARDING_STEPS.indexOf(step);
}

export function getNextStep(currentStep: OnboardingStep): OnboardingStep | null {
  const currentIndex = getStepIndex(currentStep);
  if (currentIndex === -1 || currentIndex >= ONBOARDING_STEPS.length - 1) {
    return null;
  }
  return ONBOARDING_STEPS[currentIndex + 1];
}

export function getPreviousStep(currentStep: OnboardingStep): OnboardingStep | null {
  const currentIndex = getStepIndex(currentStep);
  if (currentIndex <= 0) {
    return null;
  }
  return ONBOARDING_STEPS[currentIndex - 1];
}

export function isStepComplete(
  step: OnboardingStep,
  completedSteps: OnboardingStep[],
  skippedSteps: OnboardingStep[]
): boolean {
  return completedSteps.includes(step) || skippedSteps.includes(step);
}

export function canAccessStep(
  step: OnboardingStep,
  completedSteps: OnboardingStep[],
  skippedSteps: OnboardingStep[]
): boolean {
  const stepIndex = getStepIndex(step);
  if (stepIndex === 0) return true;
  
  // Check all previous steps are complete or skipped
  for (let i = 0; i < stepIndex; i++) {
    const prevStep = ONBOARDING_STEPS[i];
    if (!isStepComplete(prevStep, completedSteps, skippedSteps)) {
      return false;
    }
  }
  return true;
}
