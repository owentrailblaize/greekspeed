'use client';

import { SocialFeed } from './ui/SocialFeed';
import { DuesStatusCard } from './ui/DuesStatusCard';
import { MyTasksCard } from './ui/MyTasksCard';
import { UpcomingEventsCard } from './ui/UpcomingEventsCard';
import { AnnouncementsCard } from './ui/AnnouncementsCard';
import { DocsCompliancePanel } from './ui/DocsCompliancePanel';
import { useProfile } from '@/lib/hooks/useProfile';

export function ActiveMemberOverview() {
  const { profile } = useProfile();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content - Three Column Layout */}
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Sidebar - Dues, Tasks & Documents */}
          <div className="col-span-3">
            <div className="sticky top-6 space-y-6">
              <AnnouncementsCard />
              <MyTasksCard />              
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