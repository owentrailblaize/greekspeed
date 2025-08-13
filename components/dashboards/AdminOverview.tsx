'use client';

import { QuickActions } from './ui/QuickActions';
import { DuesSnapshot } from './ui/DuesSnapshot';
import { ComplianceSnapshot } from './ui/ComplianceSnapshot';
import { OperationsFeed } from './ui/OperationsFeed';
import { EventsPanel } from './ui/EventsPanel';
import { TasksPanel } from './ui/TasksPanel';
import { DocsCompliancePanel } from './ui/DocsCompliancePanel';
import { AlertsStrip } from './ui/AlertsStrip';

export function AdminOverview() {
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
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Sidebar - Quick Actions & Snapshots */}
          <div className="col-span-3">
            <div className="sticky top-6 space-y-6">
              <QuickActions />
              <DuesSnapshot />
              <ComplianceSnapshot />
            </div>
          </div>

          {/* Center Column - Operations Feed & Events */}
          <div className="col-span-6">
            <div className="space-y-6">
              <OperationsFeed />
              <EventsPanel />
            </div>
          </div>

          {/* Right Sidebar - Tasks & Compliance */}
          <div className="col-span-3">
            <div className="space-y-6">
              <TasksPanel />
              <DocsCompliancePanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 