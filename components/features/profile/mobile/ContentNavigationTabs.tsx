'use client';

import { motion } from 'framer-motion';

interface ContentNavigationTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Array<{ id: string; label: string }>;
  stickyTop?: string;
}

export function ContentNavigationTabs({
  activeTab,
  onTabChange,
  tabs,
  stickyTop = '0',
}: ContentNavigationTabsProps) {
  return (
    <div className={`bg-white border-b border-gray-200 sticky z-40`} style={{ top: stickyTop }}>
      <div className="flex">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 relative py-3 px-4 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-navy-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-navy-600"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

