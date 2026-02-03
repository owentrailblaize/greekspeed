import { z } from 'zod';

// ============================================================================
// Profile Import Types
// Used for LinkedIn PDF and Resume import feature during onboarding
// ============================================================================

// --- Source & Status Types ---

export type ImportSource = 'linkedin_pdf' | 'resume_pdf' | 'manual';
export type ImportStatus = 'pending' | 'processing' | 'needs_review' | 'applied' | 'failed' | 'skipped';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

// --- Parsed Data Interfaces ---

/**
 * Represents a single work experience entry parsed from LinkedIn PDF
 */
export interface ParsedExperience {
  title: string;
  company: string;
  startMonth?: number;
  startYear?: number;
  endMonth?: number;
  endYear?: number;
  isCurrent: boolean;
  location?: string;
  description?: string;
}

/**
 * Represents a single education entry parsed from LinkedIn PDF
 */
export interface ParsedEducation {
  school: string;
  degree?: string;
  field?: string;
  startYear?: number;
  endYear?: number;
}

/**
 * The structured data extracted from a LinkedIn PDF
 */
export interface ParsedLinkedInData {
  fullName?: string;
  headline?: string;
  location?: string;
  experiences: ParsedExperience[];
  education: ParsedEducation[];
  skills?: string[];
}

/**
 * Confidence scores for parsed fields
 * Used to highlight uncertain fields in the review UI
 */
export interface ImportConfidence {
  overall: ConfidenceLevel;
  fields: Record<string, ConfidenceLevel>;
}

/**
 * Database record for a profile import job
 */
export interface ProfileImport {
  id: string;
  user_id: string;
  source: ImportSource;
  file_path?: string | null;
  original_filename?: string | null;
  file_size_bytes?: number | null;
  status: ImportStatus;
  parsed_json?: ParsedLinkedInData | null;
  confidence_json?: ImportConfidence | null;
  error_message?: string | null;
  parser_version: string;
  created_at: string;
  applied_at?: string | null;
}

// --- Form Data Interfaces (for Review UI) ---

/**
 * Form data for editing a single experience in the review UI
 */
export interface ExperienceFormData {
  title: string;
  company: string;
  startMonth: string; // Form uses strings for selects
  startYear: string;
  endMonth: string;
  endYear: string;
  isCurrent: boolean;
  location: string;
  description: string;
}

/**
 * Form data for editing education in the review UI
 */
export interface EducationFormData {
  school: string;
  degree: string;
  field: string;
  graduationYear: string;
}

/**
 * Complete form data for the import review page
 * Note: fullName is optional - we use existing profile data, not PDF extraction
 * Note: currentExperience and industry are optional for non-alumni users
 */
export interface ImportReviewFormData {
  fullName?: string; // Optional - displayed read-only from existing profile
  headline?: string;
  location: string;
  industry?: string; // Maps to alumni.industry (optional for active members)
  currentExperience?: ExperienceFormData; // Optional for active members
  education: EducationFormData;
}

/**
 * User role type for conditional form rendering
 */
export type UserRole = 'alumni' | 'active_member' | 'admin' | 'pending';

/**
 * Existing profile data to pre-populate the import review form
 * Used to show current values and highlight LinkedIn suggestions
 */
export interface ExistingProfileData {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  location?: string;
  major?: string;
  gradYear?: number;
  // Alumni-specific fields
  company?: string;
  jobTitle?: string;
  industry?: string;
}

// ============================================================================
// Zod Validation Schemas
// ============================================================================

const currentYear = new Date().getFullYear();
const minYear = 1950;
const maxYear = currentYear + 5; // Allow future graduation dates

/**
 * Schema for validating a parsed experience entry
 */
export const parsedExperienceSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company name is required'),
  startMonth: z.number().min(1).max(12).optional(),
  startYear: z.number().min(minYear).max(maxYear).optional(),
  endMonth: z.number().min(1).max(12).optional(),
  endYear: z.number().min(minYear).max(maxYear).optional(),
  isCurrent: z.boolean(),
  location: z.string().optional(),
  description: z.string().optional(),
});

/**
 * Schema for validating a parsed education entry
 */
export const parsedEducationSchema = z.object({
  school: z.string().min(1, 'School name is required'),
  degree: z.string().optional(),
  field: z.string().optional(),
  startYear: z.number().min(minYear).max(maxYear).optional(),
  endYear: z.number().min(minYear).max(maxYear).optional(),
});

/**
 * Schema for validating the complete parsed LinkedIn data
 */
export const parsedLinkedInDataSchema = z.object({
  fullName: z.string().optional(),
  headline: z.string().optional(),
  location: z.string().optional(),
  experiences: z.array(parsedExperienceSchema),
  education: z.array(parsedEducationSchema),
  skills: z.array(z.string()).optional(),
});

/**
 * Schema for validating confidence scores
 */
export const importConfidenceSchema = z.object({
  overall: z.enum(['high', 'medium', 'low']),
  fields: z.record(z.string(), z.enum(['high', 'medium', 'low'])),
});

/**
 * Schema for validating a profile import record
 */
export const profileImportSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  source: z.enum(['linkedin_pdf', 'resume_pdf', 'manual']),
  file_path: z.string().nullable().optional(),
  original_filename: z.string().nullable().optional(),
  file_size_bytes: z.number().positive().nullable().optional(),
  status: z.enum(['pending', 'processing', 'needs_review', 'applied', 'failed', 'skipped']),
  parsed_json: parsedLinkedInDataSchema.nullable().optional(),
  confidence_json: importConfidenceSchema.nullable().optional(),
  error_message: z.string().nullable().optional(),
  parser_version: z.string(),
  created_at: z.string().datetime(),
  applied_at: z.string().datetime().nullable().optional(),
});

/**
 * Schema for the experience section (alumni only)
 */
export const experienceFormSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company is required'),
  startMonth: z.string().optional(),
  startYear: z.string().optional(),
  endMonth: z.string().optional(),
  endYear: z.string().optional(),
  isCurrent: z.boolean(),
  location: z.string().optional(),
  description: z.string().optional(),
});

/**
 * Schema for the education section
 */
export const educationFormSchema = z.object({
  school: z.string().optional(),
  degree: z.string().optional(),
  field: z.string().optional(),
  graduationYear: z.string().optional(),
});

/**
 * Schema for the review form submission
 * Note: fullName is optional - we use existing profile data
 * Note: industry and currentExperience are optional for non-alumni
 */
export const importReviewFormSchema = z.object({
  fullName: z.string().optional(), // Optional - displayed read-only from existing profile
  headline: z.string().optional(),
  location: z.string().optional(),
  industry: z.string().optional(), // Optional for active members
  currentExperience: experienceFormSchema.optional(), // Optional for active members
  education: educationFormSchema,
});

/**
 * Schema for alumni form validation (stricter - requires job info)
 */
export const alumniImportReviewFormSchema = z.object({
  fullName: z.string().optional(), // Optional - displayed read-only from existing profile
  headline: z.string().optional(),
  location: z.string().optional(),
  industry: z.string().min(1, 'Industry is required'),
  currentExperience: experienceFormSchema,
  education: educationFormSchema,
});

// --- Type Inference from Schemas ---

export type ParsedExperienceInput = z.infer<typeof parsedExperienceSchema>;
export type ParsedEducationInput = z.infer<typeof parsedEducationSchema>;
export type ParsedLinkedInDataInput = z.infer<typeof parsedLinkedInDataSchema>;
export type ImportReviewFormInput = z.infer<typeof importReviewFormSchema>;

// --- Utility Types ---

/**
 * Payload for creating a new import record
 */
export interface CreateProfileImportData {
  user_id: string;
  source: ImportSource;
  file_path?: string;
  original_filename?: string;
  file_size_bytes?: number;
}

/**
 * Payload for updating an import record after parsing
 */
export interface UpdateProfileImportData {
  status?: ImportStatus;
  parsed_json?: ParsedLinkedInData;
  confidence_json?: ImportConfidence;
  error_message?: string;
  applied_at?: string;
}

/**
 * API response for upload endpoint
 */
export interface UploadImportResponse {
  success: boolean;
  import: ProfileImport;
  signedUrl?: string;
  error?: string;
}

/**
 * API response for apply endpoint
 */
export interface ApplyImportResponse {
  success: boolean;
  message?: string;
  error?: string;
}