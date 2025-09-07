'use client';

import { useState } from 'react';
import { QuickActions } from './ui/QuickActions';
import { DuesSnapshot } from './ui/DuesSnapshot';
import { ComplianceSnapshot } from './ui/ComplianceSnapshot';
import { OperationsFeed } from './ui/OperationsFeed';
import { EventsPanel } from './ui/EventsPanel';
import { TasksPanel } from './ui/TasksPanel';
import { DocsCompliancePanel } from './ui/DocsCompliancePanel';
import { AlertsStrip } from './ui/AlertsStrip';
import { CompactCalendarCard } from './ui/CompactCalendarCard';
import { useProfile } from '@/lib/hooks/useProfile';
import { SocialFeed } from './ui/SocialFeed';
import { DuesStatusCard } from './ui/DuesStatusCard';
import { AdminMobileBottomNavigation } from './ui/AdminMobileBottomNavigation';
import { MobileQuickActionsPage } from './ui/MobileQuickActionsPage';
import { MobileAdminTasksPage } from './ui/MobileAdminTasksPage';
import { MobileDocsCompliancePage } from './ui/MobileDocsCompliancePage';
import { MobileOperationsFeedPage } from './ui/MobileOperationsFeedPage';
import { MobileCalendarPage } from './ui/MobileCalendarPage';

export function AdminOverview() {
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id; // Get the chapter_id from profile
  const [activeMobileTab, setActiveMobileTab] = useState('home');

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
              <SocialFeed chapterId={chapterId || ''} />
            </div>
          </div>
        );
      case 'quick-actions':
        return <MobileQuickActionsPage />;
      case 'tasks':
        return <MobileAdminTasksPage />;
      case 'docs':
        return <MobileDocsCompliancePage />;
      case 'operations':
        return <MobileOperationsFeedPage />;
      case 'calendar':
        return <MobileCalendarPage />;
      default:
        return (
          <div className="space-y-4">
            <div className="w-full">
              <SocialFeed chapterId={chapterId || ''} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Alerts Strip - Critical alerts only */}
      <div className="max-w-full mx-auto px-4 sm:px-6 py-2">
        <AlertsStrip />
      </div>

      {/* Main Content - Mobile-First Layout */}
      <div className="max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Mobile Layout: Tab-Based Navigation */}
        <div className="sm:hidden">
          {renderMobileContent()}
        </div>

        {/* Desktop Layout: Three Column Grid (Preserved) */}
        <div className="hidden sm:grid sm:grid-cols-12 sm:gap-6">
          {/* Left Column - 3 columns wide */}
          <div className="col-span-3 space-y-6">
            <QuickActions />
            <DuesStatusCard />
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
            <CompactCalendarCard />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <AdminMobileBottomNavigation 
        activeTab={activeMobileTab} 
        onTabChange={setActiveMobileTab} 
      />
    </div>
  );
} 