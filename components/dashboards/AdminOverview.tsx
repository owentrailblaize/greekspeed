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
      <div className="max-w-full mx-auto px-4 sm:px-6 py-2">
        <AlertsStrip />
      </div>

      {/* Main Content - Mobile-First Layout */}
      <div className="max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Mobile Layout: Single Column Stack */}
        <div className="flex flex-col space-y-4 sm:hidden">
          {/* Primary Feature: Social Feed */}
          <div className="w-full">
            <SocialFeed chapterId={chapterId || ''} />
          </div>

          {/* Secondary Components Stacked */}
          <div className="w-full">
            <QuickActions />
          </div>

          <div className="w-full">
            <DuesSnapshot />
          </div>

          <div className="w-full">
            <OperationsFeed />
          </div>

          <div className="w-full">
            {chapterId && <TasksPanel chapterId={chapterId} />}
          </div>

          <div className="w-full">
            <DocsCompliancePanel />
          </div>
        </div>

        {/* Desktop Layout: Three Column Grid (Preserved) */}
        <div className="hidden sm:grid sm:grid-cols-12 sm:gap-6">
          {/* Left Column - 3 columns wide */}
          <div className="col-span-3 space-y-6">
            <QuickActions />
            <DuesSnapshot />
            <OperationsFeed />
          </div>
          
          {/* Center Column - 6 columns wide */}
          <div className="col-span-6 space-y-6">
            <SocialFeed chapterId={chapterId || ''} />
          </div>
          
          {/* Right Column - 3 columns wide */}
          <div className="col-span-3 space-y-6">
            {chapterId && <TasksPanel chapterId={chapterId} />}
            <DocsCompliancePanel />
          </div>
        </div>
      </div>
    </div>
  );
} 