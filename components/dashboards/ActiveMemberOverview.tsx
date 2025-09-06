'use client';

import { useState } from 'react';
import { SocialFeed } from './ui/SocialFeed';
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
import { useProfile } from '@/lib/hooks/useProfile';

export function ActiveMemberOverview() {
  const { profile } = useProfile();
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('home');
  
  const renderMobileContent = () => {
    switch (activeMobileTab) {
      case 'home':
        return (
          <div className="space-y-4">
            {/* Dues Status - At the top for quick access */}
            <div className="w-full">
              <DuesStatusCard />
            </div>

            {/* Primary Feature: Social Feed */}
            <div className="w-full">
              <SocialFeed chapterId={profile?.chapter_id || ''} />
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
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content - Mobile-First Layout */}
      <div className="max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-6">
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
            <SocialFeed chapterId={profile?.chapter_id || ''} />
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