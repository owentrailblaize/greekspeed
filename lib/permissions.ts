import { SystemRole, ChapterRole } from '@/types/profile';

export const CHAPTER_ADMIN_ROLES: ChapterRole[] = [
  'president',
  'vice_president', 
  'treasurer',
  'secretary'
];

export const EXECUTIVE_ROLES: ChapterRole[] = [
  ...CHAPTER_ADMIN_ROLES,
  'rush_chair',
  'social_chair',
  'philanthropy_chair',
  'risk_management_chair',
  'alumni_relations_chair'
];

export function canManageChapter(userRole: SystemRole, userChapterRole: ChapterRole | null): boolean {
  // Super admins can manage everything
  if (userRole === 'admin') return true;
  
  // Chapter admins can manage their chapter
  if (userChapterRole && CHAPTER_ADMIN_ROLES.includes(userChapterRole)) return true;
  
  return false;
}

export function canManageMembers(userRole: SystemRole, userChapterRole: ChapterRole | null): boolean {
  // Super admins can manage all members
  if (userRole === 'admin') return true;
  
  // Chapter admins can manage their chapter members
  if (userChapterRole && CHAPTER_ADMIN_ROLES.includes(userChapterRole)) return true;
  
  return false;
}

export function canViewChapterData(userRole: SystemRole, userChapterRole: ChapterRole | null): boolean {
  // Anyone with any role can view chapter data
  return true;
}

export function getRoleDisplayName(role: ChapterRole): string {
  const roleNames: Record<ChapterRole, string> = {
    president: 'President',
    vice_president: 'Vice President',
    treasurer: 'Treasurer',
    secretary: 'Secretary',
    rush_chair: 'Rush Chair',
    social_chair: 'Social Chair',
    philanthropy_chair: 'Philanthropy Chair',
    risk_management_chair: 'Risk Management Chair',
    alumni_relations_chair: 'Alumni Relations Chair',
    member: 'Member',
    pledge: 'Pledge'
  };
  return roleNames[role];
} 