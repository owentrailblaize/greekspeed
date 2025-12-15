'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { useFeatureFlag } from '@/lib/hooks/useFeatureFlag';
import { DashboardSidebar } from './ui/DashboardSidebar';
import { OverviewView } from './ui/feature-views/OverviewView';
import { EventsView } from './ui/feature-views/EventsView';
import { TasksView } from './ui/feature-views/TasksView';
import { MembersView } from './ui/feature-views/MembersView';
import { DuesView } from './ui/feature-views/DuesView';
import { BudgetView } from './ui/feature-views/BudgetView';
import { VendorsView } from './ui/feature-views/VendorsView';
import { InvitationsView } from './ui/feature-views/InvitationsView';
import { RecruitmentView } from './ui/feature-views/RecruitmentView';

export type FeatureView = 
  | 'overview'
  | 'events'
  | 'tasks'
  | 'members'
  | 'dues'
  | 'budget'
  | 'vendors'
  | 'invitations'
  | 'recruitment';

interface UnifiedExecutiveDashboardProps {
  selectedRole: string;
  onRoleChange: (role: string) => void;
}

export function UnifiedExecutiveDashboard({ 
  selectedRole, 
  onRoleChange 
}: UnifiedExecutiveDashboardProps) {
  const { profile } = useProfile();
  const { enabled: financialToolsEnabled } = useFeatureFlag('financial_tools_enabled');
  const { enabled: eventsManagementEnabled } = useFeatureFlag('events_management_enabled'); // Add this line
  const { enabled: recruitmentCrmEnabled } = useFeatureFlag('recruitment_crm_enabled');
  const [activeFeature, setActiveFeature] = useState<FeatureView>('overview');

  // Redirect to overview if financial features are selected but disabled
  useEffect(() => {
    // Remove 'vendors' from this check - it should always be accessible
    if (!financialToolsEnabled && (activeFeature === 'dues' || activeFeature === 'budget')) {
      setActiveFeature('overview');
    }
    // Redirect to overview if events is selected but disabled
    if (!eventsManagementEnabled && activeFeature === 'events') {
      setActiveFeature('overview');
    }
    // Redirect to overview if recruitment is selected but disabled
    if (!recruitmentCrmEnabled && activeFeature === 'recruitment') {
      setActiveFeature('overview');
    }
  }, [activeFeature, financialToolsEnabled, eventsManagementEnabled, recruitmentCrmEnabled]); // Add recruitmentCrmEnabled to dependencies

  // All features are now available to all admins - no role-based filtering
  const renderFeatureView = () => {
    switch (activeFeature) {
      case 'overview':
        return <OverviewView selectedRole={selectedRole} onFeatureChange={setActiveFeature} />;
      case 'events':
        // Only render if events management is enabled
        if (eventsManagementEnabled) {
          return <EventsView />;
        }
        // If disabled, redirect to overview
        return <OverviewView selectedRole={selectedRole} onFeatureChange={setActiveFeature} />;
      case 'tasks':
        return <TasksView />;
      case 'members':
        return <MembersView />;
      case 'dues':
        // Only render if financial tools are enabled
        if (financialToolsEnabled) {
          return <DuesView />;
        }
        // If disabled, redirect to overview
        return <OverviewView selectedRole={selectedRole} onFeatureChange={setActiveFeature} />;
      case 'budget':
        // Only render if financial tools are enabled
        if (financialToolsEnabled) {
          return <BudgetView />;
        }
        // If disabled, redirect to overview
        return <OverviewView selectedRole={selectedRole} onFeatureChange={setActiveFeature} />;
      case 'vendors':
        // Vendors is always accessible (not protected by financial flag)
        return <VendorsView />;
      case 'invitations':
        return <InvitationsView />;
      case 'recruitment':
        // Only render if recruitment CRM is enabled
        if (recruitmentCrmEnabled) {
          return <RecruitmentView />;
        }
        // If disabled, redirect to overview
        return <OverviewView selectedRole={selectedRole} onFeatureChange={setActiveFeature} />;
      default:
        return <OverviewView selectedRole={selectedRole} />;
    }
  };

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">
      {/* Left Sidebar */}
      <DashboardSidebar
        selectedRole={selectedRole}
        onRoleChange={onRoleChange}
        activeFeature={activeFeature}
        onFeatureChange={setActiveFeature}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-full mx-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderFeatureView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

