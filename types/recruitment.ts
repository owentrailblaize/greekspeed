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
