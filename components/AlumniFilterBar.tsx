import { useState } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectItem } from "@/components/ui/select";
import { graduationYears, industries, chapters, locations } from "@/lib/mockAlumni";
import { motion } from "framer-motion";

interface FilterState {
  searchTerm: string;
  graduationYear: string;
  industry: string;
  chapter: string;
  location: string;
}

interface AlumniFilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

export function AlumniFilterBar({ filters, onFiltersChange, onClearFilters }: AlumniFilterBarProps) {
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "");
  const activeFilterCount = Object.values(filters).filter(v => v !== "").length;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto">
        {/* Main Search and Filter Row */}
        <div className="flex items-center space-x-4 mb-4">
          {/* Search Input */}
          <div className="flex-1 relative">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search alumni by name, company, or job title..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="pl-10 bg-white border-gray-300 focus:border-navy-500 focus:ring-navy-500"
            />
          </div>
          
          {/* Filter Dropdowns */}
          <div className="flex items-center space-x-3">
            {/* Graduation Year Filter */}
            <div className="relative">
              <Select 
                value={filters.graduationYear} 
                onValueChange={(value) => handleFilterChange('graduationYear', value)}
                placeholder="Grad. Year"
                className="w-32"
              >
                <SelectItem value="">All Years</SelectItem>
                {graduationYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
                <SelectItem value="older">2019 & Earlier</SelectItem>
              </Select>
            </div>

            {/* Industry Filter */}
            <div className="relative">
              <Select 
                value={filters.industry} 
                onValueChange={(value) => handleFilterChange('industry', value)}
                placeholder="All Industries"
                className="w-36"
              >
                <SelectItem value="">All Industries</SelectItem>
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                ))}
              </Select>
            </div>

            {/* Chapter Filter */}
            <div className="relative">
              <Select 
                value={filters.chapter} 
                onValueChange={(value) => handleFilterChange('chapter', value)}
                placeholder="All Chapters"
                className="w-40"
              >
                <SelectItem value="">All Chapters</SelectItem>
                {chapters.map((chapter) => (
                  <SelectItem key={chapter} value={chapter}>{chapter}</SelectItem>
                ))}
              </Select>
            </div>

            {/* Location Filter */}
            <div className="relative">
              <Select 
                value={filters.location} 
                onValueChange={(value) => handleFilterChange('location', value)}
                placeholder="All Locations"
                className="w-36"
              >
                <SelectItem value="">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </Select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-gray-500 hover:text-gray-700 h-9"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Active Filter Tags */}
        {hasActiveFilters && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2 pt-2 border-t border-gray-100"
          >
            <span className="text-xs text-gray-500 mr-2">
              Active filters ({activeFilterCount}):
            </span>
            {filters.graduationYear && (
              <Badge variant="outline" className="text-xs bg-navy-50 border-navy-200 text-navy-700">
                Year: {filters.graduationYear}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer hover:text-navy-900" 
                  onClick={() => handleFilterChange('graduationYear', '')}
                />
              </Badge>
            )}
            {filters.industry && (
              <Badge variant="outline" className="text-xs bg-navy-50 border-navy-200 text-navy-700">
                Industry: {filters.industry}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer hover:text-navy-900" 
                  onClick={() => handleFilterChange('industry', '')}
                />
              </Badge>
            )}
            {filters.chapter && (
              <Badge variant="outline" className="text-xs bg-navy-50 border-navy-200 text-navy-700">
                Chapter: {filters.chapter}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer hover:text-navy-900" 
                  onClick={() => handleFilterChange('chapter', '')}
                />
              </Badge>
            )}
            {filters.location && (
              <Badge variant="outline" className="text-xs bg-navy-50 border-navy-200 text-navy-700">
                Location: {filters.location}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer hover:text-navy-900" 
                  onClick={() => handleFilterChange('location', '')}
                />
              </Badge>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
} 