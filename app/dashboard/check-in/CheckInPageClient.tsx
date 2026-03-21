'use client';

import { useRouter } from 'next/navigation';
import { CheckInClient } from '@/app/dashboard/check-in/CheckInClient';
import { MobileBottomNavigation } from '@/components/features/dashboard/dashboards/ui/MobileBottomNavigation';
import { ArrowLeft } from 'lucide-react';

interface CheckInPageClientProps {
  eventId: string;
}

export function CheckInPageClient({ eventId }: CheckInPageClientProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.replace('/dashboard');
    }
  };

  return (
    <>
      <div className="p-4 sm:p-6 pb-24 sm:pb-6 max-w-2xl mx-auto flex-1 flex flex-col min-h-0">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </button>
        <div className="flex-1 flex flex-col justify-center">
          <CheckInClient eventId={eventId} />
        </div>
      </div>
      <MobileBottomNavigation />
    </>
  );
}
