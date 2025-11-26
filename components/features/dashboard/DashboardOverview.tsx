'use client';

import { AlumniOverview } from './dashboards/AlumniOverview';
import { ActiveMemberOverview } from './dashboards/ActiveMemberOverview';
import { AdminOverview } from './dashboards/AdminOverview';
import { DeveloperOverview } from './dashboards/DeveloperOverview';
import { useProfile } from '@/lib/contexts/ProfileContext';
import type { SocialFeedInitialData } from './dashboards/ui/SocialFeed';

interface DashboardOverviewProps {
  userRole: string | null;
  initialFeed?: SocialFeedInitialData;
  fallbackChapterId?: string | null;
}

export function DashboardOverview({
  userRole,
  initialFeed,
  fallbackChapterId,
}: DashboardOverviewProps) {
  const { isDeveloper } = useProfile();

  // Check if user is a developer first
  if (isDeveloper) {
    return <DeveloperOverview />;
  }

  // Render role-specific dashboard based on userRole
  if (userRole === 'alumni') {
    return <AlumniOverview initialFeed={initialFeed} fallbackChapterId={fallbackChapterId} />;
  }
  
  if (userRole === 'active_member') {
    return <ActiveMemberOverview initialFeed={initialFeed} fallbackChapterId={fallbackChapterId} />;
  }
  
  if (userRole === 'admin') {
    return <AdminOverview initialFeed={initialFeed} fallbackChapterId={fallbackChapterId} />;
  }
  
  // Default dashboard for fallback - Show loading instead of placeholder
  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-navy-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // This should never be reached if we wait for role above, but kept as safety
  return null;
}