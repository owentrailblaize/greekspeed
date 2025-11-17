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
  
  // Limit announcements shown in sidebar (first 3)
  const MAX_SIDEBAR_ANNOUNCEMENTS = 3;
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
        className={`p-3 border border-gray-200 rounded-lg hover:border-navy-300 hover:shadow-sm transition-all duration-200 bg-white ${isInModal ? 'mb-3' : ''}`}
      >
        <div className="flex items-start space-x-3">
          {/* Type icon */}
          <div className={`w-10 h-10 ${typeConfig.bgColor} rounded-full flex items-center justify-center shrink-0`}>
            <TypeIcon className={`h-5 w-5 ${typeConfig.color}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Header with title */}
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 break-words flex-1">
                {announcement.title}
              </h4>
            </div>
            
            {/* Content */}
            <p className={`text-xs text-gray-600 mb-3 ${isInModal ? '' : 'line-clamp-2'} break-words`}>
              {announcement.content}
            </p>
            
            {/* Footer with sender, time, and action */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="break-words">
                  {announcement.sender?.full_name || 'Unknown'}
                </span>
                <span className="text-gray-400">
                  {formatRelativeTime(announcement.created_at)}
                </span>
              </div>
              
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleMarkAsRead(announcement.id)}
                disabled={markingAsRead === announcement.id}
                className="text-navy-600 border-navy-600 hover:bg-navy-50 h-6 px-2 shrink-0"
                title="Mark as read"
              >
                {markingAsRead === announcement.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
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
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-lg font-semibold flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-navy-600" />
            <span className="text-gray-900">Chapter Announcements</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-navy-600 mb-2"></div>
            <p className="text-gray-500 text-sm">Loading announcements...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (announcements.length === 0) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-lg font-semibold flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-navy-600" />
            <span className="text-gray-900">Chapter Announcements</span>
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
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-navy-600" />
              <span className="text-gray-900">Announcements</span>
            </div>
            {announcements.length > 0 && (
              <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {announcements.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="space-y-2.5">
            {sidebarAnnouncements.map((announcement) => renderAnnouncementItem(announcement))}
          </div>
          
          {/* View All button if there are more announcements */}
          {hasMoreAnnouncements && (
            <div className="pt-3 border-t border-gray-200 mt-3">
              <Button 
                variant="outline" 
                className="w-full text-slate-600 border-gray-400 hover:bg-navy-50 h-8"
                onClick={() => setIsViewAllOpen(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View All ({announcements.length})
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
              <span>All Announcements</span>
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
