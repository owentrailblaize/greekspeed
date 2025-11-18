'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeatureView } from '../UnifiedExecutiveDashboard';

interface NavItem {
  id: FeatureView;
  label: string;
  icon: any;
}

interface CollapsibleNavGroupProps {
  label: string;
  icon: any;
  items: NavItem[];
  activeFeature: FeatureView;
  onFeatureChange: (feature: FeatureView) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function CollapsibleNavGroup({
  label,
  icon: Icon,
  items,
  activeFeature,
  onFeatureChange,
  isOpen,
  onToggle
}: CollapsibleNavGroupProps) {
  const hasActiveItem = items.some(item => item.id === activeFeature);

  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          hasActiveItem || isOpen
            ? "bg-gray-50 text-gray-900"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )}
      >
        <div className="flex items-center space-x-3">
          <Icon className={cn(
            "h-5 w-5 transition-colors",
            hasActiveItem || isOpen ? "text-gray-900" : "text-gray-400"
          )} />
          <span>{label}</span>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-gray-400 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      <div className={cn(
        "overflow-hidden transition-all duration-200 ease-in-out",
        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="ml-8 mt-1 space-y-0.5 py-1">
          {items.map((item) => {
            const ItemIcon = item.icon;
            const isActive = activeFeature === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onFeatureChange(item.id)}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-blue-50 text-blue-700 border-l-2 border-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <ItemIcon className={cn(
                  "h-4 w-4 transition-colors",
                  isActive ? "text-blue-600" : "text-gray-400"
                )} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

