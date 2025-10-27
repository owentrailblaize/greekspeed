import { Table, IdCardLanyard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  viewMode: 'table' | 'card';
  onViewChange: (mode: 'table' | 'card') => void;
}

export function ViewToggle({ viewMode, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
      {/* Cards Button - Now First (Left) */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange('card')}
        className={cn(
          "flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md transition-all duration-200",
          viewMode === 'card'
            ? "bg-white text-navy-600 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        )}
      >
        <IdCardLanyard className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="text-xs sm:text-sm font-medium">Cards</span>
      </Button>
      
      {/* Table Button - Now Second (Right) */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange('table')}
        className={cn(
          "flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md transition-all duration-200",
          viewMode === 'table'
            ? "bg-white text-navy-600 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        )}
      >
        <Table className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="text-xs sm:text-sm font-medium">Table</span>
      </Button>
    </div>
  );
} 