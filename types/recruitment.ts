export type RecruitStage = 'New' | 'Contacted' | 'Event Invite' | 'Bid Given' | 'Accepted' | 'Declined';

export interface Recruit {
  id: string;
  chapter_id: string;
  name: string;
  hometown: string;
  phone_number?: string | null;
  instagram_handle?: string | null;
  stage: RecruitStage;
  submitted_by: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  
  // Computed fields (not stored in DB, may be populated via joins)
  submitted_by_name?: string;
  created_by_name?: string;
  chapter_name?: string;
}

export interface CreateRecruitRequest {
  name: string;
  hometown: string;
  phone_number?: string;
  instagram_handle?: string;
  submitted_by?: string; // Set by API if not provided
  created_by?: string; // Set by API if not provided
}

export interface UpdateRecruitRequest {
  name?: string;
  hometown?: string;
  phone_number?: string;
  instagram_handle?: string;
  stage?: RecruitStage;
  notes?: string;
  updated_by?: string; // Set by API
}

export interface RecruitFilters {
  stage?: RecruitStage;
  search?: string;
  submitted_by?: string;
}

// Bulk Import Types
export interface BulkRecruitImportOptions {
  skipDuplicates?: boolean;
  batchSize?: number;
}

export interface BulkRecruitImportRequest {
  recruits: CreateRecruitRequest[];
  options?: BulkRecruitImportOptions;
}

export interface BulkRecruitImportError {
  row: number;
  name: string;
  error: string;
}

export interface BulkRecruitImportDuplicate {
  row: number;
  name: string;
  existingId: string;
  reason: string;
}

export interface BulkRecruitImportResult {
  total: number;
  successful: number;
  failed: number;
  duplicates: number;
  errors: BulkRecruitImportError[];
  createdRecruits: Array<{ id: string; name: string }>;
  skippedDuplicates: BulkRecruitImportDuplicate[];
}

export interface ColumnMapping {
  name: string | null;
  hometown: string | null;
  phone_number: string | null;
  instagram_handle: string | null;
  notes: string | null;
}

// Common column name mappings for auto-detection
export const COLUMN_NAME_MAPPINGS: Record<keyof ColumnMapping, string[]> = {
  name: ['name', 'full_name', 'fullname', 'recruit_name', 'recruit', 'first_name', 'firstname'],
  hometown: ['hometown', 'home_town', 'city', 'location', 'from', 'origin'],
  phone_number: ['phone', 'phone_number', 'phonenumber', 'cell', 'mobile', 'telephone', 'contact'],
  instagram_handle: ['instagram', 'instagram_handle', 'ig', 'ig_handle', 'insta', 'social'],
  notes: ['notes', 'note', 'comments', 'comment', 'description', 'info', 'details'],
};