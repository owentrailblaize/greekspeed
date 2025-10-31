'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Announcement, CreateAnnouncementData } from '@/types/announcements';
import { logger } from "@/lib/utils/logger";

export function useAnnouncements(chapterId: string | null) {
  const { user, session } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const fetchAnnouncements = useCallback(async (page: number = 1) => {
    if (!chapterId || !user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        chapterId,
        page: page.toString(),
        limit: '20'
      });
      
      const response = await fetch(`/api/announcements?${params}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }
      
      const data = await response.json();
      
      // Filter out announcements that the user has already read
      const unreadAnnouncements = data.announcements.filter((announcement: Announcement) => {
        // Check if this user has read this announcement
        return !announcement.is_read;
      });
      
      setAnnouncements(unreadAnnouncements || []);
      setPagination(data.pagination || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  }, [chapterId, user, session]);

  const createAnnouncement = useCallback(async (announcementData: CreateAnnouncementData) => {
    if (!user || !session) {
      throw new Error('Authentication required');
    }

    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(announcementData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create announcement');
      }

      const { announcement } = await response.json();
      
      // Add to local state
      setAnnouncements(prev => [announcement, ...prev]);
      
      return announcement;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create announcement');
      throw err;
    }
  }, [user, session]);

  const markAsRead = useCallback(async (announcementId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/announcements/${announcementId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ userId: user.id })
      });

      if (!response.ok) {
        throw new Error('Failed to mark announcement as read');
      }

      // Remove the announcement from the local state since it's now read
      setAnnouncements(prev => prev.filter(announcement => announcement.id !== announcementId));
      
      return true;
    } catch (err) {
      logger.error('Failed to mark announcement as read:', { context: [err] });
      return false;
    }
  }, [user, session]);

  useEffect(() => {
    if (chapterId) {
      fetchAnnouncements(1);
    }
  }, [chapterId, fetchAnnouncements]);

  return {
    announcements,
    loading,
    error,
    pagination,
    fetchAnnouncements,
    createAnnouncement,
    markAsRead,
    refresh: () => fetchAnnouncements(1)
  };
}