"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, ChevronLeft, ChevronRight, Users, UserCheck, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlumniFilterBar } from "@/components/AlumniFilterBar";
import { AlumniTableView } from "@/components/AlumniTableView";
import { LinkedInStyleAlumniCard } from "@/components/LinkedInStyleAlumniCard";
import { Alumni } from "@/lib/mockAlumni";

interface FilterState {
  searchTerm: string;
  graduationYear: string;
  industry: string;
  chapter: string;
  location: string;
  state: string; // Add state field
}

interface AlumniPipelineLayoutProps {
  alumni: Alumni[];
  loading: boolean;
  error: string | null;
  viewMode: 'table' | 'card';
  selectedAlumni: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onRetry: () => void;
}

export function AlumniPipelineLayout({
  alumni,
  loading,
  error,
  viewMode,
  selectedAlumni,
  onSelectionChange,
  onRetry
}: AlumniPipelineLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    graduationYear: "",
    industry: "",
    chapter: "",
    location: "",
    state: "", // Add state field
  });

  const handleClearFilters = () => {
    setFilters({
      searchTerm: "",
      graduationYear: "",
      industry: "",
      chapter: "",
      location: "",
      state: "", // Add state field
    });
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  // Calculate stats
  const totalAlumni = alumni.length;
  const connectedAlumni = alumni.filter(a => a.verified).length;
  const hiringAlumni = alumni.filter(a => a.isActivelyHiring).length;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-white border-r border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="h-full flex flex-col">
              {/* Sidebar Header */}
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

              {/* Stats Section */}
              <div className="p-4 border-b border-gray-200">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Total Alumni</span>
                    </div>
                    <span className="font-semibold text-gray-900">{totalAlumni}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">Connected</span>
                    </div>
                    <span className="font-semibold text-green-600">{connectedAlumni}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Briefcase className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-gray-600">Actively Hiring</span>
                    </div>
                    <span className="font-semibold text-blue-600">{hiringAlumni}</span>
                  </div>
                </div>
              </div>

              {/* Filters Section */}
              <div className="flex-1 overflow-y-auto p-4">
                <AlumniFilterBar
                  filters={filters}
                  onFiltersChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                  isSidebar={true}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="h-8 w-8 p-0"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Alumni Pipeline</h2>
                <p className="text-sm text-gray-500">
                  {totalAlumni} alumni found
                  {selectedAlumni.length > 0 && ` • ${selectedAlumni.length} selected`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {selectedAlumni.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectionChange([])}
                  className="text-gray-600"
                >
                  Clear Selection
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
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
            <div className="p-6">
              {alumni.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No alumni found</h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search criteria or filters to find more alumni.
                  </p>
                  <Button variant="outline" onClick={handleClearFilters}>
                    Clear all filters
                  </Button>
                </div>
              ) : viewMode === 'table' ? (
                <AlumniTableView 
                  alumni={alumni}
                  selectedAlumni={selectedAlumni}
                  onSelectionChange={onSelectionChange}
                />
              ) : (
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 