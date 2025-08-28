'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, MessageSquare, Clock, AlertTriangle, GraduationCap, Calendar, AlertCircle, TrendingUp, Minus } from 'lucide-react';
import { useAnnouncements } from '@/lib/hooks/useAnnouncements';
import { useProfile } from '@/lib/hooks/useProfile';
import { Announcement } from '@/types/announcements';

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
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set());

  const handleMarkAsRead = async (announcementId: string) => {
    try {
      await markAsRead(announcementId);
      // Add to dismissed set after marking as read
      setDismissedAnnouncements(prev => new Set(prev).add(announcementId));
    } catch (error) {
      console.error('Failed to mark announcement as read:', error);
    }
  };

  const handleDismiss = (announcementId: string) => {
    setDismissedAnnouncements(prev => new Set(prev).add(announcementId));
  };

  // Filter out dismissed announcements and only show unread ones
  const visibleAnnouncements = announcements.filter(
    announcement => !dismissedAnnouncements.has(announcement.id)
  );

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

  if (visibleAnnouncements.length === 0) {
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
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-navy-600" />
          <span>Chapter Announcements</span>
          {visibleAnnouncements.length > 0 && (
            <Badge variant="secondary" className="ml-2 bg-navy-100 text-navy-800">
              {visibleAnnouncements.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {visibleAnnouncements.map((announcement) => {
            const typeConfig = getAnnouncementTypeConfig(announcement.announcement_type);
            const TypeIcon = typeConfig.icon;
            
            return (
              <div 
                key={announcement.id} 
                className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors relative group"
              >
                {/* Dismiss button */}
                <button
                  onClick={() => handleDismiss(announcement.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded-full"
                  title="Dismiss announcement"
                >
                  <X className="h-3 w-3 text-gray-500" />
                </button>

                <div className="flex items-start space-x-3">
                  {/* Type icon */}
                  <div className={`w-8 h-8 ${typeConfig.bgColor} rounded-full flex items-center justify-center shrink-0`}>
                    <TypeIcon className={`h-4 w-4 ${typeConfig.color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Header with title and priority icon */}
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                          {announcement.title}
                        </h4>
                        {/* Priority icon instead of badge */}
                        {(() => {
                          const priorityConfig = getPriorityIcon(announcement.priority);
                          const PriorityIcon = priorityConfig.icon;
                          return (
                            <PriorityIcon className={`h-3 w-3 ${priorityConfig.color} shrink-0`} />
                          );
                        })()}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {announcement.content}
                    </p>
                    
                    {/* Footer with sender and time */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {announcement.sender?.full_name || 'Unknown'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatRelativeTime(announcement.created_at)}
                        </span>
                      </div>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleMarkAsRead(announcement.id)}
                        className="text-navy-600 border-navy-600 hover:bg-navy-50 text-xs h-6 px-2"
                      >
                        Mark Read
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {visibleAnnouncements.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <Button 
              variant="outline" 
              className="w-full text-navy-600 border-navy-600 hover:bg-navy-50"
              onClick={refresh}
            >
              Refresh Announcements
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
