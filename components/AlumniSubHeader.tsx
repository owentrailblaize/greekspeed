"use client";

import { Users } from "lucide-react";
import { ViewToggle } from "./ViewToggle";
import { Badge } from "./ui/badge";

interface AlumniSubHeaderProps {
  viewMode: 'table' | 'card';
  onViewModeChange: (mode: 'table' | 'card') => void;
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  userChapter?: string | null; // Add this prop
  showAllAlumni?: boolean; // Add this prop
}

export function AlumniSubHeader({
  viewMode,
  onViewModeChange,
  selectedCount,
  totalCount,
  onClearSelection,
  userChapter,
  showAllAlumni
}: AlumniSubHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
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
                  <div className="flex items-center space-x-2">
                    <p className="text-gray-600 text-sm">
                      {totalCount} alumni found • {selectedCount} selected
                    </p>
                    {userChapter && !showAllAlumni && (
                      <Badge variant="outline" className="bg-navy-50 border-navy-200 text-navy-700 text-xs">
                        Filtered by {userChapter}
                      </Badge>
                    )}
                    {showAllAlumni && (
                      <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 text-xs">
                        All Chapters
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Side - View Toggle and Bulk Actions */}
            <div className="flex items-center">
              {/* View Toggle */}
              <ViewToggle viewMode={viewMode} onViewChange={onViewModeChange} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 