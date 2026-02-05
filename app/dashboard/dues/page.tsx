'use client';

import { useRoleAccess } from '@/lib/hooks/useRoleAccess';
import { useFeatureRedirect } from '@/lib/hooks/useFeatureRedirect';
import  DuesClient  from './DuesClient';

export default function DuesPage() {
  const { loading: flagLoading } = useFeatureRedirect({
    flagName: 'financial_tools_enabled',
    redirectTo: '/dashboard'
  });

  // Allow active_member, alumni, and admin to access dues
  const { hasAccess, loading: roleLoading } = useRoleAccess(['active_member', 'alumni', 'admin']);

  if (flagLoading || roleLoading) return <div>Loading...</div>;
  if (!hasAccess) return <div>Access denied. This page is not available for your role.</div>;

  return <DuesClient />;
}