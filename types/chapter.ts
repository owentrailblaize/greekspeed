import { ChapterRole, MemberStatus } from '@/types/profile';

export interface Chapter {
  id: string;
  name: string;
  description?: string;
  location?: string;
  university?: string;
  slug?: string;
  member_count?: number;
  founded_year?: number;
  founded_date?: string;
  events?: string[];
  achievements?: string[];
  llm_enriched?: boolean;
  llm_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ChapterMember {
  id: string;
  chapter_id: string;
  user_id: string;
  chapter_role: ChapterRole;
  status: MemberStatus;
  pledge_class?: string;
  grad_year?: number;
  joined_at: string;
  initiated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ChapterStats {
  totalMembers: number;
  activeMembers: number;
  newPledges: number;
  graduatingMembers: number;
  membershipGrowth: number;
  executiveMembers: number;
} 