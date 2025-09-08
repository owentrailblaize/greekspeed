export type SystemRole = 'admin' | 'active_member' | 'alumni' | 'developer' | 'pending_member' | 'declined_member';

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

export type MemberStatus = 'active' | 'inactive' | 'probation' | 'suspended' | 'graduated' | 'alumni' | 'pending' | 'declined';

export type DeveloperPermission = 
  | 'view_users'
  | 'view_analytics'
  | 'create_endpoints'
  | 'manage_chapters'
  | 'manage_permissions'
  | 'view_system_health'
  | 'manage_onboarding';

export type AccessLevel = 'standard' | 'elevated' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  avatar_url: string | null;
  chapter: string | null;
  chapter_role: string | null;
  member_status: MemberStatus;
  pledge_class: string | null;
  grad_year: number | null;
  major: string | null;
  minor: string | null;
  hometown: string | null;
  gpa: number | null;
  chapter_id: string | null;
  role: SystemRole;
  is_developer: boolean;
  developer_permissions: string[];
  access_level: string | null;
  banner_url: string | null;
  stripe_customer_id: string | null;
  billing_unlocked_until: string | null;
  subscription_status: string;
  subscription_tier: string;
  current_dues_amount: string;
  dues_status: string;
  last_dues_assignment_date: string | null;
  dues_notes: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null; // When they were approved
  welcome_seen: boolean; // Whether they've seen the welcome modal
}

export interface ProfileFormData {
  first_name?: string;
  last_name?: string;
  email?: string;
  chapter?: string;
  role?: string;
  bio?: string;
  phone?: string;
  location?: string;
  grad_year?: string;
  major?: string;
  minor?: string;
  hometown?: string;
  gpa?: string;
  avatar_url?: string;
  banner_url?: string;
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