// lib/contexts/ActiveChapterContext.tsx

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ActiveChapterContextType {
  activeChapterId: string | null;
  setActiveChapterId: (chapterId: string | null) => void;
}

const ActiveChapterContext = createContext<ActiveChapterContextType | undefined>(undefined);

export const ActiveChapterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

  return (
    <ActiveChapterContext.Provider value={{ activeChapterId, setActiveChapterId }}>
      {children}
    </ActiveChapterContext.Provider>
  );
};

export const useActiveChapter = (): ActiveChapterContextType => {
  const context = useContext(ActiveChapterContext);
  if (!context) {
    // Gracefully return null state when provider is missing
    // Developer will fall back to their profile.chapter_id
    return {
      activeChapterId: null,
      setActiveChapterId: () => {
        // Silent no-op - switching disabled when provider not available
      }
    };
  }
  return context;
};