'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useAnnouncements } from '@/lib/hooks/useAnnouncements';
import type { Announcement, CreateAnnouncementData } from '@/types/announcements';

interface AnnouncementsContextType {
  announcements: Announcement[];
  loading: boolean;
  error: string | null;
  pagination: { page: number; limit: number; total: number; totalPages: number };
  fetchAnnouncements: (page?: number) => Promise<void>;
  fetchPageForModal: (page: number) => Promise<{ announcements: Announcement[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>;
  createAnnouncement: (data: CreateAnnouncementData) => Promise<Announcement>;
  markAsRead: (announcementId: string) => Promise<boolean>;
  refresh: () => void;
}

const AnnouncementsContext = createContext<AnnouncementsContextType | null>(null);

interface AnnouncementsProviderProps {
  chapterId: string | null;
  children: ReactNode;
}

export function AnnouncementsProvider({ chapterId, children }: AnnouncementsProviderProps) {
  const value = useAnnouncements(chapterId);
  return (
    <AnnouncementsContext.Provider value={value}>
      {children}
    </AnnouncementsContext.Provider>
  );
}

export function useAnnouncementsContext(): AnnouncementsContextType | null {
  return useContext(AnnouncementsContext);
}
