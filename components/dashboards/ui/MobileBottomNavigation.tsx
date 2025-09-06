'use client';

import { Home, CheckSquare, MessageSquare, Calendar, Users } from 'lucide-react';

export type MobileTab = 'home' | 'tasks' | 'announcements' | 'calendar' | 'events';

interface MobileBottomNavigationProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

export function MobileBottomNavigation({ activeTab, onTabChange }: MobileBottomNavigationProps) {
  const tabs = [
    {
      id: 'home' as MobileTab,
      label: 'Home',
      icon: Home,
      activeColor: 'text-blue-600',
      inactiveColor: 'text-gray-500'
    },
    {
      id: 'tasks' as MobileTab,
      label: 'Tasks',
      icon: CheckSquare,
      activeColor: 'text-blue-600',
      inactiveColor: 'text-gray-500'
    },
    {
      id: 'announcements' as MobileTab,
      label: 'News',
      icon: MessageSquare,
      activeColor: 'text-blue-600',
      inactiveColor: 'text-gray-500'
    },
    {
      id: 'calendar' as MobileTab,
      label: 'Calendar',
      icon: Calendar,
      activeColor: 'text-blue-600',
      inactiveColor: 'text-gray-500'
    },
    {
      id: 'events' as MobileTab,
      label: 'Events',
      icon: Users,
      activeColor: 'text-blue-600',
      inactiveColor: 'text-gray-500'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 sm:hidden">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 transition-colors ${
                isActive ? tab.activeColor : tab.inactiveColor
              }`}
            >
              <Icon className={`h-5 w-5 mb-1 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
              <span className={`text-xs font-medium truncate ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
