'use client';

import { useRoleAccess } from '@/lib/hooks/useRoleAccess';
import  DuesClient  from './DuesClient';

export default function DuesPage() {
  // Allow active_member, alumni, and admin to access dues
  const { hasAccess, loading } = useRoleAccess(['active_member', 'alumni', 'admin']);

  if (loading) return <div>Loading...</div>;
  if (!hasAccess) return <div>Access denied. This page is not available for your role.</div>;

  return <DuesClient />;
}