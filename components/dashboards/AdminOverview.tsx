'use client';

import { QuickActions } from './ui/QuickActions';
import { DuesSnapshot } from './ui/DuesSnapshot';
import { ComplianceSnapshot } from './ui/ComplianceSnapshot';
import { OperationsFeed } from './ui/OperationsFeed';
import { EventsPanel } from './ui/EventsPanel';
import { TasksPanel } from './ui/TasksPanel';
import { DocsCompliancePanel } from './ui/DocsCompliancePanel';
import { AlertsStrip } from './ui/AlertsStrip';
import { useProfile } from '@/lib/hooks/useProfile';
import { SocialFeed } from './ui/SocialFeed';

export function AdminOverview() {
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id; // Get the chapter_id from profile

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Alerts Strip - Critical alerts only */}
      <div className="max-w-full mx-auto px-6 py-2">
        <AlertsStrip />
      </div>

      {/* Main Content - Three Column Layout */}
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column */}
          <div className="col-span-1 space-y-6">
            <QuickActions />
            <DuesSnapshot />
            <OperationsFeed />
          </div>
          
          {/* Center Column */}
          <div className="col-span-1 space-y-6">
            <SocialFeed />
          </div>
          
          {/* Right Column */}
          <div className="col-span-1 space-y-6">
            {/* Pass chapterId to TasksPanel */}
            {chapterId && <TasksPanel chapterId={chapterId} />}
            <DocsCompliancePanel />
          </div>
        </div>
      </div>
    </div>
  );
} 