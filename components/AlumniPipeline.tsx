"use client";

import { useState, useEffect, useCallback } from "react";
import { AlumniPipelineLayout } from "@/components/AlumniPipelineLayout";
import { AlumniSubHeader } from "@/components/AlumniSubHeader";
import { Alumni } from "@/lib/mockAlumni";

interface FilterState {
  searchTerm: string;
  graduationYear: string;
  industry: string;
  chapter: string;
  location: string;
  state: string;
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
    state: "",
  });

  const fetchAlumni = useCallback(async (currentFilters?: FilterState) => {
    try {
      setLoading(true);
      setError(null);
      
      const filterParams = currentFilters || filters;
      const params = new URLSearchParams();
      
      // Add filter parameters
      if (filterParams.searchTerm) params.append('search', filterParams.searchTerm);
      if (filterParams.industry) params.append('industry', filterParams.industry);
      if (filterParams.chapter) params.append('chapter', filterParams.chapter);
      if (filterParams.location) params.append('location', filterParams.location);
      if (filterParams.graduationYear) params.append('graduationYear', filterParams.graduationYear);
      if (filterParams.state) params.append('state', filterParams.state);
      
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
  }, [filters]);

  useEffect(() => {
    fetchAlumni();
  }, []);

  // Debounced search function
  const debouncedFetchAlumni = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (currentFilters?: FilterState) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          fetchAlumni(currentFilters);
        }, 300);
      };
    })(),
    [fetchAlumni]
  );

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    
    // If it's a search term change, use debounced fetch
    if (newFilters.searchTerm !== filters.searchTerm) {
      debouncedFetchAlumni(newFilters);
    } else {
      // For other filters, fetch immediately
      fetchAlumni(newFilters);
    }
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      searchTerm: "",
      graduationYear: "",
      industry: "",
      chapter: "",
      location: "",
      state: "",
    };
    setFilters(clearedFilters);
    fetchAlumni(clearedFilters);
  };

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} for ${selectedAlumni.length} alumni`);
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
        totalCount={alumni.length}
        onBulkAction={handleBulkAction}
        onClearSelection={handleClearSelection}
      />

      {/* Main Layout */}
      <AlumniPipelineLayout
        alumni={alumni}
        loading={loading}
        error={error}
        viewMode={viewMode}
        selectedAlumni={selectedAlumni}
        onSelectionChange={setSelectedAlumni}
        onRetry={() => fetchAlumni()}
        filters={filters}
        onFiltersChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />
    </div>
  );
} 