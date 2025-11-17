// POSSIBLY MAKE THE TOOLBAR STICKY TO THE TOP OF THE PAGE LATER
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Workflow, 
  Save, 
  Star, 
  Download, 
  Upload,
  Mail, 
  MessageSquare,
  Calendar,
  Tag,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AlumniToolbarProps {
  selectedCount: number;
  totalCount: number;
  onBulkAction: (action: string) => void;
  onSaveSearch: () => void;
  onExport: () => void;
}

export function AlumniToolbar({ 
  selectedCount, 
  totalCount, 
  onBulkAction, 
  onSaveSearch, 
  onExport 
}: AlumniToolbarProps) {
  const handleNonFunctionalFeature = (featureName: string) => {
    // Feature coming soon!
    // Could add a toast notification here
  };

  // Shared button styling to match header
  const buttonBaseStyles = "h-8 rounded-full px-3 sm:px-4 text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-300";
  const buttonActiveStyles = "bg-gray-100 text-gray-900 hover:bg-gray-50";
  const buttonInactiveStyles = "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900";
  const buttonDisabledStyles = "opacity-60 cursor-not-allowed bg-gray-50 text-gray-400 border border-gray-200";

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Export - Direct CSV download button */}
          <Button 
            variant="outline"
            onClick={() => onExport()}
            className={cn(buttonBaseStyles, buttonInactiveStyles)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>

          {/* Create Workflow - LOCKED */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                disabled
                className={cn(buttonBaseStyles, buttonDisabledStyles)}
              >
                <Workflow className="h-4 w-4 mr-2" />
                Create workflow
                <Lock className="h-3 w-3 ml-2 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="opacity-60 cursor-not-allowed" disabled>
                <Mail className="h-4 w-4 mr-2" />
                Email Campaign
                <Lock className="h-3 w-3 ml-auto text-gray-400" />
              </DropdownMenuItem>
              <DropdownMenuItem className="opacity-60 cursor-not-allowed" disabled>
                <MessageSquare className="h-4 w-4 mr-2" />
                Message Sequence
                <Lock className="h-3 w-3 ml-auto text-gray-400" />
              </DropdownMenuItem>
              <DropdownMenuItem className="opacity-60 cursor-not-allowed" disabled>
                <Calendar className="h-4 w-4 mr-2" />
                Meeting Reminder
                <Lock className="h-3 w-3 ml-auto text-gray-400" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Save List - LOCKED */}
          <Button 
            variant="outline" 
            onClick={() => handleNonFunctionalFeature('Save List')}
            disabled
            className={cn(buttonBaseStyles, buttonDisabledStyles)}
          >
            <Save className="h-4 w-4 mr-2" />
            Save list
            <Lock className="h-3 w-3 ml-2 text-gray-400" />
          </Button>

          {/* Research with AI - LOCKED */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                disabled
                className={cn(buttonBaseStyles, buttonDisabledStyles)}
              >
                <Star className="h-4 w-4 mr-2" />
                Research with AI
                <Lock className="h-3 w-3 ml-2 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="opacity-60 cursor-not-allowed" disabled>
                Generate Email
                <Lock className="h-3 w-3 ml-auto text-gray-400" />
              </DropdownMenuItem>
              <DropdownMenuItem className="opacity-60 cursor-not-allowed" disabled>
                Find Similar Alumni
                <Lock className="h-3 w-3 ml-auto text-gray-400" />
              </DropdownMenuItem>
              <DropdownMenuItem className="opacity-60 cursor-not-allowed" disabled>
                Career Insights
                <Lock className="h-3 w-3 ml-auto text-gray-400" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Import - LOCKED */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                disabled
                className={cn(buttonBaseStyles, buttonDisabledStyles)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
                <Lock className="h-3 w-3 ml-2 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="opacity-60 cursor-not-allowed" disabled>
                Import CSV
                <Lock className="h-3 w-3 ml-auto text-gray-400" />
              </DropdownMenuItem>
              <DropdownMenuItem className="opacity-60 cursor-not-allowed" disabled>
                Import from LinkedIn
                <Lock className="h-3 w-3 ml-auto text-gray-400" />
              </DropdownMenuItem>
              <DropdownMenuItem className="opacity-60 cursor-not-allowed" disabled>
                Bulk Import
                <Lock className="h-3 w-3 ml-auto text-gray-400" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {selectedCount > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {selectedCount} of {totalCount} selected
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={cn(buttonBaseStyles, buttonInactiveStyles, "h-8")}
                >
                  Bulk Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onBulkAction('export')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem className="opacity-60 cursor-not-allowed" disabled>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                  <Lock className="h-3 w-3 ml-auto text-gray-400" />
                </DropdownMenuItem>
                <DropdownMenuItem className="opacity-60 cursor-not-allowed" disabled>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                  <Lock className="h-3 w-3 ml-auto text-gray-400" />
                </DropdownMenuItem>
                <DropdownMenuItem className="opacity-60 cursor-not-allowed" disabled>
                  <Tag className="h-4 w-4 mr-2" />
                  Add Tags
                  <Lock className="h-3 w-3 ml-auto text-gray-400" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
          {/* Export - Direct CSV download button */}
          <Button 
            variant="outline"
            onClick={() => onExport()}
            className={cn(buttonBaseStyles, buttonInactiveStyles, "flex-shrink-0")}
          >
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>

          {/* Create Workflow - LOCKED */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                disabled
                className={cn(buttonBaseStyles, buttonDisabledStyles, "flex-shrink-0")}
              >
                <Workflow className="h-4 w-4 mr-2" />
                Create workflow
                <Lock className="h-3 w-3 ml-2 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="opacity-60 cursor-not-allowed" disabled>
                <Mail className="h-4 w-4 mr-2" />
                Email Campaign
                <Lock className="h-3 w-3 ml-auto text-gray-400" />
              </DropdownMenuItem>
              <DropdownMenuItem className="opacity-60 cursor-not-allowed" disabled>
                <MessageSquare className="h-4 w-4 mr-2" />
                Message Sequence
                <Lock className="h-3 w-3 ml-auto text-gray-400" />
              </DropdownMenuItem>
              <DropdownMenuItem className="opacity-60 cursor-not-allowed" disabled>
                <Calendar className="h-4 w-4 mr-2" />
                Meeting Reminder
                <Lock className="h-3 w-3 ml-auto text-gray-400" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Save List - LOCKED */}
          <Button 
            variant="outline" 
            onClick={() => handleNonFunctionalFeature('Save List')}
            disabled
            className={cn(buttonBaseStyles, buttonDisabledStyles, "flex-shrink-0")}
          >
            <Save className="h-4 w-4 mr-2" />
            Save list
            <Lock className="h-3 w-3 ml-2 text-gray-400" />
          </Button>

          {/* Research with AI - LOCKED */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                disabled
                className={cn(buttonBaseStyles, buttonDisabledStyles, "flex-shrink-0")}
              >
                <Star className="h-4 w-4 mr-2" />
                Research with AI
                <Lock className="h-3 w-3 ml-2 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="opacity-60 cursor-not-allowed" disabled>
                Generate Email
                <Lock className="h-3 w-3 ml-auto text-gray-400" />
              </DropdownMenuItem>
              <DropdownMenuItem className="opacity-60 cursor-not-allowed" disabled>
                Find Similar Alumni
                <Lock className="h-3 w-3 ml-auto text-gray-400" />
              </DropdownMenuItem>
              <DropdownMenuItem className="opacity-60 cursor-not-allowed" disabled>
                Career Insights
                <Lock className="h-3 w-3 ml-auto text-gray-400" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Import - LOCKED */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                disabled
                className={cn(buttonBaseStyles, buttonDisabledStyles, "flex-shrink-0")}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
                <Lock className="h-3 w-3 ml-2 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="opacity-60 cursor-not-allowed" disabled>
                Import CSV
                <Lock className="h-3 w-3 ml-auto text-gray-400" />
              </DropdownMenuItem>
              <DropdownMenuItem className="opacity-60 cursor-not-allowed" disabled>
                Import from LinkedIn
                <Lock className="h-3 w-3 ml-auto text-gray-400" />
              </DropdownMenuItem>
              <DropdownMenuItem className="opacity-60 cursor-not-allowed" disabled>
                Bulk Import
                <Lock className="h-3 w-3 ml-auto text-gray-400" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Bulk Actions - Mobile */}
          {selectedCount > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={cn(buttonBaseStyles, buttonInactiveStyles, "flex-shrink-0 h-8")}
                >
                  Bulk Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onBulkAction('export')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem className="opacity-60 cursor-not-allowed" disabled>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                  <Lock className="h-3 w-3 ml-auto text-gray-400" />
                </DropdownMenuItem>
                <DropdownMenuItem className="opacity-60 cursor-not-allowed" disabled>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                  <Lock className="h-3 w-3 ml-auto text-gray-400" />
                </DropdownMenuItem>
                <DropdownMenuItem className="opacity-60 cursor-not-allowed" disabled>
                  <Tag className="h-4 w-4 mr-2" />
                  Add Tags
                  <Lock className="h-3 w-3 ml-auto text-gray-400" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Selected count display for mobile */}
        {selectedCount > 0 && (
          <div className="flex items-center justify-center mt-2">
            <span className="text-sm text-gray-600">
              {selectedCount} of {totalCount} selected
            </span>
          </div>
        )}
      </div>
    </div>
  );
} 