'use client';

import { useMemo, useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import { useChapterFeatures } from '@/lib/hooks/useChapterFeatures';

interface ActiveMemberOverviewProps {
  initialFeed?: SocialFeedInitialData;
  fallbackChapterId?: string | null;
}

// Inner component that uses useSearchParams
function ActiveMemberOverviewContent({ initialFeed, fallbackChapterId }: ActiveMemberOverviewProps) {
  const { profile } = useProfile();
  const { features } = useChapterFeatures();
  const chapterId = profile?.chapter_id ?? fallbackChapterId ?? null;
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('home');
  const searchParams = useSearchParams();
  const router = useRouter();

  const feedData = useMemo(() => {
    if (!initialFeed) return undefined;
    if (!chapterId) return initialFeed;
    return initialFeed.chapterId === chapterId ? initialFeed : undefined;
  }, [chapterId, initialFeed]);

  // Handle tool query param from Tools menu - Updated for new options
  useEffect(() => {
    const tool = searchParams.get('tool');
    if (tool === 'dues') {
      if (features.financial_tools_enabled) {
        router.push('/dashboard/dues');
      } else {
        // Redirect away if feature is disabled
        router.push('/dashboard');
      }
    } else if (tool === 'announcements') {
      setActiveMobileTab('announcements');
    } else if (tool === 'calendar') {
      setActiveMobileTab('calendar');
    } else if (!tool) {
      setActiveMobileTab('home');
    }
  }, [searchParams, router, features.financial_tools_enabled]);
  
  const renderMobileContent = () => {
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
  
  // Add this handler function to fix the type mismatch
  const handleTabChange = (tab: MobileTab | string) => {
    // Type guard to ensure we're setting a valid MobileTab
    const validTabs: MobileTab[] = ['home', 'tasks', 'announcements', 'calendar', 'events'];
    if (validTabs.includes(tab as MobileTab)) {
      setActiveMobileTab(tab as MobileTab);
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
            <div className="top-6 space-y-6">
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
              {features.financial_tools_enabled && <DuesStatusCard />}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Now auto-configures based on role */}
      <MobileBottomNavigation 
        activeTab={activeMobileTab} 
        onTabChange={handleTabChange}
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