'use client';

import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentNavigationTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Array<{ id: string; label: string; disabled?: boolean }>;
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
          const isDisabled = tab.disabled;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (!isDisabled) {
                  onTabChange(tab.id);
                }
              }}
              disabled={isDisabled}
              className={cn(
                "flex-1 relative py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-1.5",
                isActive
                  ? 'text-brand-primary'
                  : 'text-gray-500 hover:text-gray-700',
                isDisabled && 'opacity-60 cursor-not-allowed'
              )}
            >
              {tab.label}
              {isDisabled && (
                <Lock className="h-3 w-3 text-gray-400" />
              )}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary"
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

