import { useProfile } from '@/lib/contexts/ProfileContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useActiveChapter } from '@/lib/contexts/ActiveChapterContext';

export function useRoleAccess(allowedRoles: string[]) {
  const { profile, loading, isDeveloper } = useProfile();
  const { activeChapterId } = useActiveChapter();
  const router = useRouter();

  useEffect(() => {
    // Developers viewing a chapter have full access - bypass role check
    if (isDeveloper && activeChapterId) {
      return;
    }

    // Normal users: enforce role restrictions
    if (!loading && profile?.role && !allowedRoles.includes(profile.role)) {
      router.push('/dashboard');
    }
  }, [profile?.role, loading, isDeveloper, activeChapterId, allowedRoles, router]);


  return { 
    profile, 
    loading, 
    // Developers viewing a chapter always have access
    hasAccess: (isDeveloper && activeChapterId) || allowedRoles.includes(profile?.role || '')
  };
} 