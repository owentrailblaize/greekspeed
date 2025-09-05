"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, ChevronRight, Settings, Search, Users, Building2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlumniFilterBar } from "@/components/AlumniFilterBar";
import { AlumniTableView } from "@/components/AlumniTableView";
import { EnhancedAlumniCard } from "@/components/EnhancedAlumniCard";
import { AlumniToolbar } from "@/components/AlumniToolbar";
import { AlumniDetailSheet } from "@/components/AlumniDetailSheet";
import { Alumni } from "@/lib/mockAlumni";
import { exportAlumniToCSV, exportSelectedAlumniToCSV } from "@/lib/csvExport";
import { AlumniProfileModal } from "./AlumniProfileModal";
import { AlumniSubHeader } from "@/components/AlumniSubHeader";
import { ViewToggle } from "./ViewToggle";
import { Badge } from "./ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { graduationYears, industries, chapters, locations } from "@/lib/mockAlumni";
import { US_STATES, getStateNameByCode } from "@/lib/usStates";
import { useProfile } from "@/lib/hooks/useProfile";

interface FilterState {
  searchTerm: string;
  graduationYear: string;
  industry: string;
  chapter: string;
  state: string;
  activelyHiring: boolean;
  showAllAlumni: boolean; // Changed from myChapter to showAllAlumni
}

interface AlumniPipelineLayoutProps {
  alumni: Alumni[];
  loading: boolean;
  error: string | null;
  viewMode: 'table' | 'card';
  selectedAlumni: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onRetry: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  onAlumniClick?: (alumni: Alumni) => void;
}

export function AlumniPipelineLayout({
  alumni,
  loading,
  error,
  viewMode,
  selectedAlumni,
  onSelectionChange,
  onRetry,
  filters,
  onFiltersChange,
  onClearFilters,
  onAlumniClick
}: AlumniPipelineLayoutProps) {
  // Mobile-first state management
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedAlumniDetail, setSelectedAlumniDetail] = useState<Alumni | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Set mobile-specific initial state
  useEffect(() => {
    const isMobile = window.innerWidth < 768; // md breakpoint
    if (isMobile) {
      setSidebarCollapsed(true); // Start collapsed on mobile
    }
  }, []);

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} for ${selectedAlumni.length} alumni`);
    
    switch (action) {
      case 'export':
        if (selectedAlumni.length > 0) {
          const timestamp = new Date().toISOString().split('T')[0];
          exportSelectedAlumniToCSV(alumni, selectedAlumni, `trailblaize-alumni-${timestamp}.csv`);
        }
        break;
      case 'email':
        console.log('Sending email to selected alumni');
        // TODO: Implement email functionality
        break;
      case 'message':
        console.log('Sending message to selected alumni');
        // TODO: Implement message functionality
        break;
      case 'tag':
        console.log('Adding tags to selected alumni');
        // TODO: Implement tag functionality
        break;
      default:
        console.log(`Unknown bulk action: ${action}`);
    }
  };

  const handleSaveSearch = () => {
    console.log('Saving search with filters:', filters);
  };

  const handleExport = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    exportAlumniToCSV(alumni, `alumni-export-${timestamp}.csv`);
  };

  const handleAlumniClick = (alumni: Alumni) => {
    setSelectedAlumniDetail(alumni);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAlumniDetail(null);
  };

  // Calculate stats
  const totalAlumni = alumni.length;

  // Show all alumni without pagination
  const displayAlumni = alumni;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Collapsible Sidebar */}
      <div className="flex">
        {/* Main Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ 
                width: sidebarCollapsed ? 64 : (window.innerWidth < 768 ? '100vw' : 320), 
                opacity: 1 
              }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="bg-white border-r border-gray-200 shadow-sm overflow-hidden flex-shrink-0"
            >
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Filter className="h-5 w-5 text-navy-600 flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <motion.h3 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="font-semibold text-gray-900"
                        >
                          Filters
                        </motion.h3>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="h-8 w-8 p-0"
                      >
                        {sidebarCollapsed ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4 rotate-180" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSidebarOpen(false)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex-1 overflow-y-auto p-4">
                  {sidebarCollapsed ? (
                    // Collapsed view - show only icons
                    <div className="space-y-4">
                      <div className="flex flex-col items-center space-y-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0"
                          onClick={() => setSidebarCollapsed(false)}
                        >
                          <Search className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0"
                          onClick={() => setSidebarCollapsed(false)}
                        >
                          <Users className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0"
                          onClick={() => setSidebarCollapsed(false)}
                        >
                          <Filter className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Expanded view - show full filters
                    <AlumniFilterBar
                      filters={filters}
                      onFiltersChange={onFiltersChange}
                      onClearFilters={onClearFilters}
                      isSidebar={true}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar Toggle Button (when sidebar is completely closed) */}
        {!sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="h-12 w-8 bg-white border-r border-gray-200 shadow-sm rounded-r-lg hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <AlumniToolbar
          selectedCount={selectedAlumni.length}
          totalCount={totalAlumni}
          onBulkAction={handleBulkAction}
          onSaveSearch={handleSaveSearch}
          onExport={handleExport}
        />

        {/* Content with scrollable container */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading alumni...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={onRetry} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          ) : viewMode === 'table' ? (
            <div className="h-full overflow-y-auto">
              <AlumniTableView 
                alumni={displayAlumni}
                selectedAlumni={selectedAlumni}
                onSelectionChange={onSelectionChange}
              />
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayAlumni.map((alumniItem: Alumni, index: number) => (
                  <motion.div
                    key={alumniItem.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  >
                    <EnhancedAlumniCard
                      alumni={alumniItem}
                      onClick={handleAlumniClick}
                    />
                  </motion.div>
                ))}
              </div>
              
              {/* Summary footer for large datasets */}
              {displayAlumni.length > 1000 && (
                <div className="mt-8 text-center text-sm text-gray-600">
                  <p>Showing {displayAlumni.length} alumni records</p>
                  <p className="text-xs text-gray-500 mt-1">
                     Use the search and filters above to narrow down results
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 