import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AlumniPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

export function AlumniPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange
}: AlumniPaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">
          {startItem} - {endItem} of {totalItems.toLocaleString()}
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="border-gray-300 hover:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Select value={currentPage.toString()} onValueChange={(value) => onPageChange(parseInt(value))}>
          <SelectTrigger className="w-20 border-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <SelectItem key={page} value={page.toString()}>
                {page}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-sm text-gray-600">of {totalPages}</span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="border-gray-300 hover:bg-gray-50"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 