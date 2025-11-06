'use client';

import { AlumniOverview } from './dashboards/AlumniOverview';
import { ActiveMemberOverview } from './dashboards/ActiveMemberOverview';
import { AdminOverview } from './dashboards/AdminOverview';
import { DeveloperOverview } from './dashboards/DeveloperOverview';
import { useProfile } from '@/lib/contexts/ProfileContext';

export function DashboardOverview({ userRole }: { userRole: string | null }) {
  const { isDeveloper } = useProfile();

  if (isDeveloper) {
    return <DeveloperOverview />;
  }

  if (userRole === 'alumni') {
    return <AlumniOverview />;
  }
  
  if (userRole === 'active_member') {
    return <ActiveMemberOverview />;
  }
  
  if (userRole === 'admin') {
    return <AdminOverview />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-navy-900">Dashboard Overview</h1>
          <p className="text-gray-600">Welcome to your dashboard</p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h3>
            <p className="text-gray-600">Dashboard coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}