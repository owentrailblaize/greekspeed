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
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      {/* Mobile Layout - Column */}
      <div className="sm:hidden space-y-4">
        {/* Total count and selected count */}
        <p className="text-gray-600 text-sm">
          {totalCount} alumni found • {selectedCount} selected
        </p>
        
        {/* Chapter filter badge - underneath the count */}
        {userChapter && (
          <Badge variant="outline" className="bg-navy-50 border-navy-200 text-navy-700 text-xs">
            Filtered by {userChapter}
          </Badge>
        )}
        
        {/* View Toggle - Centered on mobile */}
        <div className="flex justify-center">
          <ViewToggle viewMode={viewMode} onViewChange={onViewModeChange} />
        </div>
      </div>

      {/* Desktop Layout - Row (preserved) */}
      <div className="hidden sm:flex items-center justify-between">
        {/* Left side - Title and Info */}
        <div className="flex items-center space-x-2">
          <h1 className="text-navy-900 font-semibold text-lg">
            Alumni Pipeline
          </h1>
          <p className="text-gray-600 text-sm">
            {totalCount} alumni found • {selectedCount} selected
          </p>
          {userChapter && (
            <Badge variant="outline" className="bg-navy-50 border-navy-200 text-navy-700 text-xs">
              Filtered by {userChapter}
            </Badge>
          )}
        </div>

        {/* Right side - View Toggle */}
        <div className="flex-shrink-0">
          <ViewToggle viewMode={viewMode} onViewChange={onViewModeChange} />
        </div>
      </div>
    </div>
  );
} 