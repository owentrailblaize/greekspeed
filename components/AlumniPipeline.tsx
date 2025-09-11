"use client";

import { useState, useEffect, useCallback } from "react";
import { AlumniPipelineLayout } from "@/components/AlumniPipelineLayout";
import { AlumniSubHeader } from "@/components/AlumniSubHeader";
import { Alumni } from "@/lib/mockAlumni";
import { AlumniProfileModal } from "./AlumniProfileModal";
import { useProfile } from "@/lib/hooks/useProfile";
import { sortAlumniByCompleteness, AlumniWithCompleteness } from "@/lib/utils/profileCompleteness";

interface FilterState {
  searchTerm: string;
  graduationYear: string;
  industry: string;
  chapter: string;
  state: string;
  activelyHiring: boolean;
  showAllAlumni: boolean;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function AlumniPipeline() {
  const { profile, loading: profileLoading } = useProfile();
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [sortedAlumni, setSortedAlumni] = useState<AlumniWithCompleteness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [selectedAlumni, setSelectedAlumni] = useState<string[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 1000,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    graduationYear: "",
    industry: "",
    chapter: "",
    state: "",
    activelyHiring: false,
    showAllAlumni: false, // Default to false (only show user's chapter)
  });
  const [selectedAlumniForModal, setSelectedAlumniForModal] = useState<Alumni | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAlumniClick = (alumni: Alumni) => {
    setSelectedAlumniForModal(alumni);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAlumniForModal(null);
  };

  const fetchAlumni = useCallback(async (currentFilters?: FilterState, currentPage?: number) => {
    try {
      setLoading(true);
      setError(null);

      const filterParams = currentFilters || filters;
      const pageToFetch = currentPage || pagination.page;
      const params = new URLSearchParams();

      // Add all filter parameters including state
      if (filterParams.searchTerm) params.append('search', filterParams.searchTerm);
      if (filterParams.industry) params.append('industry', filterParams.industry);
      if (filterParams.chapter) params.append('chapter', filterParams.chapter);
      if (filterParams.graduationYear) params.append('graduationYear', filterParams.graduationYear);
      if (filterParams.state) params.append('state', filterParams.state);
      if (filterParams.activelyHiring) params.append('activelyHiring', 'true');
      
      // Add pagination parameters
      params.append('limit', pagination.limit.toString());
      params.append('page', pageToFetch.toString());
      
      // Add chapter filtering logic - only filter by user's chapter if showAllAlumni is false
      if (!filterParams.showAllAlumni && profile?.chapter) {
        params.append('userChapter', profile.chapter);
      }
        
      const response = await fetch(`/api/alumni?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch alumni');
      }
      
      const data = await response.json();
      const alumniData = data.alumni || [];
      setAlumni(alumniData);
      
      // Update pagination state
      if (data.pagination) {
        setPagination(data.pagination);
      }
      
      // Sort alumni by completeness score (highest first)
      const sortedByCompleteness = sortAlumniByCompleteness(alumniData);
      setSortedAlumni(sortedByCompleteness);
    } catch (err) {
      console.error('❌ Error fetching alumni:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters, profile, pagination.page, pagination.limit]);

  // Only fetch alumni when profile is loaded and not loading
  useEffect(() => {
    if (!profileLoading && profile !== undefined) {
      fetchAlumni();
    }
  }, [profile, profileLoading, fetchAlumni]);

  // Handle filter changes
  useEffect(() => {
    if (!profileLoading && profile !== undefined && Object.values(filters).some(value => 
      typeof value === 'boolean' ? value : value !== ''
    )) {
      fetchAlumni();
    }
  }, [filters, profile, profileLoading, fetchAlumni]);

  const handleClearSelection = () => {
    setSelectedAlumni([]);
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    // Don't call fetchAlumni here - let the useEffect handle it
  };

  const handleClearFilters = () => {
    setFilters({
      searchTerm: "",
      graduationYear: "",
      industry: "",
      chapter: "",
      state: "",
      activelyHiring: false,
      showAllAlumni: false, // Reset to default (only user's chapter)
    });
    // Reset to first page when clearing filters
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchAlumni(filters, newPage);
  };

  // Show loading state while profile is loading
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <AlumniSubHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedCount={selectedAlumni.length}
        totalCount={pagination.total}
        onClearSelection={handleClearSelection}
        userChapter={profile?.chapter}
        showAllAlumni={filters.showAllAlumni}
      />

      {/* Main Layout */}
      <AlumniPipelineLayout
        alumni={sortedAlumni}
        loading={loading}
        error={error}
        viewMode={viewMode}
        selectedAlumni={selectedAlumni}
        onSelectionChange={setSelectedAlumni}
        onRetry={fetchAlumni}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        onAlumniClick={handleAlumniClick}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {/* Alumni Profile Modal */}
      {selectedAlumniForModal && (
        <AlumniProfileModal
          alumni={selectedAlumniForModal}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
} 