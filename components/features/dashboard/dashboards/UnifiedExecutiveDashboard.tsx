'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { useChapterFeatures } from '@/lib/hooks/useChapterFeatures';
import { DashboardSidebar } from './ui/DashboardSidebar';
import { OverviewView } from './ui/feature-views/OverviewView';
import { EventsView } from './ui/feature-views/EventsView';
import { TasksView } from './ui/feature-views/TasksView';
import { MembersView } from './ui/feature-views/MembersView';
import { DuesView } from './ui/feature-views/DuesView';
import { BudgetView } from './ui/feature-views/BudgetView';
import { VendorsView } from './ui/feature-views/VendorsView';
import { InvitationsView } from './ui/feature-views/InvitationsView';

export type FeatureView = 
  | 'overview'
  | 'events'
  | 'tasks'
  | 'members'
  | 'dues'
  | 'budget'
  | 'vendors'
  | 'invitations';

interface UnifiedExecutiveDashboardProps {
  selectedRole: string;
  onRoleChange: (role: string) => void;
}

export function UnifiedExecutiveDashboard({ 
  selectedRole, 
  onRoleChange 
}: UnifiedExecutiveDashboardProps) {
  const { profile } = useProfile();
  const { features, loading: featuresLoading } = useChapterFeatures();
  const [activeFeature, setActiveFeature] = useState<FeatureView>('overview');

  // Redirect if trying to access disabled feature
  useEffect(() => {
    if (!featuresLoading && activeFeature === 'dues' && !features.financial_tools_enabled) {
      setActiveFeature('overview');
    }
    if (!featuresLoading && activeFeature === 'budget' && !features.financial_tools_enabled) {
      setActiveFeature('overview');
    }
  }, [features, featuresLoading, activeFeature]);

  // All features are now available to all admins - no role-based filtering
  const renderFeatureView = () => {
    switch (activeFeature) {
      case 'overview':
        return <OverviewView selectedRole={selectedRole} onFeatureChange={setActiveFeature} />;
      case 'events':
        return <EventsView />;
      case 'tasks':
        return <TasksView />;
      case 'members':
        return <MembersView />;
      case 'dues':
        if (!features.financial_tools_enabled) {
          return <OverviewView selectedRole={selectedRole} />;
        }
        return <DuesView />;
      case 'budget':
        if (!features.financial_tools_enabled) {
          return <OverviewView selectedRole={selectedRole} />;
        }
        return <BudgetView />;
      case 'vendors':
        return <VendorsView />;
      case 'invitations':
        return <InvitationsView />;
      default:
        return <OverviewView selectedRole={selectedRole} />;
    }
  };

  if (featuresLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

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

