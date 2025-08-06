"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkedInStyleAlumniCard } from "@/components/LinkedInStyleAlumniCard";
import { AlumniTableView } from "@/components/AlumniTableView";
import { AlumniFilterBar } from "@/components/AlumniFilterBar";
import { AlumniSubHeader } from "@/components/AlumniSubHeader";
import { mockAlumniData, Alumni } from "@/lib/mockAlumni";

interface FilterState {
  searchTerm: string;
  graduationYear: string;
  industry: string;
  chapter: string;
  location: string;
}

export function AlumniPipeline() {
  const [currentView, setCurrentView] = useState<'pipeline' | 'hiring' | 'chapter'>('pipeline');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [selectedAlumni, setSelectedAlumni] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    graduationYear: "",
    industry: "",
    chapter: "",
    location: "",
  });

  // Filter alumni based on current filters and view
  const filteredAlumni = useMemo(() => {
    let baseAlumni = mockAlumniData;
    
    // Filter by view type
    switch (currentView) {
      case 'hiring':
        baseAlumni = mockAlumniData.filter(alumni => alumni.isActivelyHiring);
        break;
      case 'chapter':
        baseAlumni = mockAlumniData.filter(alumni => alumni.chapter === 'Sigma Chi'); // Example: filter by current user's chapter
        break;
      default:
        baseAlumni = mockAlumniData;
    }

    return baseAlumni.filter((alumni) => {
      const matchesSearch = !filters.searchTerm || 
        alumni.fullName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        alumni.company.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        alumni.jobTitle.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      const matchesYear = !filters.graduationYear || 
        (filters.graduationYear === 'older' ? alumni.graduationYear <= 2019 : 
         alumni.graduationYear.toString() === filters.graduationYear);
      
      const matchesIndustry = !filters.industry || alumni.industry === filters.industry;
      const matchesChapter = !filters.chapter || alumni.chapter === filters.chapter;
      const matchesLocation = !filters.location || alumni.location === filters.location;

      return matchesSearch && matchesYear && matchesIndustry && matchesChapter && matchesLocation;
    });
  }, [filters, currentView]);

  const handleClearFilters = () => {
    setFilters({
      searchTerm: "",
      graduationYear: "",
      industry: "",
      chapter: "",
      location: "",
    });
  };

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} for ${selectedAlumni.length} alumni`);
    // TODO: Implement bulk actions
  };

  const handleClearSelection = () => {
    setSelectedAlumni([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <AlumniSubHeader
        currentView={currentView}
        onViewChange={setCurrentView}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedCount={selectedAlumni.length}
        totalCount={filteredAlumni.length}
        onBulkAction={handleBulkAction}
        onClearSelection={handleClearSelection}
      />

      {/* Filter Bar */}
      <AlumniFilterBar 
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={handleClearFilters}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {filteredAlumni.length === 0 ? (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12"
            >
              <Users2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No alumni found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or filters to find more alumni.
              </p>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear all filters
              </Button>
            </motion.div>
          ) : viewMode === 'table' ? (
            <motion.div
              key="table-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AlumniTableView 
                alumni={filteredAlumni}
                selectedAlumni={selectedAlumni}
                onSelectionChange={setSelectedAlumni}
              />
            </motion.div>
          ) : (
            <motion.div
              key="card-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAlumni.map((alumni, index) => (
                  <motion.div
                    key={alumni.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  >
                    <LinkedInStyleAlumniCard
                      name={alumni.fullName}
                      description={alumni.description}
                      mutualConnections={alumni.mutualConnections}
                      mutualConnectionsCount={alumni.mutualConnectionsCount}
                      avatar={alumni.avatar}
                      verified={alumni.verified}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 