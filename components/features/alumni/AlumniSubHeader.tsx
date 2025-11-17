"use client";

import { Users } from "lucide-react";
import { ViewToggle } from "@/components/shared/ViewToggle";
import { Badge } from "@/components/ui/badge";

interface AlumniSubHeaderProps {
  viewMode: 'table' | 'card';
  onViewModeChange: (mode: 'table' | 'card') => void;
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  userChapter?: string | null; // Add this prop
}

export function AlumniSubHeader({
  viewMode,
  onViewModeChange,
  selectedCount,
  totalCount,
  onClearSelection,
  userChapter
}: AlumniSubHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 pb-6 sm:pb-4">
      {/* Mobile Layout - Row */}
      <div className="sm:hidden flex items-center justify-between gap-3">
        {/* Total count and selected count - smaller text */}
        <p className="text-gray-600 text-xs flex-shrink-0">
          {totalCount} alumni found • {selectedCount} selected
        </p>
        {/* View Toggle - aligned on same row */}
        <div className="flex-shrink-0">
          <ViewToggle viewMode={viewMode} onViewChange={onViewModeChange} />
        </div>
      </div>

      {/* Desktop Layout - Row (preserved) */}
      <div className="hidden sm:flex items-center justify-between">
        {/* Left side - Title and Info */}
        <div className="flex items-center space-x-2">
          <p className="text-gray-600 text-sm">
            {totalCount} alumni • {selectedCount} selected
          </p>
        </div>

        {/* Right side - View Toggle */}
        <div className="flex-shrink-0">
          <ViewToggle viewMode={viewMode} onViewChange={onViewModeChange} />
        </div>
      </div>
    </div>
  );
} 