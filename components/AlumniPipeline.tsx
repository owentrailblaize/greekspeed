"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkedInStyleAlumniCard } from "@/components/LinkedInStyleAlumniCard";
import { AlumniTableView } from "@/components/AlumniTableView";
import { AlumniFilterBar } from "@/components/AlumniFilterBar";
import { AlumniSubHeader } from "@/components/AlumniSubHeader";
import { Alumni } from "@/lib/mockAlumni";

interface FilterState {
  searchTerm: string;
  graduationYear: string;
  industry: string;
  chapter: string;
  location: string;
}

export function AlumniPipeline() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const fetchAlumni = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters.searchTerm) params.append('search', filters.searchTerm);
      if (filters.industry) params.append('industry', filters.industry);
      if (filters.chapter) params.append('chapter', filters.chapter);
      if (filters.location) params.append('location', filters.location);
      if (filters.graduationYear) params.append('graduationYear', filters.graduationYear);
      
      console.log('Fetching alumni with params:', params.toString());
      const response = await fetch(`/api/alumni?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch alumni');
      }
      
      const data = await response.json();
      console.log('Received alumni data:', data);
      setAlumni(data.alumni || []);
    } catch (err) {
      console.error('Error fetching alumni:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlumni();
  }, [filters]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading alumni...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <AlumniSubHeader
        currentView={currentView}
        onViewChange={setCurrentView}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedCount={selectedAlumni.length}
        totalCount={alumni.length}
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
        {/* Error State */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="text-red-600 mb-4">
              <p className="font-medium">Error loading alumni</p>
              <p className="text-sm">{error}</p>
            </div>
            <Button 
              onClick={fetchAlumni}
              variant="outline"
              className="bg-navy-600 text-white hover:bg-navy-700"
            >
              Try Again
            </Button>
          </motion.div>
        )}

        {/* Content when data is loaded */}
        {!loading && !error && (
          <AnimatePresence mode="wait">
            {alumni.length === 0 ? (
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
                  alumni={alumni}
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
                  {alumni.map((alumniItem, index) => (
                    <motion.div
                      key={alumniItem.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
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
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
} 