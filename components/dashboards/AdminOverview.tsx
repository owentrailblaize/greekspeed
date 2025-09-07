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
import { MobileAdminTasksPage } from './ui/MobileAdminTasksPage';
import { MobileDocsCompliancePage } from './ui/MobileDocsCompliancePage';
import { MobileOperationsFeedPage } from './ui/MobileOperationsFeedPage';
import { MobileCalendarPage } from './ui/MobileCalendarPage';

export function AdminOverview() {
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id; // Get the chapter_id from profile
  const [activeMobileTab, setActiveMobileTab] = useState('home');
  const [showQuickActionsModal, setShowQuickActionsModal] = useState(false);

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

      {/* Quick Actions Floating Action Button - Only on Home Page */}
      {activeMobileTab === 'home' && (
        <div
          onClick={() => setShowQuickActionsModal(true)}
          className="fixed bottom-40 right-4 z-40 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 sm:hidden flex items-center justify-center cursor-pointer"
          title="Quick Actions"
        >
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      )}

      {/* Quick Actions Modal */}
      {showQuickActionsModal && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowQuickActionsModal(false)} />
          <div className="relative flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                  <button
                    onClick={() => setShowQuickActionsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <QuickActions />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 