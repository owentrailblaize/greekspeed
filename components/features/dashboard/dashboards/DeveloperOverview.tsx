'use client';

import { useProfile } from '@/lib/contexts/ProfileContext';
import { UserGrowthDashboard } from './UserGrowthDashboard';
import { Button } from '@/components/ui/button';

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

  return (
    <div className="w-full bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Developer Tools Section */}
        <div className="mb-8">
          
          {/* Developer Tools Grid - Three Simple Buttons */}
          <div className="max-w-6xl mx-auto flex flex-wrap gap-4 justify-center">
            {/* User Management Button */}
            <Button
              variant="default"
              className="rounded-full px-6 py-2"
              onClick={() => window.location.href = '/dashboard/user-management'}
            >
              User Management
            </Button>

            {/* Feature Flags Button */}
            <Button
              variant="default"
              className="rounded-full px-6 py-2"
              onClick={() => window.location.href = '/dashboard/feature-flags'}
            >
              Feature Flags
            </Button>

            {/* Branding Management Button */}
            <Button
              variant="default"
              className="rounded-full px-6 py-2"
              onClick={() => window.location.href = '/dashboard/developer/branding'}
            >
              Branding Management
            </Button>
          </div>
        </div>

        {/* User Growth Dashboard - Stacked on top */}
        <div className="mb-12">
          <UserGrowthDashboard />
        </div>
      </div>
    </div>
  );
}
