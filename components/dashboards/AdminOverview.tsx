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

export function AdminOverview() {
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id; // Get the chapter_id from profile

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-navy-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your chapter operations and monitor compliance</p>
        </div>
      </div>

      {/* Alerts Strip - Critical alerts only */}
      <div className="max-w-7xl mx-auto px-6 py-2">
        <AlertsStrip />
      </div>

      {/* Main Content - Three Column Layout */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column */}
          <div className="col-span-1 space-y-6">
            <QuickActions />
            <DuesSnapshot />
          </div>
          
          {/* Center Column */}
          <div className="col-span-1 space-y-6">
            <OperationsFeed />
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