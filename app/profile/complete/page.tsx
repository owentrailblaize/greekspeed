'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Profile Complete Page (DEPRECATED)
 * 
 * This page has been replaced by the unified onboarding flow at /onboarding.
 * It now redirects all traffic to the new onboarding flow.
 */
export default function ProfileCompletePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new onboarding flow
    router.replace('/onboarding');
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        <p className="text-gray-600">Redirecting to onboarding...</p>
      </div>
    </div>
  );
}
