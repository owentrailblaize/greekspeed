'use client';

import { useRoleAccess } from '@/lib/hooks/useRoleAccess';
import  DuesClient  from './DuesClient';

export default function DuesPage() {
  // Only allow active_member and alumni (block admin)
  const { hasAccess, loading } = useRoleAccess(['active_member', 'alumni']);

  if (loading) return <div>Loading...</div>;
  if (!hasAccess) return <div>Access denied. This page is not available for your role.</div>;

  return <DuesClient />;
}