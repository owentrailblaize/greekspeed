'use client';

import { useMemo, useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
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
import { AddRecruitForm } from '@/components/features/recruitment/AddRecruitForm';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { FeatureGuard } from '@/components/shared/FeatureGuard';
import { useFeatureFlag } from '@/lib/hooks/useFeatureFlag';
import { toast } from 'react-toastify';
import type { Recruit } from '@/types/recruitment';
import { cn } from '@/lib/utils';

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
  const router = useRouter();
  const { enabled: financialToolsEnabled } = useFeatureFlag('financial_tools_enabled');
  const { enabled: eventsManagementEnabled } = useFeatureFlag('events_management_enabled');
  const { enabled: recruitmentCrmEnabled } = useFeatureFlag('recruitment_crm_enabled');
  const [showAddRecruitModal, setShowAddRecruitModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const feedData = useMemo(() => {
    if (!initialFeed) return undefined;
    if (!chapterId) return initialFeed;
    return initialFeed.chapterId === chapterId ? initialFeed : undefined;
  }, [chapterId, initialFeed]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle tool query param from Tools menu - Updated for new options
  useEffect(() => {
    const tool = searchParams.get('tool');
    if (tool === 'dues') {
      // Only redirect if financial tools are enabled
      if (financialToolsEnabled) {
        router.push('/dashboard/dues');
      } else {
        // If disabled, just clear the tool param
        router.push('/dashboard');
      }
    } else if (tool === 'announcements') {
      setActiveMobileTab('announcements');
    } else if (tool === 'calendar') {
      // Only set calendar tab if events management is enabled
      if (eventsManagementEnabled) {
        setActiveMobileTab('calendar');
      } else {
        // If disabled, redirect to home
        router.push('/dashboard');
      }
    } else if (tool === 'recruitment') {
      // Add this block
      if (recruitmentCrmEnabled) {
        setShowAddRecruitModal(true);
        // Clear the query param after opening modal
        router.replace('/dashboard', { scroll: false });
      } else {
        router.push('/dashboard');
      }
    } else if (!tool) {
      setActiveMobileTab('home');
    }
  }, [searchParams, router, financialToolsEnabled, eventsManagementEnabled, recruitmentCrmEnabled]);

  // Redirect if user tries to access calendar/events tabs when flag is disabled
  useEffect(() => {
    if ((activeMobileTab === 'calendar' || activeMobileTab === 'events') && !eventsManagementEnabled) {
      router.push('/dashboard');
      setActiveMobileTab('home');
    }
  }, [activeMobileTab, eventsManagementEnabled, router]);
  
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
        // Don't render if events management is disabled (useEffect will redirect)
        if (!eventsManagementEnabled) {
          return null;
        }
        return <MobileCalendarPage />;
      case 'events':
        // Don't render if events management is disabled (useEffect will redirect)
        if (!eventsManagementEnabled) {
          return null;
        }
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

  // Add Recruit handlers
  const handleAddRecruit = () => {
    setShowAddRecruitModal(true);
  };

  const handleRecruitSuccess = (recruit: Recruit) => {
    toast.success('Recruit added successfully!');
    setShowAddRecruitModal(false);
  };

  const handleRecruitCancel = () => {
    setShowAddRecruitModal(false);
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
              <FeatureGuard flagName="events_management_enabled">
                <CompactCalendarCard />
              </FeatureGuard>
            </div>
          </div>

          {/* Center Column - Social Feed */}
          <div className="col-span-6">
            <SocialFeed chapterId={chapterId || ''} initialData={feedData} />
          </div>

          {/* Right Sidebar - Events & Networking */}
          <div className="col-span-3">
            <div className="space-y-6">
              <FeatureGuard flagName="events_management_enabled">
                <UpcomingEventsCard />
              </FeatureGuard>
              <FeatureGuard flagName="financial_tools_enabled">
                <DuesStatusCard />
              </FeatureGuard>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Now auto-configures based on role */}
      <MobileBottomNavigation 
        activeTab={activeMobileTab} 
        onTabChange={handleTabChange}
      />

      {/* Quick Actions Floating Action Button - Lightning Bolt (Stacked above Posts Plus Button) - Only on Home Page (Mobile Only) */}
      {activeMobileTab === 'home' && recruitmentCrmEnabled && (
        <div
          onClick={handleAddRecruit}
          className="fixed bottom-40 right-4 z-40 h-14 w-14 rounded-full sm:hidden flex items-center justify-center cursor-pointer group"
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 30%, #93c5fd 60%, #e0e7ff 100%)',
            boxShadow: `
              0 8px 16px rgba(59, 130, 246, 0.4),
              0 4px 8px rgba(59, 130, 246, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.5),
              inset 0 -1px 0 rgba(0, 0, 0, 0.1)
            `,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
          title="Add Recruit"
        >
          {/* Inner glow effect */}
          <div 
            className="absolute inset-0 rounded-full opacity-50"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.6), transparent 70%)',
            }}
          />
          {/* Icon */}
          <svg 
            className="h-6 w-6 text-white relative z-10 drop-shadow-lg transition-transform duration-200 group-hover:scale-110" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
            }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {/* Hover shine effect */}
          <div 
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: 'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.4), transparent 60%)',
            }}
          />
        </div>
      )}

      {/* Add Recruit Modal - Mobile: Bottom drawer, Desktop: Centered */}
      {showAddRecruitModal && recruitmentCrmEnabled && createPortal(
        <div className={cn(
          "fixed inset-0 z-[9999]",
          isMobile 
            ? "flex items-end justify-center p-0 sm:hidden"
            : "hidden sm:flex items-center justify-center p-4"
        )}>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={handleRecruitCancel} 
          />
          
          {/* Mobile: Bottom Drawer with Rounded Top */}
          {isMobile && (
            <div className="relative bg-white shadow-xl w-full flex flex-col max-h-[90vh] rounded-t-2xl rounded-b-none overflow-hidden">
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <AddRecruitForm 
                  variant="modal"
                  onSuccess={handleRecruitSuccess}
                  onCancel={handleRecruitCancel}
                />
              </div>
            </div>
          )}
          
          {/* Desktop: Centered Modal */}
          {!isMobile && (
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="overflow-y-auto max-h-[90vh] p-6">
                <AddRecruitForm 
                  variant="modal"
                  onSuccess={handleRecruitSuccess}
                  onCancel={handleRecruitCancel}
                />
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
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