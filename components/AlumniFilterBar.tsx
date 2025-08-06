import { useState } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "");

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto">
        {/* Main Search Bar */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search alumni by name, company, or job title..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="pl-10 bg-white border-gray-300 focus:border-navy-500 focus:ring-navy-500"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center space-x-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <Badge className="bg-navy-600 text-white text-xs">
                  {Object.values(filters).filter(v => v !== "").length}
                </Badge>
              )}
            </Button>
            
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200"
          >
            <Select value={filters.graduationYear} onValueChange={(value) => handleFilterChange('graduationYear', value)}>
              <SelectTrigger className="bg-white border-gray-300">
                <SelectValue placeholder="Graduation Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Years</SelectItem>
                {graduationYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
                <SelectItem value="older">2019 & Earlier</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.industry} onValueChange={(value) => handleFilterChange('industry', value)}>
              <SelectTrigger className="bg-white border-gray-300">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Industries</SelectItem>
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.chapter} onValueChange={(value) => handleFilterChange('chapter', value)}>
              <SelectTrigger className="bg-white border-gray-300">
                <SelectValue placeholder="Chapter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Chapters</SelectItem>
                {chapters.map((chapter) => (
                  <SelectItem key={chapter} value={chapter}>{chapter}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.location} onValueChange={(value) => handleFilterChange('location', value)}>
              <SelectTrigger className="bg-white border-gray-300">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        )}

        {/* Active Filter Tags */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-4">
            {filters.graduationYear && (
              <Badge variant="outline" className="text-xs">
                Year: {filters.graduationYear}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => handleFilterChange('graduationYear', '')}
                />
              </Badge>
            )}
            {filters.industry && (
              <Badge variant="outline" className="text-xs">
                Industry: {filters.industry}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => handleFilterChange('industry', '')}
                />
              </Badge>
            )}
            {filters.chapter && (
              <Badge variant="outline" className="text-xs">
                Chapter: {filters.chapter}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => handleFilterChange('chapter', '')}
                />
              </Badge>
            )}
            {filters.location && (
              <Badge variant="outline" className="text-xs">
                Location: {filters.location}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => handleFilterChange('location', '')}
                />
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 