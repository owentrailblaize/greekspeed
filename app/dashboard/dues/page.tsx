'use client';

import { useRoleAccess } from '@/lib/hooks/useRoleAccess';
import { useChapterFeatures } from '@/lib/hooks/useChapterFeatures';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DuesClient from './DuesClient';

export default function DuesPage() {
  const { hasAccess, loading: roleLoading } = useRoleAccess(['active_member', 'alumni', 'admin']);
  const { features, loading: featuresLoading } = useChapterFeatures();
  const router = useRouter();

  useEffect(() => {
    if (!featuresLoading && !features.financial_tools_enabled) {
      router.push('/dashboard');
    }
  }, [features, featuresLoading, router]);

  if (roleLoading || featuresLoading) return <div>Loading...</div>;
  if (!hasAccess) return <div>Access denied. This page is not available for your role.</div>;
  if (!features.financial_tools_enabled) return null; // Will redirect

  return <DuesClient />;
}