"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViewToggle } from "@/components/shared/ViewToggle";
import { cn } from "@/lib/utils";

interface AlumniSubHeaderProps {
  viewMode: 'table' | 'card';
  onViewModeChange: (mode: 'table' | 'card') => void;
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onExport: () => void;
  userChapter?: string | null;
}

const exportButtonStyles =
  "h-8 rounded-full px-3 sm:px-4 text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-300 border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900";

export function AlumniSubHeader({
  viewMode,
  onViewModeChange,
  selectedCount,
  totalCount,
  onExport,
  onClearSelection: _onClearSelection,
}: AlumniSubHeaderProps) {
  // Only show "X selected" when in table view (selection is relevant there)
  const countText =
    viewMode === "table"
      ? `${totalCount} alumni • ${selectedCount} selected`
      : `${totalCount} alumni`;
  const mobileCountText =
    viewMode === "table"
      ? `${totalCount} alumni found • ${selectedCount} selected`
      : `${totalCount} alumni found`;

  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      {/* Mobile Layout */}
      <div className="sm:hidden flex items-center justify-between gap-3">
        <p className="text-gray-600 text-xs flex-shrink-0">{mobileCountText}</p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className={cn("h-7 text-xs", exportButtonStyles)}
          >
            <Download className="h-3 w-3 mr-1.5" />
            Export All
          </Button>
          <ViewToggle viewMode={viewMode} onViewChange={onViewModeChange} />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center justify-between">
        <p className="text-gray-600 text-sm">{countText}</p>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className={exportButtonStyles}
          >
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
          <ViewToggle viewMode={viewMode} onViewChange={onViewModeChange} />
        </div>
      </div>
    </div>
  );
} 