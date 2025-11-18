'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { DashboardSidebar } from './ui/DashboardSidebar';
import { ContextualSidebar } from './ui/ContextualSidebar';
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
  const [activeFeature, setActiveFeature] = useState<FeatureView>('overview');

  // All features are now available to all admins - no role-based filtering
  const renderFeatureView = () => {
    switch (activeFeature) {
      case 'overview':
        return <OverviewView selectedRole={selectedRole} />;
      case 'events':
        return <EventsView />;
      case 'tasks':
        return <TasksView />;
      case 'members':
        return <MembersView />;
      case 'dues':
        return <DuesView />;
      case 'budget':
        return <BudgetView />;
      case 'vendors':
        return <VendorsView />;
      case 'invitations':
        return <InvitationsView />;
      default:
        return <OverviewView selectedRole={selectedRole} />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-50">
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

      {/* Right Sidebar */}
      <ContextualSidebar
        activeFeature={activeFeature}
        selectedRole={selectedRole}
      />
    </div>
  );
}

