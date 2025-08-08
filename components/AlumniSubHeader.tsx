"use client";

import { motion } from "framer-motion";
import { Users, Users2, Building2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ViewToggle } from "@/components/ViewToggle";
import { cn } from "@/lib/utils";

type AlumniView = 'pipeline' | 'hiring' | 'chapter';

interface AlumniSubHeaderProps {
  currentView: AlumniView;
  onViewChange: (view: AlumniView) => void;
  viewMode: 'table' | 'card';
  onViewModeChange: (mode: 'table' | 'card') => void;
  selectedCount: number;
  totalCount: number;
  onBulkAction: (action: string) => void;
  onClearSelection: () => void;
}

const viewConfigs = {
  pipeline: {
    label: "Alumni Pipeline",
    icon: Users,
    description: "All alumni in your network"
  },
  hiring: {
    label: "Actively Hiring",
    icon: Building2,
    description: "Alumni with open positions"
  },
  chapter: {
    label: "My Chapter",
    icon: UserCheck,
    description: "Your chapter's alumni"
  }
};

export function AlumniSubHeader({
  currentView,
  onViewChange,
  viewMode,
  onViewModeChange,
  selectedCount,
  totalCount,
  onBulkAction,
  onClearSelection
}: AlumniSubHeaderProps) {
  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      {/* Main Header */}
      <div className="px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Left Side - Title and Stats */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Users className="h-6 w-6 text-navy-600" />
                <div>
                  <h1 className="text-navy-900 font-semibold text-lg">
                    {viewConfigs[currentView].label}
                  </h1>
                  <p className="text-gray-600 text-sm">
                    {totalCount} alumni found • {selectedCount} selected
                  </p>
                </div>
              </div>
            </div>
            
            {/* Right Side - View Toggle and Bulk Actions */}
            <div className="flex items-center space-x-4">
              {/* View Toggle */}
              <ViewToggle viewMode={viewMode} onViewChange={onViewModeChange} />
              
              {/* Bulk Actions */}
              {selectedCount > 0 && (
                <div className="flex items-center space-x-2">
                  <Badge className="bg-navy-600 text-white">
                    {selectedCount} selected
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => onBulkAction('message')}>
                    Message
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onBulkAction('tag')}>
                    Add Tag
                  </Button>
                  <Button size="sm" variant="outline" onClick={onClearSelection}>
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="px-6 pb-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex space-x-1 border-b border-gray-200">
            {Object.entries(viewConfigs).map(([key, config]) => {
              const Icon = config.icon;
              const isActive = currentView === key;
              
              return (
                <button
                  key={key}
                  onClick={() => onViewChange(key as AlumniView)}
                  className={cn(
                    "relative flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors duration-200 focus-visible:ring-2 ring-offset-2 ring-navy-500",
                    isActive 
                      ? "text-navy-600 border-b-2 border-navy-600 bg-navy-50" 
                      : "text-gray-600 hover:text-navy-700 hover:bg-gray-50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{config.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="alumni-nav-indicator"
                      className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-navy-600"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 