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
}

export function AlumniPipeline() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'pipeline' | 'hiring' | 'chapter'>('pipeline');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [selectedAlumni, setSelectedAlumni] = useState<string[]>([]);

  const fetchAlumni = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching alumni...');
      const response = await fetch(`/api/alumni`);
      
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
      />
    </div>
  );
} 