'use client';

import { useProfile } from '@/lib/contexts/ProfileContext';
import { DeveloperPortal } from './DeveloperPortal';

export function DeveloperOverview() {
  const { isDeveloper } = useProfile();

  if (!isDeveloper) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have access to the developer portal.</p>
        </div>
      </div>
    );
  }

  return <DeveloperPortal />;
}
