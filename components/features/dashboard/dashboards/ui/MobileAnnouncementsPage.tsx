'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, MessageSquare, Clock, AlertTriangle, GraduationCap, Calendar, AlertCircle, TrendingUp, Minus, RefreshCw } from 'lucide-react';
import { useAnnouncements } from '@/lib/hooks/useAnnouncements';
import { useProfile } from '@/lib/contexts/ProfileContext';
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

export function MobileAnnouncementsPage() {
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id || null;
  const { announcements, loading, markAsRead, refresh } = useAnnouncements(chapterId);

  const handleMarkAsRead = async (announcementId: string) => {
    try {
      const success = await markAsRead(announcementId);
      if (success) {
        // The announcement will automatically be removed from the list
        // since the hook now filters out read announcements
      }
    } catch (error) {
      console.error('Failed to mark announcement as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading announcements...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-6 w-6 text-navy-600" />
            <h1 className="text-xl font-semibold text-gray-900">Chapter News</h1>
            {announcements.length > 0 && (
              <Badge variant="secondary" className="bg-navy-100 text-navy-800">
                {announcements.length}
              </Badge>
            )}
          </div>
          <div 
            onClick={refresh}
            className="h-8 w-8 rounded-full border border-navy-600 text-navy-600 hover:bg-navy-50 flex items-center justify-center cursor-pointer transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </div>
        </div>

        {/* Announcements List */}
        {announcements.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No new announcements</p>
            <p className="text-gray-400 text-sm">You're all caught up!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
            {announcements.map((announcement, index) => {
              const typeConfig = getAnnouncementTypeConfig(announcement.announcement_type);
              const TypeIcon = typeConfig.icon;
              
              return (
                <div 
                  key={announcement.id} 
                  className={`px-4 py-4 ${index !== announcements.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Type icon */}
                    <div className={`w-8 h-8 ${typeConfig.bgColor} rounded-full flex items-center justify-center shrink-0`}>
                      <TypeIcon className={`h-4 w-4 ${typeConfig.color}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Header with title and priority icon */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm line-clamp-2 break-words">
                            {announcement.title}
                          </h4>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2 break-words">
                        {announcement.content}
                      </p>
                      
                      {/* Footer with sender and time */}
                      <div className="flex flex-col space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-gray-500 break-words">
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
                          className="text-navy-600 border-navy-600 hover:bg-navy-50 text-xs h-7 w-full"
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
        )}
      </div>
    </div>
  );
}
