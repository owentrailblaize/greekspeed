'use client';

import { SocialFeed } from './ui/SocialFeed';
import { DuesStatusCard } from './ui/DuesStatusCard';
import { MyTasksCard } from './ui/MyTasksCard';
import { UpcomingEventsCard } from './ui/UpcomingEventsCard';
import { AnnouncementsCard } from './ui/AnnouncementsCard';
import { DocsCompliancePanel } from './ui/DocsCompliancePanel';
import { CompactCalendarCard } from './ui/CompactCalendarCard';
import { useProfile } from '@/lib/hooks/useProfile';

export function ActiveMemberOverview() {
  const { profile } = useProfile();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content - Mobile-First Layout */}
      <div className="max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Mobile Layout: Single Column Stack */}
        <div className="flex flex-col space-y-4 sm:hidden">
          {/* Primary Feature: Social Feed */}
          <div className="w-full">
            <SocialFeed chapterId={profile?.chapter_id || ''} />
          </div>

          {/* Secondary Components Stacked */}
          <div className="w-full">
            <AnnouncementsCard />
          </div>

          <div className="w-full">
            <UpcomingEventsCard />
          </div>

          <div className="w-full">
            <MyTasksCard />
          </div>

          <div className="w-full">
            <DuesStatusCard />
          </div>
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
    </div>
  );
}