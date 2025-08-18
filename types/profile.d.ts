export type SystemRole = 'admin' | 'active_member' | 'alumni';

export type ChapterRole = 
  | 'president'
  | 'vice_president'
  | 'treasurer'
  | 'secretary'
  | 'rush_chair'
  | 'social_chair'
  | 'philanthropy_chair'
  | 'risk_management_chair'
  | 'alumni_relations_chair'
  | 'member'
  | 'pledge';

export type MemberStatus = 
  | 'active'
  | 'inactive'
  | 'probation'
  | 'suspended'
  | 'graduated';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  chapter: string | null;
  role: SystemRole | null;
  chapter_role: ChapterRole | null;
  member_status: MemberStatus | null;
  pledge_class?: string;
  grad_year?: number;
  major?: string;
  minor?: string;
  gpa?: number;
  hometown?: string;
  bio: string | null;
  phone: string | null;
  location: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileFormData {
  first_name: string;
  last_name: string;
  chapter: string;
  role?: SystemRole;
  chapter_role?: ChapterRole;
  member_status?: MemberStatus;
  pledge_class?: string;
  grad_year?: number;
  major?: string;
  minor?: string;
  gpa?: number;
  hometown?: string;
  bio?: string;
  phone?: string;
  location?: string;
  avatar_url?: string;
}

export interface ProfileCompletion {
  totalFields: number;
  completedFields: number;
  percentage: number;
  missingFields: string[];
}

export interface ImportMemberRow {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  major?: string;
  minor?: string;
  gpa?: number;
  hometown?: string;
  pledge_class?: string;
  grad_year?: number;
  chapter_role?: ChapterRole;
  member_status?: MemberStatus;
}

export interface ImportResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
} 