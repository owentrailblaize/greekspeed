'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Megaphone, Calendar, CheckSquare, Users, DollarSign, TrendingUp, BookOpen, UserPlus, Settings, ChevronRight, X } from 'lucide-react';
import { FeatureView } from '../UnifiedExecutiveDashboard';
import { cn } from '@/lib/utils';
import { CollapsibleNavGroup } from './CollapsibleNavGroup';
import { Button } from '@/components/ui/button';
import { useFeatureFlag } from '@/lib/hooks/useFeatureFlag';

interface DashboardSidebarProps {
  selectedRole: string;
  onRoleChange: (role: string) => void;
  activeFeature: FeatureView;
  onFeatureChange: (feature: FeatureView) => void;
}

// Top-level navigation items
const topLevelItems = [
  { id: 'overview' as FeatureView, label: 'Overview', icon: LayoutDashboard },
  { id: 'events' as FeatureView, label: 'Events', icon: Calendar },
  { id: 'tasks' as FeatureView, label: 'Tasks', icon: CheckSquare },
];

export function DashboardSidebar({
  selectedRole,
  onRoleChange,
  activeFeature,
  onFeatureChange
}: DashboardSidebarProps) {
  const { enabled: financialToolsEnabled } = useFeatureFlag('financial_tools_enabled');
  const { enabled: eventsManagementEnabled } = useFeatureFlag('events_management_enabled'); // Add this line
  
  // Collapsible sidebar state (following AlumniPipelineLayout pattern)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Navigation groups with dropdowns - conditionally include Dues and Financial group
  const navigationGroups = [
    {
      id: 'manage',
      label: 'Manage',
      icon: Settings,
      items: [
        { id: 'members' as FeatureView, label: 'Members', icon: Users },
        // Only include Dues if financial tools are enabled
        ...(financialToolsEnabled ? [{ id: 'dues' as FeatureView, label: 'Dues', icon: DollarSign }] : []),
        { id: 'invitations' as FeatureView, label: 'Invitations', icon: UserPlus },
        // Move Vendors to Manage dropdown when financial tools are disabled
        ...(!financialToolsEnabled ? [{ id: 'vendors' as FeatureView, label: 'Vendors', icon: BookOpen }] : []),
      ]
    },
    // Only include Financial group if financial tools are enabled
    ...(financialToolsEnabled ? [{
      id: 'financial',
      label: 'Financial',
      icon: TrendingUp,
      items: [
        { id: 'budget' as FeatureView, label: 'Budget', icon: TrendingUp },
        { id: 'vendors' as FeatureView, label: 'Vendors', icon: BookOpen },
      ]
    }] : [])
  ];

  // Filter top-level items based on feature flags
  const visibleTopLevelItems = topLevelItems.filter(item => {
    // Hide Events tab if events management is disabled
    if (item.id === 'events' && !eventsManagementEnabled) {
      return false;
    }
    return true;
  });

  // Set mobile-specific initial state
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true); // Start collapsed on mobile
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Track which group is open (only one at a time)
  const [openGroup, setOpenGroup] = useState<string | null>(() => {
    // Auto-open the group that contains the active feature
    const activeGroup = navigationGroups.find(group => 
      group.items.some(item => item.id === activeFeature)
    );
    return activeGroup?.id || null;
  });

  // Update open group when active feature changes
  useEffect(() => {
    const activeGroup = navigationGroups.find(group => 
      group.items.some(item => item.id === activeFeature)
    );
    if (activeGroup) {
      setOpenGroup(activeGroup.id);
    }
  }, [activeFeature]);

  const handleGroupToggle = (groupId: string) => {
    setOpenGroup(openGroup === groupId ? null : groupId);
  };

  return (
    <div className="flex">
      {/* Main Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ 
              width: sidebarCollapsed ? 64 : (isMobile ? '100vw' : 256), 
              opacity: 1 
            }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-white border-r border-gray-200 shadow-sm overflow-hidden flex-shrink-0"
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <LayoutDashboard className="h-5 w-5 text-navy-600 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <motion.h3 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="font-semibold text-gray-900"
                      >
                        Administration
                      </motion.h3>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      className="h-8 w-8 p-0"
                    >
                      {sidebarCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4 rotate-180" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSidebarOpen(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 overflow-y-auto p-4">
                {sidebarCollapsed ? (
                  // Collapsed view - show only icons
                  <div className="space-y-4">
                    <div className="flex flex-col items-center space-y-2">
                      {visibleTopLevelItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeFeature === item.id;
                        
                        return (
                          <Button
                            key={item.id}
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-10 w-10 p-0 rounded-lg transition-colors",
                              isActive
                                ? "bg-white text-gray-900 hover:bg-white shadow-lg"
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            )}
                            onClick={() => onFeatureChange(item.id)}
                            title={item.label}
                          >
                            <Icon className="h-5 w-5" />
                          </Button>
                        );
                      })}
                      
                      {/* Group icons when collapsed */}
                      {navigationGroups.map((group) => {
                        const GroupIcon = group.icon;
                        const hasActiveItem = group.items.some(item => item.id === activeFeature);
                        
                        return (
                          <Button
                            key={group.id}
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-10 w-10 p-0 rounded-lg transition-colors",
                              hasActiveItem
                                ? "bg-gray-100 text-gray-900 hover:bg-gray-100"
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            )}
                            onClick={() => {
                              setSidebarCollapsed(false);
                              // If clicking a group, open it and select first item
                              if (group.items.length > 0) {
                                setOpenGroup(group.id);
                                onFeatureChange(group.items[0].id);
                              }
                            }}
                            title={group.label}
                          >
                            <GroupIcon className="h-5 w-5" />
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  // Expanded view - show full navigation
                  <div className="space-y-1">
                    {/* Top-level items */}
                    {visibleTopLevelItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeFeature === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => onFeatureChange(item.id)}
                          className={cn(
                            "w-full flex items-center space-x-3 px-3 py-2 rounded-full text-sm font-medium transition-all duration-150",
                            isActive
                              ? "bg-white text-gray-900 font-medium shadow-lg"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          )}
                        >
                          <Icon className={cn(
                            "h-5 w-5 transition-colors",
                            isActive ? "text-gray-700" : "text-gray-500"
                          )} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}

                    {/* Navigation Groups with dropdowns */}
                    <div className="pt-4 space-y-1 border-t border-gray-100 mt-4">
                      {navigationGroups.map((group) => (
                        <CollapsibleNavGroup
                          key={group.id}
                          label={group.label}
                          icon={group.icon}
                          items={group.items}
                          activeFeature={activeFeature}
                          onFeatureChange={onFeatureChange}
                          isOpen={openGroup === group.id}
                          onToggle={() => handleGroupToggle(group.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Toggle Button (when sidebar is completely closed) */}
      {!sidebarOpen && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="h-12 w-8 bg-white border-r border-gray-200 shadow-sm rounded-r-lg hover:bg-gray-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}

