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
    console.log(`${featureName} - Feature coming soon!`);
    // Could add a toast notification here
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      {/* Desktop Layout - Unchanged */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Create Workflow - LOCKED */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-gray-50 opacity-60 cursor-not-allowed" disabled>
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
            className="opacity-60 cursor-not-allowed"
            disabled
          >
            <Save className="h-4 w-4 mr-2" />
            Save list
            <Lock className="h-3 w-3 ml-2 text-gray-400" />
          </Button>

          {/* Research with AI - LOCKED */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="opacity-60 cursor-not-allowed" disabled>
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
              <Button variant="outline" className="opacity-60 cursor-not-allowed" disabled>
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

          {/* Export - WORKING */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onExport()}>
                <Download className="h-4 w-4 mr-2" />
                Export All to CSV
              </DropdownMenuItem>
              <DropdownMenuItem className="opacity-60 cursor-not-allowed" disabled>
                <Download className="h-4 w-4 mr-2" />
                Export All to Excel
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
                <Button variant="outline" size="sm">
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

      {/* Mobile Layout - New horizontal scrollable version */}
      <div className="md:hidden">
        <div className="flex items-center space-x-3 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
          {/* Create Workflow - LOCKED */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-gray-50 opacity-60 cursor-not-allowed flex-shrink-0" disabled>
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
            className="opacity-60 cursor-not-allowed flex-shrink-0"
            disabled
          >
            <Save className="h-4 w-4 mr-2" />
            Save list
            <Lock className="h-3 w-3 ml-2 text-gray-400" />
          </Button>

          {/* Research with AI - LOCKED */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="opacity-60 cursor-not-allowed flex-shrink-0" disabled>
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
              <Button variant="outline" className="opacity-60 cursor-not-allowed flex-shrink-0" disabled>
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

          {/* Export - WORKING */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-shrink-0">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onExport()}>
                <Download className="h-4 w-4 mr-2" />
                Export All to CSV
              </DropdownMenuItem>
              <DropdownMenuItem className="opacity-60 cursor-not-allowed" disabled>
                <Download className="h-4 w-4 mr-2" />
                Export All to Excel
                <Lock className="h-3 w-3 ml-auto text-gray-400" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Bulk Actions - Mobile */}
          {selectedCount > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex-shrink-0">
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