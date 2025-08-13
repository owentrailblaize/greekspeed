"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlumniFilterBar } from "@/components/AlumniFilterBar";
import { AlumniTableView } from "@/components/AlumniTableView";
import { LinkedInStyleAlumniCard } from "@/components/LinkedInStyleAlumniCard";
import { AlumniToolbar } from "@/components/AlumniToolbar";
import { AlumniDetailSheet } from "@/components/AlumniDetailSheet";
import { Alumni } from "@/lib/mockAlumni";
import { exportAlumniToCSV, exportSelectedAlumniToCSV } from "@/lib/csvExport";

interface FilterState {
  searchTerm: string;
  graduationYear: string;
  industry: string;
  chapter: string;
  location: string;
  state: string;
  activelyHiring: boolean;
  myChapter: boolean;
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
  onClearFilters
}: AlumniPipelineLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedAlumniDetail, setSelectedAlumniDetail] = useState<Alumni | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
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
    setDetailSheetOpen(true);
  };

  // Calculate stats
  const totalAlumni = alumni.length;

  // Show all alumni without pagination
  const displayAlumni = alumni;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Original Sidebar with AlumniFilterBar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-white border-r border-gray-200 shadow-sm overflow-hidden flex-shrink-0"
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-5 w-5 text-navy-600" />
                    <h3 className="font-semibold text-gray-900">Filters</h3>
                  </div>
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

              {/* Filters */}
              <div className="flex-1 overflow-y-auto p-4">
                <AlumniFilterBar
                  filters={filters}
                  onFiltersChange={onFiltersChange}
                  onClearFilters={onClearFilters}
                  isSidebar={true}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Enhanced Toolbar */}
        <AlumniToolbar
          selectedCount={selectedAlumni.length}
          totalCount={totalAlumni}
          onBulkAction={handleBulkAction}
          onSaveSearch={handleSaveSearch}
          onExport={handleExport}
        />

                 {/* Content Area */}
         <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading alumni...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-red-600 mb-4">
                  <p className="font-medium">Error loading alumni</p>
                  <p className="text-sm">{error}</p>
                </div>
                <Button 
                  onClick={onRetry}
                  variant="outline"
                  className="bg-navy-600 text-white hover:bg-navy-700"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <div className={viewMode === 'table' ? 'h-full' : 'p-6'}>
              {alumni.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No alumni found</h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search criteria or filters to find more alumni.
                  </p>
                  <Button variant="outline" onClick={onClearFilters}>
                    Clear all filters
                  </Button>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {displayAlumni.map((alumniItem: Alumni, index: number) => (
                     <motion.div
                       key={alumniItem.id}
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ duration: 0.5, delay: index * 0.05 }}
                       onClick={() => handleAlumniClick(alumniItem)}
                       className="cursor-pointer"
                     >
                       <LinkedInStyleAlumniCard
                         name={alumniItem.fullName}
                         description={alumniItem.description}
                         mutualConnections={alumniItem.mutualConnections}
                         mutualConnectionsCount={alumniItem.mutualConnectionsCount}
                         avatar={alumniItem.avatar}
                         verified={alumniItem.verified}
                       />
                     </motion.div>
                   ))}
                 </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Alumni Detail Sheet */}
      <AlumniDetailSheet
        alumni={selectedAlumniDetail}
        isOpen={detailSheetOpen}
        onClose={() => {
          setDetailSheetOpen(false);
          setSelectedAlumniDetail(null);
        }}
      />
    </div>
  );
} 