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
      {totalPages <= 5 && (
        <div className="flex items-center space-x-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className={`h-8 w-8 p-0 text-xs ${
                currentPage === page
                  ? 'bg-navy-600 text-white hover:bg-navy-700'
                  : 'hover:bg-gray-50'
              }`}
            >
              {page}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}