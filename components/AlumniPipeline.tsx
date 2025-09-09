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

export function AlumniPipeline() {
  const { profile, loading: profileLoading } = useProfile();
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [sortedAlumni, setSortedAlumni] = useState<AlumniWithCompleteness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [selectedAlumni, setSelectedAlumni] = useState<string[]>([]);
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

  const fetchAlumni = useCallback(async (currentFilters?: FilterState) => {
    try {
      setLoading(true);
      setError(null);

      const filterParams = currentFilters || filters;
      const params = new URLSearchParams();

      // Add all filter parameters including state
      if (filterParams.searchTerm) params.append('search', filterParams.searchTerm);
      if (filterParams.industry) params.append('industry', filterParams.industry);
      if (filterParams.chapter) params.append('chapter', filterParams.chapter);
      if (filterParams.graduationYear) params.append('graduationYear', filterParams.graduationYear);
      if (filterParams.state) params.append('state', filterParams.state);
      if (filterParams.activelyHiring) params.append('activelyHiring', 'true');
      
      // CRITICAL FIX: Add unlimited limit parameter
      params.append('limit', '50000'); // Request all alumni
      params.append('page', '1');
      
      // Add chapter filtering logic - only filter by user's chapter if showAllAlumni is false
      if (!filterParams.showAllAlumni && profile?.chapter) {
        params.append('userChapter', profile.chapter);
        console.log(`🔍 Filtering by user's chapter: ${profile.chapter}`);
      } else if (filterParams.showAllAlumni) {
        console.log('🌍 Showing all alumni from all chapters');
      } else {
        console.log('⚠️ No profile chapter found, showing all alumni');
      }
        
      console.log('📡 Fetching alumni with params...', params.toString());
      const response = await fetch(`/api/alumni?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch alumni');
      }
      
      const data = await response.json();
      console.log('✅ Received alumni data:', data);
      const alumniData = data.alumni || [];
      setAlumni(alumniData);
      
      // Sort alumni by completeness score (highest first)
      const sortedByCompleteness = sortAlumniByCompleteness(alumniData);
      setSortedAlumni(sortedByCompleteness);
      console.log('📊 Alumni sorted by completeness:', sortedByCompleteness.slice(0, 3).map(a => ({
        name: a.fullName,
        score: a.completenessScore.percentage,
        priority: a.completenessScore.priority
      })));
    } catch (err) {
      console.error('❌ Error fetching alumni:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters, profile]);

  // Only fetch alumni when profile is loaded and not loading
  useEffect(() => {
    if (!profileLoading && profile !== undefined) {
      console.log('👤 Profile loaded, fetching alumni...', { profile: profile?.chapter });
      fetchAlumni();
    }
  }, [profile, profileLoading, fetchAlumni]);

  // Handle filter changes
  useEffect(() => {
    if (!profileLoading && profile !== undefined && Object.values(filters).some(value => 
      typeof value === 'boolean' ? value : value !== ''
    )) {
      console.log('🔧 Filters changed, refetching alumni...');
      fetchAlumni();
    }
  }, [filters, profile, profileLoading, fetchAlumni]);

  const handleClearSelection = () => {
    setSelectedAlumni([]);
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    console.log('🔧 Filters changing:', newFilters);
    setFilters(newFilters);
    // Don't call fetchAlumni here - let the useEffect handle it
  };

  const handleClearFilters = () => {
    console.log('🧹 Clearing filters...');
    setFilters({
      searchTerm: "",
      graduationYear: "",
      industry: "",
      chapter: "",
      state: "",
      activelyHiring: false,
      showAllAlumni: false, // Reset to default (only user's chapter)
    });
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
        totalCount={alumni.length}
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