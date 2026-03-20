import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlumniToolbarProps {
  onExport: () => void;
}

export function AlumniToolbar({ onExport }: AlumniToolbarProps) {
  const buttonBaseStyles = "h-8 rounded-full px-3 sm:px-4 text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-300";
  const buttonInactiveStyles = "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900";

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center">
        <Button
          variant="outline"
          onClick={() => onExport()}
          className={cn(buttonBaseStyles, buttonInactiveStyles)}
        >
          <Download className="h-4 w-4 mr-2" />
          Export All
        </Button>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="flex items-center">
          <Button
            variant="outline"
            onClick={() => onExport()}
            className={cn(buttonBaseStyles, buttonInactiveStyles)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>
    </div>
  );
}
