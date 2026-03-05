'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

// Helper function to validate and get feature view from query param
function getFeatureViewFromQuery(queryParam: string | null, financialToolsEnabled: boolean, eventsManagementEnabled: boolean, recruitmentCrmEnabled: boolean): FeatureView {
  const validViews: FeatureView[] = ['overview', 'events', 'tasks', 'members', 'dues', 'budget', 'vendors', 'invitations', 'recruitment'];
  
  if (!queryParam || !validViews.includes(queryParam as FeatureView)) {
    return 'overview';
  }
  
  const view = queryParam as FeatureView;
  
  // Validate feature flags
  if (view === 'dues' && !financialToolsEnabled) {
    return 'overview';
  }
  if (view === 'events' && !eventsManagementEnabled) {
    return 'overview';
  }
  if (view === 'recruitment' && !recruitmentCrmEnabled) {
    return 'overview';
  }
  
  return view;
}

export function UnifiedExecutiveDashboard({ 
  selectedRole, 
  onRoleChange 
}: UnifiedExecutiveDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useProfile();
  const { enabled: financialToolsEnabled } = useFeatureFlag('financial_tools_enabled');
  const { enabled: eventsManagementEnabled } = useFeatureFlag('events_management_enabled');
  const { enabled: recruitmentCrmEnabled } = useFeatureFlag('recruitment_crm_enabled');
  
  // Derive active feature from URL query param immediately (no initial state delay)
  const activeFeature = useMemo(() => {
    const viewParam = searchParams.get('view');
    return getFeatureViewFromQuery(viewParam, financialToolsEnabled, eventsManagementEnabled, recruitmentCrmEnabled);
  }, [searchParams, financialToolsEnabled, eventsManagementEnabled, recruitmentCrmEnabled]);

  const handleFeatureChange = (feature: FeatureView) => {
    // Update URL query parameter to persist state
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', feature);
    router.push(`/dashboard/admin?${params.toString()}`, { scroll: false });
  };

  // All features are now available to all admins - no role-based filtering
  const renderFeatureView = () => {
    switch (activeFeature) {
      case 'overview':
        return <OverviewView selectedRole={selectedRole} onFeatureChange={handleFeatureChange} />;
      case 'events':
        // Only render if events management is enabled
        if (eventsManagementEnabled) {
          return <EventsView />;
        }
        // If disabled, redirect to overview
        return <OverviewView selectedRole={selectedRole} onFeatureChange={handleFeatureChange} />;
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
        return <OverviewView selectedRole={selectedRole} onFeatureChange={handleFeatureChange} />;
      case 'budget':
        // Budget is always available as a general chapter budget view
        return <BudgetView />;
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
        return <OverviewView selectedRole={selectedRole} onFeatureChange={handleFeatureChange} />;
      default:
        return <OverviewView selectedRole={selectedRole} onFeatureChange={handleFeatureChange} />;
    }
  };

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">
      {/* Left Sidebar */}
      <DashboardSidebar
        selectedRole={selectedRole}
        onRoleChange={onRoleChange}
        activeFeature={activeFeature}
        onFeatureChange={handleFeatureChange}
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

