"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AlumniPipelineLayout } from "./AlumniPipelineLayout";
import { AlumniSubHeader } from "./AlumniSubHeader";
import { Alumni } from "@/lib/alumniConstants";
import { AlumniProfileModal } from "./AlumniProfileModal";
import { useProfile } from "@/lib/contexts/ProfileContext";
// Add these imports
import { calculateAlumniCompleteness } from '@/lib/utils/profileCompleteness';
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
  const [sortedAlumni, setSortedAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [selectedAlumni, setSelectedAlumni] = useState<string[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 100, // Changed from 1000 to 100 for better performance
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
  const [selectedAlumniForModal, setSelectedAlumniForModal] = useState<Alumni | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Activity priority helper function
  const getActivityPriority = (lastActiveAt?: string): number => {
    if (!lastActiveAt) return 4; // No activity - lowest priority
    
    const lastActive = new Date(lastActiveAt);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    if (lastActive >= oneHourAgo) return 1; // Active within 1 hour - highest priority
    if (lastActive >= oneDayAgo) return 2; // Active within 24 hours - medium priority
    return 3; // Active but older than 24 hours - low priority
  };

  // Hybrid sorting function: Activity + Completeness
  const sortAlumniWithHybridLogic = (alumniData: Alumni[]) => {
    return [...alumniData].sort((a, b) => {
      // 1. Primary sort by activity priority
      const aActivityPriority = getActivityPriority(a.lastActiveAt);
      const bActivityPriority = getActivityPriority(b.lastActiveAt);
      
      if (aActivityPriority !== bActivityPriority) {
        return aActivityPriority - bActivityPriority; // Lower number = higher priority
      }
      
      // 2. Secondary sort by completeness (within same activity level)
      const aCompleteness = calculateAlumniCompleteness(a).totalScore;
      const bCompleteness = calculateAlumniCompleteness(b).totalScore;
      
      if (aCompleteness !== bCompleteness) {
        return bCompleteness - aCompleteness; // Higher completeness first
      }
      
      // 3. Tertiary sort by most recent activity time
      if (a.lastActiveAt && b.lastActiveAt) {
        const aTime = new Date(a.lastActiveAt).getTime();
        const bTime = new Date(b.lastActiveAt).getTime();
        return bTime - aTime; // More recent first
      }
      
      // 4. Fallback to name
      return a.fullName.localeCompare(b.fullName);
    });
  };

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
  const filtersRef = useRef(filters);
  const paginationRef = useRef(pagination);

  // Keep refs in sync with state
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);

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
      
      params.append('limit', '100');
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
      
      setAlumni(alumniData);
      
      if (data.pagination) {
        setPagination(data.pagination);
      }
      
      const sortedAlumniData = sortAlumniWithHybridLogic(alumniData);
      setSortedAlumni(sortedAlumniData);
      
    } catch (err) {
      console.error('❌ Error fetching alumni:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [profileChapter, accessToken]); // Only depend on stable values

  // Single useEffect - fetch when profile is ready
  useEffect(() => {
    if (profileLoading || profileId === undefined || !profileChapter) {
      return;
    }
    
    if (fetchingRef.current) {
      return;
    }
    
    fetchAlumni();
  }, [profileId, profileLoading, profileChapter, accessToken, fetchAlumni]);

  // Separate effect for filters and pagination changes
  useEffect(() => {
    if (profileLoading || profileId === undefined || !profileChapter) {
      return;
    }
    
    if (fetchingRef.current) {
      return;
    }
    
    fetchAlumni();
  }, [filters, pagination.page, fetchAlumni]);

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