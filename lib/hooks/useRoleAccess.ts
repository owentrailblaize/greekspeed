import { useProfile } from '@/lib/contexts/ProfileContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useRoleAccess(allowedRoles: string[]) {
  const { profile, loading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile?.role && !allowedRoles.includes(profile.role)) {
      // Redirect to dashboard if user doesn't have access
      router.push('/dashboard');
    }
  }, [profile?.role, loading, allowedRoles, router]);

  return { 
    profile, 
    loading, 
    hasAccess: allowedRoles.includes(profile?.role || '') 
  };
} 