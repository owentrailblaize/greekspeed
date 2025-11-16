'use client';

import { useMemo, useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SocialFeed, type SocialFeedInitialData } from './ui/SocialFeed';
import { DuesStatusCard } from './ui/DuesStatusCard';
import { MyTasksCard } from './ui/MyTasksCard';
import { UpcomingEventsCard } from './ui/UpcomingEventsCard';
import { AnnouncementsCard } from './ui/AnnouncementsCard';
import { DocsCompliancePanel } from './ui/DocsCompliancePanel';
import { CompactCalendarCard } from './ui/CompactCalendarCard';
import { MobileBottomNavigation, MobileTab } from './ui/MobileBottomNavigation';
import { MobileTasksPage } from './ui/MobileTasksPage';
import { MobileAnnouncementsPage } from './ui/MobileAnnouncementsPage';
import { MobileCalendarPage } from './ui/MobileCalendarPage';
import { MobileEventsPage } from './ui/MobileEventsPage';
import { MobileDocsCompliancePage } from './ui/MobileDocsCompliancePage';
import { MobileOperationsFeedPage } from './ui/MobileOperationsFeedPage';
import { useProfile } from '@/lib/contexts/ProfileContext';

interface ActiveMemberOverviewProps {
  initialFeed?: SocialFeedInitialData;
  fallbackChapterId?: string | null;
}

// Inner component that uses useSearchParams
function ActiveMemberOverviewContent({ initialFeed, fallbackChapterId }: ActiveMemberOverviewProps) {
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id ?? fallbackChapterId ?? null;
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('home');
  const searchParams = useSearchParams();

  const feedData = useMemo(() => {
    if (!initialFeed) return undefined;
    if (!chapterId) return initialFeed;
    return initialFeed.chapterId === chapterId ? initialFeed : undefined;
  }, [chapterId, initialFeed]);

  // Handle tool query param from Tools menu
  useEffect(() => {
    const tool = searchParams.get('tool');
    if (tool === 'tasks') {
      setActiveMobileTab('tasks');
    } else if (tool === 'docs') {
      // Docs doesn't have a direct tab, we'll handle it in renderMobileContent
      setActiveMobileTab('tasks'); // Temporary, will be handled by renderMobileContent
    } else if (tool === 'ops') {
      // Ops doesn't have a direct tab, we'll handle it in renderMobileContent
      setActiveMobileTab('tasks'); // Temporary, will be handled by renderMobileContent
    } else if (!tool) {
      // If no tool param, default to home
      setActiveMobileTab('home');
    }
  }, [searchParams]);
  
  const renderMobileContent = () => {
    const tool = searchParams.get('tool');
    
    // Handle Tools sub-menu navigation
    if (tool === 'docs') {
      return <MobileDocsCompliancePage />;
    }
    if (tool === 'ops') {
      return <MobileOperationsFeedPage />;
    }

    // Handle regular tabs
    switch (activeMobileTab) {
      case 'home':
        return (
          <div className="space-y-4">
            {/* Primary Feature: Social Feed */}
            <div className="w-full">
              <SocialFeed chapterId={chapterId || ''} initialData={feedData} />
            </div>
          </div>
        );
      case 'tasks':
        return <MobileTasksPage />;
      case 'announcements':
        return <MobileAnnouncementsPage />;
      case 'calendar':
        return <MobileCalendarPage />;
      case 'events':
        return <MobileEventsPage />;
      default:
        return (
          <div className="space-y-4">
            {/* Primary Feature: Social Feed */}
            <div className="w-full">
              <SocialFeed chapterId={chapterId || ''} initialData={feedData} />
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content - Mobile-First Layout */}
      <div className="max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-24 sm:pb-6">
        {/* Mobile Layout: Tab-based Navigation */}
        <div className="sm:hidden">
          {renderMobileContent()}
        </div>

        {/* Desktop Layout: Three Column Grid (Preserved) */}
        <div className="hidden sm:grid sm:grid-cols-12 sm:gap-6">
          {/* Left Sidebar - Dues, Tasks, Calendar & Documents */}
          <div className="col-span-3">
            <div className="sticky top-6 space-y-6">
              <AnnouncementsCard />
              <MyTasksCard />
              <CompactCalendarCard />
            </div>
          </div>

          {/* Center Column - Social Feed */}
          <div className="col-span-6">
            <SocialFeed chapterId={chapterId || ''} initialData={feedData} />
          </div>

          {/* Right Sidebar - Events & Networking */}
          <div className="col-span-3">
            <div className="space-y-6">
              <UpcomingEventsCard />
              <DuesStatusCard />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNavigation 
        activeTab={activeMobileTab} 
        onTabChange={setActiveMobileTab} 
      />
    </div>
  );
}

// Main component with Suspense wrapper
export function ActiveMemberOverview({ initialFeed, fallbackChapterId }: ActiveMemberOverviewProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <ActiveMemberOverviewContent initialFeed={initialFeed} fallbackChapterId={fallbackChapterId} />
    </Suspense>
  );
}