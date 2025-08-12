'use client';

import { SocialFeed } from './ui/SocialFeed';
import { DuesStatusCard } from './ui/DuesStatusCard';
import { MyTasksCard } from './ui/MyTasksCard';
import { UpcomingEventsCard } from './ui/UpcomingEventsCard';
import { NetworkingSuggestionsCard } from './ui/NetworkingSuggestionsCard';

export function ActiveMemberOverview() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-navy-900">Active Member Dashboard</h1>
          <p className="text-gray-600">Stay on top of your responsibilities and upcoming events</p>
        </div>
      </div>

      {/* Main Content - Three Column Layout */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Sidebar - Dues & Tasks */}
          <div className="col-span-3">
            <div className="space-y-6">
              <DuesStatusCard />
              <MyTasksCard />
            </div>
          </div>

          {/* Center Column - Social Feed */}
          <div className="col-span-6">
            <SocialFeed />
          </div>

          {/* Right Sidebar - Events & Networking */}
          <div className="col-span-3">
            <div className="space-y-6">
              <UpcomingEventsCard />
              <NetworkingSuggestionsCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}