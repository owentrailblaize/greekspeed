"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ViewToggle } from "@/components/ViewToggle";
import { cn } from "@/lib/utils";

interface AlumniSubHeaderProps {
  viewMode: 'table' | 'card';
  onViewModeChange: (mode: 'table' | 'card') => void;
  selectedCount: number;
  totalCount: number;
  onBulkAction: (action: string) => void;
  onClearSelection: () => void;
}

export function AlumniSubHeader({
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
                    Alumni Pipeline
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
                  <Button size="sm" variant="outline" onClick={onClearSelection}>
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 