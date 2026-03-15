'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { Announcement, CreateAnnouncementData } from '@/types/announcements';

export function useAnnouncements(chapterId: string | null) {
  const { user, session } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasDataRef = useRef(false);
  const PAGE_SIZE = 10;
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0
  });

  const fetchAnnouncements = useCallback(async (page: number = 1) => {
    if (!chapterId || !user) return;

    // Only show loading on initial load (no cached data). Silent refresh when we have data.
    const isInitialLoad = !hasDataRef.current;
    if (isInitialLoad) {
      setLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams({
        chapterId,
        page: page.toString(),
        limit: PAGE_SIZE.toString()
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
      
      hasDataRef.current = true;
      setAnnouncements(unreadAnnouncements || []);
      setPagination(data.pagination || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  }, [chapterId, user?.id, session?.access_token]);

  /** Fetch a specific page for the View All modal (does not update main list). Returns unread-only list. */
  const fetchPageForModal = useCallback(async (page: number) => {
    if (!chapterId || !user) return { announcements: [] as Announcement[], pagination: { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 } };
    const params = new URLSearchParams({
      chapterId,
      page: page.toString(),
      limit: PAGE_SIZE.toString()
    });
    const response = await fetch(`/api/announcements?${params}`, {
      headers: { 'Authorization': `Bearer ${session?.access_token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch announcements');
    const data = await response.json();
    const unread = (data.announcements || []).filter((a: Announcement) => !a.is_read);
    return {
      announcements: unread,
      pagination: data.pagination || { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 }
    };
  }, [chapterId, user?.id, session?.access_token]);

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
    if (!user) return false;

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
      console.error('Failed to mark announcement as read:', err);
      return false;
    }
  }, [user, session]);

  // Reset hasData when chapter changes so loading shows for new chapter
  useEffect(() => {
    hasDataRef.current = false;
  }, [chapterId]);

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
    fetchPageForModal,
    createAnnouncement,
    markAsRead,
    refresh: () => fetchAnnouncements(1)
  };
}