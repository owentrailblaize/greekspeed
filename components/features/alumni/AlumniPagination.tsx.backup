import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AlumniPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function AlumniPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange
}: AlumniPaginationProps) {
  // Calculate the range of items being displayed
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Only show pagination if there are multiple pages
  if (totalPages <= 1) {
    return (
      <div className="flex flex-col items-center space-y-3 pt-4 border-t border-gray-200 mt-4">
        <div className="text-xs text-gray-600">
          Showing {totalItems.toLocaleString()} alumni
        </div>
      </div>
    );
  }

  // Smart pagination algorithm
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    
    // Configuration: how many pages to show on each side
    const sides = 2; // Pages to show on each side of current (e.g., 2 = current-2, current-1, current, current+1, current+2)
    const firstPages = 3; // Always show first N pages
    const lastPages = 3; // Always show last N pages
    
    // If total pages is small, show all
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Always add first page
    pages.push(1);
    
    // Calculate the range around current page
    const startRange = Math.max(2, currentPage - sides);
    const endRange = Math.min(totalPages - 1, currentPage + sides);
    
    // Determine if we're near the start, middle, or end
    const nearStart = currentPage <= firstPages + 1;
    const nearEnd = currentPage >= totalPages - lastPages;
    
    if (nearStart) {
      // Near start: show first pages, then ellipsis, then last pages
      // Example: 1, 2, 3, 4, 5, ..., 87, 88, 89
      for (let i = 2; i <= Math.min(firstPages + 2, totalPages - lastPages); i++) {
        pages.push(i);
      }
      
      // Add ellipsis if there's a gap
      if (totalPages - lastPages > firstPages + 2) {
        pages.push('ellipsis');
      }
      
      // Add last pages
      for (let i = Math.max(totalPages - lastPages + 1, firstPages + 3); i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (nearEnd) {
      // Near end: show first pages, ellipsis, then last pages
      // Example: 1, 2, 3, ..., 85, 86, 87, 88, 89
      for (let i = 2; i <= firstPages; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if there's a gap
      if (totalPages - lastPages > firstPages + 1) {
        pages.push('ellipsis');
      }
      
      // Add last pages
      for (let i = Math.max(firstPages + 1, totalPages - lastPages); i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // In the middle: show first pages, ellipsis, current range, ellipsis, last pages
      // Example: 1, 2, 3, ..., 5, 6, 7, 8, 9, ..., 87, 88, 89
      
      // Add first pages
      for (let i = 2; i <= firstPages; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if there's a gap before current range
      if (startRange > firstPages + 1) {
        pages.push('ellipsis');
      }
      
      // Add pages around current
      for (let i = startRange; i <= endRange; i++) {
        // Avoid duplicates (if startRange overlaps with firstPages)
        if (i > firstPages) {
          pages.push(i);
        }
      }
      
      // Add ellipsis if there's a gap after current range
      if (endRange < totalPages - lastPages) {
        pages.push('ellipsis');
      }
      
      // Add last pages
      for (let i = Math.max(endRange + 1, totalPages - lastPages + 1); i <= totalPages; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col items-center space-y-3 pt-4 border-t border-gray-200 mt-4">
      <div className="text-xs text-gray-600">
        Showing {startItem} to {endItem} of {totalItems.toLocaleString()} alumni
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 px-3 text-xs"
        >
          <ChevronLeft className="h-3.5 w-3.5 mr-1" />
          Previous
        </Button>
        <div className="flex items-center space-x-1 px-2">
          <span className="text-xs text-gray-600">Page</span>
          <span className="text-xs font-medium">{currentPage}</span>
          <span className="text-xs text-gray-600">of</span>
          <span className="text-xs font-medium">{totalPages}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 px-3 text-xs"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>
      {/* Page number buttons */}
      <div className="flex items-center space-x-1 flex-wrap justify-center gap-1">
        {pageNumbers.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span 
                key={`ellipsis-${index}`} 
                className="text-xs text-gray-400 px-2 py-1"
                aria-label="More pages"
              >
                ...
              </span>
            );
          }
          
          return (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className={`h-8 w-8 p-0 text-xs transition-colors ${
                currentPage === page
                  ? 'bg-navy-600 text-white hover:bg-navy-700 font-semibold'
                  : 'hover:bg-gray-100 border-gray-300'
              }`}
              aria-label={`Go to page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </Button>
          );
        })}
      </div>
    </div>
  );
}