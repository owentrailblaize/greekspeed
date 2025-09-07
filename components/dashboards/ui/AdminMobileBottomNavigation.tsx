'use client';

import { Home, CheckSquare, FileText, Activity, Calendar } from 'lucide-react';

interface AdminMobileBottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AdminMobileBottomNavigation({ activeTab, onTabChange }: AdminMobileBottomNavigationProps) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'docs', label: 'Docs', icon: FileText },
    { id: 'operations', label: 'Ops', icon: Activity },
    { id: 'calendar', label: 'Calendar', icon: Calendar }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 sm:hidden">
      <div className="grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center space-y-1 ${
                isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
              <span className={`text-xs font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
