import { useProfile } from '@/lib/contexts/ProfileContext';
import { ChapterRole } from '@/types/profile';

export function useChapterRoleAccess(allowedChapterRoles: ChapterRole[]) {
  const { profile, loading } = useProfile();

  const hasChapterRoleAccess = () => {
    if (!profile) return false;
    
    // Super admins can access everything
    if (profile.role === 'admin') return true;
    
    // Check if user has the required chapter role
    if (profile.chapter_role && allowedChapterRoles.includes(profile.chapter_role)) {
      return true;
    }
    
    return false;
  };

  return { 
    profile, 
    loading, 
    hasChapterRoleAccess: hasChapterRoleAccess(),
    canAddMembers: hasChapterRoleAccess()
  };
}