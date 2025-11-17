'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { X, MessageSquare, Clock, AlertTriangle, GraduationCap, Calendar, AlertCircle, TrendingUp, Minus, Check, Loader2, Eye } from 'lucide-react';
import { useAnnouncements } from '@/lib/hooks/useAnnouncements';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { Announcement, CreateAnnouncementData } from '@/types/announcements';
import { toast } from 'react-toastify';

// Helper function to get icon and color based on announcement type
const getAnnouncementTypeConfig = (type: string) => {
  switch (type) {
    case 'urgent':
      return { icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-100' };
    case 'event':
      return { icon: Calendar, color: 'text-blue-600', bgColor: 'bg-blue-100' };
    case 'academic':
      return { icon: GraduationCap, color: 'text-green-600', bgColor: 'bg-green-100' };
    default:
      return { icon: MessageSquare, color: 'text-purple-600', bgColor: 'bg-purple-100' };
  }
};

// Update the priority helper function to return icons instead of text
const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return { icon: AlertTriangle, color: 'text-red-600' };
    case 'high':
      return { icon: TrendingUp, color: 'text-orange-600' };
    case 'normal':
      return { icon: Minus, color: 'text-blue-600' };
    case 'low':
      return { icon: Minus, color: 'text-gray-600' };
    default:
      return { icon: Minus, color: 'text-gray-600' };
  }
};

// Helper function to format relative time
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString();
};

export function AnnouncementsCard() {
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id || null;
  const { announcements, loading, markAsRead, refresh } = useAnnouncements(chapterId);

  // Add state for tracking which announcement is being marked as read
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);
  // Add state for modal
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);
  
  // Limit announcements shown in sidebar (e.g., first 5)
  const MAX_SIDEBAR_ANNOUNCEMENTS = 5;
  const sidebarAnnouncements = announcements.slice(0, MAX_SIDEBAR_ANNOUNCEMENTS);
  const hasMoreAnnouncements = announcements.length > MAX_SIDEBAR_ANNOUNCEMENTS;

  // Update the handleMarkAsRead function
  const handleMarkAsRead = async (announcementId: string) => {
    try {
      setMarkingAsRead(announcementId); // Set loading state
      const success = await markAsRead(announcementId);
      if (success) {
        // Show toast notification on desktop only
        if (window.innerWidth >= 640) { // sm breakpoint
          toast.success('Announcement marked as read and removed from your list', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
        // The announcement will automatically be removed from the list
        // since the hook now filters out read announcements
      }
    } catch (error) {
      console.error('Failed to mark announcement as read:', error);
      // Show error toast on desktop
      if (window.innerWidth >= 640) {
        toast.error('Failed to mark announcement as read. Please try again.', {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } finally {
      setMarkingAsRead(null); // Clear loading state
    }
  };

  // Render a single announcement item (reusable for sidebar and modal)
  const renderAnnouncementItem = (announcement: Announcement, isInModal: boolean = false) => {
    const typeConfig = getAnnouncementTypeConfig(announcement.announcement_type);
    const TypeIcon = typeConfig.icon;
    
    return (
      <div 
        key={announcement.id} 
        className={`p-3 sm:p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors relative group ${isInModal ? 'mb-3' : ''}`}
      >
        <div className="flex items-start space-x-3 sm:space-x-4">
          {/* Type icon */}
          <div className={`w-10 h-10 sm:w-8 sm:h-8 ${typeConfig.bgColor} rounded-full flex items-center justify-center shrink-0`}>
            <TypeIcon className={`h-5 w-5 sm:h-4 sm:w-4 ${typeConfig.color}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Header with title and priority icon */}
            <div className="flex items-start justify-between mb-2 sm:mb-1">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-base sm:text-sm line-clamp-2 break-words">
                  {announcement.title}
                </h4>
              </div>
            </div>
            
            {/* Content */}
            <p className={`text-sm sm:text-xs text-gray-600 mb-3 sm:mb-2 ${isInModal ? '' : 'line-clamp-2'} break-words`}>
              {announcement.content}
            </p>
            
            {/* Footer with sender and time */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm sm:text-xs text-gray-500 break-words">
                  {announcement.sender?.full_name || 'Unknown'}
                </span>
                <span className="text-sm sm:text-xs text-gray-400">
                  {formatRelativeTime(announcement.created_at)}
                </span>
              </div>
              
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleMarkAsRead(announcement.id)}
                disabled={markingAsRead === announcement.id}
                className="text-navy-600 border-navy-600 hover:bg-navy-50 h-8 sm:h-6 px-2 sm:px-1 w-auto shrink-0"
                title="Mark as read"
              >
                {markingAsRead === announcement.id ? (
                  <Loader2 className="h-4 w-4 sm:h-3 sm:w-3 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 sm:h-3 sm:w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-navy-600" />
            <span>Chapter Announcements</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading announcements...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (announcements.length === 0) {
    return (
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-navy-600" />
            <span>Chapter Announcements</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No new announcements</p>
              <p className="text-gray-400 text-xs">You're all caught up!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-navy-600" />
            <span>Chapter Announcements</span>
            {announcements.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-navy-100 text-navy-800">
                {announcements.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Scrollable announcements list with max height */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {sidebarAnnouncements.map((announcement) => renderAnnouncementItem(announcement))}
          </div>
          
          {/* View All button if there are more announcements */}
          {hasMoreAnnouncements && (
            <div className="pt-4 border-t border-gray-100 mt-4">
              <Button 
                variant="outline" 
                className="w-full text-navy-600 border-navy-600 hover:bg-navy-50 h-10 sm:h-8"
                onClick={() => setIsViewAllOpen(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View All ({announcements.length})
              </Button>
            </div>
          )}
          
          {/* Refresh button - only show if no "View All" button */}
          {!hasMoreAnnouncements && announcements.length > 0 && (
            <div className="pt-4 border-t border-gray-100 mt-4">
              <Button 
                variant="outline" 
                className="w-full text-navy-600 border-navy-600 hover:bg-navy-50 h-10 sm:h-8"
                onClick={refresh}
              >
                Refresh Announcements
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View All Modal */}
      <Dialog open={isViewAllOpen} onOpenChange={setIsViewAllOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-navy-600" />
              <span>All Chapter Announcements</span>
              {announcements.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-navy-100 text-navy-800">
                  {announcements.length}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              View and manage all your chapter announcements
            </DialogDescription>
          </DialogHeader>
          
          {/* Scrollable announcements list in modal */}
          <div className="flex-1 overflow-y-auto pr-2 mt-4">
            <div className="space-y-3">
              {announcements.map((announcement) => renderAnnouncementItem(announcement, true))}
            </div>
          </div>
          
          {/* Footer with refresh button */}
          <div className="pt-4 border-t border-gray-100 mt-4 flex justify-end">
            <Button 
              variant="outline" 
              className="text-navy-600 border-navy-600 hover:bg-navy-50"
              onClick={refresh}
            >
              Refresh Announcements
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
