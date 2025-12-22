'use client';

import { RecruitmentView } from '@/components/features/dashboard/dashboards/ui/feature-views/RecruitmentView';
import { useFeatureRedirect } from '@/lib/hooks/useFeatureRedirect';
import { Loader2 } from 'lucide-react';

export default function RecruitmentPage() {
  // Feature flag protection - redirects if recruitment_crm_enabled is false
  const { loading: flagLoading } = useFeatureRedirect({
    flagName: 'recruitment_crm_enabled',
    redirectTo: '/mychapter'
  });

  if (flagLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <RecruitmentView />
      </div>
    </div>
  );
}
