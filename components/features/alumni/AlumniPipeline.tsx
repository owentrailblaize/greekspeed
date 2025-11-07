"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AlumniPipelineLayout } from "./AlumniPipelineLayout";
import { AlumniSubHeader } from "./AlumniSubHeader";
import { Alumni } from "@/lib/alumniConstants";
import { AlumniProfileModal } from "./AlumniProfileModal";
import { useProfile } from "@/lib/contexts/ProfileContext";
import { useAuth } from "@/lib/supabase/auth-context";

interface FilterState {
  searchTerm: string;
  graduationYear: string;
  industry: string;
  state: string;
  activelyHiring: boolean;
  showActiveOnly: boolean; // 🔥 NEW: Active alumni filter
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
  const { session } = useAuth(); // ✅ Add this
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [selectedAlumni, setSelectedAlumni] = useState<string[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 24, // Optimized: Reduced from 100 to 24 for faster initial load (60-70% improvement)
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    graduationYear: "",
    industry: "",
    state: "",
    activelyHiring: false,
    showActiveOnly: false, // 🔥 NEW: Active alumni filter
  });
  // Debounced filters for API calls (500ms delay)
  const [debouncedFilters, setDebouncedFilters] = useState<FilterState>(filters);
  const [selectedAlumniForModal, setSelectedAlumniForModal] = useState<Alumni | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Note: Sorting is now done server-side for better performance
  // No client-side sorting needed - data comes pre-sorted from API

  const handleAlumniClick = (alumni: Alumni) => {
    setSelectedAlumniForModal(alumni);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAlumniForModal(null);
  };

  // Extract stable primitive values from profile
  const profileChapter = useMemo(() => profile?.chapter, [profile?.chapter]);
  const profileId = useMemo(() => profile?.id, [profile?.id]);
  
  // Stabilize session access token
  const accessToken = useMemo(() => session?.access_token, [session?.access_token]);
  
  // Add refs to prevent concurrent fetches
  const fetchingRef = useRef(false);
  const filtersRef = useRef(debouncedFilters);
  const paginationRef = useRef(pagination);
  const fetchAlumniRef = useRef<((currentFilters?: FilterState, currentPage?: number) => Promise<void>) | undefined>(undefined);

  // Debounce filter changes - 500ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500); // 500ms debounce as per requirements

    return () => clearTimeout(timer); // Cleanup on unmount or filter change
  }, [filters]);

  // Keep refs in sync with state
  useEffect(() => {
    filtersRef.current = debouncedFilters;
  }, [debouncedFilters]);

  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);

  // Memoize filter dependencies for stable comparison
  const filterDependency = useMemo(() => {
    return {
      searchTerm: debouncedFilters.searchTerm,
      graduationYear: debouncedFilters.graduationYear,
      industry: debouncedFilters.industry,
      state: debouncedFilters.state,
      activelyHiring: debouncedFilters.activelyHiring,
      showActiveOnly: debouncedFilters.showActiveOnly,
    };
  }, [
    debouncedFilters.searchTerm,
    debouncedFilters.graduationYear,
    debouncedFilters.industry,
    debouncedFilters.state,
    debouncedFilters.activelyHiring,
    debouncedFilters.showActiveOnly,
  ]);

  const fetchAlumni = useCallback(async (currentFilters?: FilterState, currentPage?: number) => {
    // Prevent concurrent fetches
    if (fetchingRef.current) {
      return;
    }
    
    try {
      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      const filterParams = currentFilters || filtersRef.current;
      const pageToFetch = currentPage || paginationRef.current.page;
      const params = new URLSearchParams();

      // Add all filter parameters
      if (filterParams.searchTerm) params.append('search', filterParams.searchTerm);
      if (filterParams.industry) params.append('industry', filterParams.industry);
      if (filterParams.graduationYear) params.append('graduationYear', filterParams.graduationYear);
      if (filterParams.state) params.append('state', filterParams.state);
      if (filterParams.activelyHiring) params.append('activelyHiring', 'true');
      if (filterParams.showActiveOnly) params.append('showActiveOnly', 'true');
      
      params.append('limit', '24'); // Optimized: Reduced from 100 to 24 for better performance
      params.append('page', pageToFetch.toString());
      
      if (profileChapter) {
        params.append('userChapter', profileChapter);
      }
        
      const headers: HeadersInit = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`/api/alumni?${params.toString()}`, {
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch alumni');
      }
      
      const data = await response.json();
      const alumniData = data.alumni || [];
      
      // Data is already sorted server-side for better performance
      setAlumni(alumniData);
      
      if (data.pagination) {
        setPagination(data.pagination);
      }
      
    } catch (err) {
      console.error('❌ Error fetching alumni:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [profileChapter, accessToken]); // Only depend on stable values

  // Keep fetchAlumni ref in sync
  useEffect(() => {
    fetchAlumniRef.current = fetchAlumni;
  }, [fetchAlumni]);

  // Consolidated useEffect - handles all fetch triggers
  useEffect(() => {
    // Don't fetch if profile is still loading or not available
    if (profileLoading || profileId === undefined || !profileChapter) {
      return;
    }
    
    // Don't fetch if already fetching
    if (fetchingRef.current) {
      return;
    }
    
    // Call fetchAlumni using the ref (avoids dependency loop)
    if (fetchAlumniRef.current) {
      fetchAlumniRef.current();
    }
  }, [
    profileId,
    profileLoading,
    profileChapter,
    accessToken,
    filterDependency, // Memoized filter dependency
    pagination.page, // Pagination changes trigger fetch
  ]);

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
      state: "",
      activelyHiring: false,
      showActiveOnly: false, // 🔥 NEW: Active alumni filter
    });
    // Reset to first page when clearing filters
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    // Fetch will be triggered by the consolidated useEffect when pagination.page changes
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