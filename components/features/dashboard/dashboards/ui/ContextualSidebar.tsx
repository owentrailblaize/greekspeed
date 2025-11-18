'use client';

import { FeatureView } from '../UnifiedExecutiveDashboard';
import { TasksPanel } from './TasksPanel';
import { CompactCalendarCard } from './CompactCalendarCard';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { Calendar, MessageSquare, UserPlus, Users, Plus, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface ContextualSidebarProps {
  activeFeature: FeatureView;
  selectedRole: string;
}

export function ContextualSidebar({ activeFeature, selectedRole }: ContextualSidebarProps) {
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;
  const router = useRouter();

  // Feature-specific contextual content
  const renderContextualContent = () => {
    switch (activeFeature) {
      case 'announcements':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <p>Email notifications are enabled by default for all members with email preferences.</p>
              <p>SMS notifications require member consent and phone number on file.</p>
            </CardContent>
          </Card>
        );

      case 'events':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                Event Filters
                <Filter className="h-4 w-4 text-gray-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Filter by status</p>
                <p>• Filter by date range</p>
                <p>• Filter by event type</p>
              </div>
            </CardContent>
          </Card>
        );

      case 'tasks':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                Task Filters
                <Filter className="h-4 w-4 text-gray-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Filter by assignee</p>
                <p>• Filter by status</p>
                <p>• Filter by priority</p>
                <p>• Filter by due date</p>
              </div>
            </CardContent>
          </Card>
        );

      case 'members':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                Member Filters
                <Filter className="h-4 w-4 text-gray-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Filter by role</p>
                <p>• Filter by status</p>
                <p>• Filter by dues status</p>
                <p>• Search by name</p>
              </div>
            </CardContent>
          </Card>
        );

      case 'dues':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                Dues Actions
                <Download className="h-4 w-4 text-gray-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export to CSV
              </Button>
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Select dues cycle</p>
                <p>• Filter by payment status</p>
                <p>• View payment history</p>
              </div>
            </CardContent>
          </Card>
        );

      case 'budget':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Budget Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Filter by category</p>
                <p>• Filter by time period</p>
                <p>• View spending trends</p>
              </div>
            </CardContent>
          </Card>
        );

      case 'vendors':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Vendor Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Filter by type</p>
                <p>• Filter by rating</p>
                <p>• Search vendors</p>
              </div>
            </CardContent>
          </Card>
        );

      case 'documents':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Document Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Filter by category</p>
                <p>• Sort by date</p>
                <p>• Search documents</p>
              </div>
            </CardContent>
          </Card>
        );

      case 'invitations':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Invitation Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <UserPlus className="h-4 w-4 mr-2" />
                Create Invitation
              </Button>
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Filter by status</p>
                <p>• Bulk actions</p>
                <p>• Resend invitations</p>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Default Widgets - Always Visible */}
        
        {chapterId && (
          <>
            <TasksPanel chapterId={chapterId} />
            <CompactCalendarCard />
          </>
        )}

        {/* Feature-Specific Contextual Content */}
        {renderContextualContent()}
      </div>
    </div>
  );
}

