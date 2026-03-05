'use client';

import { useProfile } from '@/lib/contexts/ProfileContext';
import { UserGrowthDashboard } from './UserGrowthDashboard';

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
    <div 
      className="w-full bg-gray-50 overflow-hidden"
      style={{
        height: 'calc(100vh - 4rem)', // Full viewport minus header (assuming 4rem header)
        maxHeight: 'calc(100vh - 4rem)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Main Content - Flex container to fill available space */}
      <div 
        className="max-w-7xl mx-auto w-full flex-1 flex flex-col overflow-hidden"
        style={{
          padding: '1rem',
          minHeight: 0,
        }}
      >
        {/* User Growth Dashboard - Takes all available space */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <UserGrowthDashboard />
        </div>
      </div>
    </div>
  );
}
