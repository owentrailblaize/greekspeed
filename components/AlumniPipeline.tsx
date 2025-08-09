"use client";

import { useState, useEffect } from "react";
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
  activelyHiring: boolean;
  myChapter: boolean;
}

export function AlumniPipeline() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [selectedAlumni, setSelectedAlumni] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    graduationYear: "",
    industry: "",
    chapter: "",
    location: "",
    state: "",
    activelyHiring: false,
    myChapter: false,
  });

  const fetchAlumni = async (currentFilters?: FilterState) => {
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
      if (filterParams.activelyHiring) params.append('activelyHiring', 'true');
        
      console.log('Fetching alumni with params...', params.toString());
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
  }, []);

  useEffect(() => {
    if (Object.values(filters).some(value => 
      typeof value === 'boolean' ? value : value !== ''
    )) {
      fetchAlumni();
    }
  }, [filters]);

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} for ${selectedAlumni.length} alumni`);
    // TODO: Implement bulk actions
  };

  const handleClearSelection = () => {
    setSelectedAlumni([]);
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    fetchAlumni(newFilters);
    // TODO: Implement filtering logic based on new filters
  };

  const handleClearFilters = () => {
    setFilters({
      searchTerm: "",
      graduationYear: "",
      industry: "",
      chapter: "",
      location: "",
      state: "",
      activelyHiring: false,
      myChapter: false,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <AlumniSubHeader
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
        onRetry={fetchAlumni}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />
    </div>
  );
} 