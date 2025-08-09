import { useState } from "react";
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
  Users, 
  Mail, 
  Phone,
  MessageSquare,
  Calendar,
  Tag
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
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-gray-50">
                <Workflow className="h-4 w-4 mr-2" />
                Create workflow
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Mail className="h-4 w-4 mr-2" />
                Email Campaign
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageSquare className="h-4 w-4 mr-2" />
                Message Sequence
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Calendar className="h-4 w-4 mr-2" />
                Meeting Reminder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" onClick={onSaveSearch}>
            <Save className="h-4 w-4 mr-2" />
            Save list
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Star className="h-4 w-4 mr-2" />
                Research with AI
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Generate Email</DropdownMenuItem>
              <DropdownMenuItem>Find Similar Alumni</DropdownMenuItem>
              <DropdownMenuItem>Career Insights</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Import CSV</DropdownMenuItem>
              <DropdownMenuItem>Import from LinkedIn</DropdownMenuItem>
              <DropdownMenuItem>Bulk Import</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
              <DropdownMenuItem onClick={() => onExport()}>
                <Download className="h-4 w-4 mr-2" />
                Export All to Excel
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
                <DropdownMenuItem onClick={() => onBulkAction('email')}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkAction('message')}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkAction('tag')}>
                  <Tag className="h-4 w-4 mr-2" />
                  Add Tags
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
} 