'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveChapter } from '@/lib/contexts/ActiveChapterContext';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { useAuth } from '@/lib/supabase/auth-context';

interface Chapter {
  id: string;
  name: string;
  school?: string;
  location?: string;
}

export function ChapterSwitcher() {
  const { profile, isDeveloper } = useProfile();
  const { session } = useAuth();
  const { activeChapterId, setActiveChapterId } = useActiveChapter();

  const [isOpen, setIsOpen] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Only render for developer users
  if (!isDeveloper) return null;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch chapters on mount
  useEffect(() => {
    if (!isDeveloper || !session?.access_token) return;

    const fetchChapters = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/developer/chapters?page=1&limit=100', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch chapters');

        const data = await response.json();
        setChapters(data.chapters || []);
      } catch (error) {
        console.error('ChapterSwitcher: Error fetching chapters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
  }, [isDeveloper, session?.access_token]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filter chapters by search query
  const filteredChapters = chapters.filter((chapter) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      chapter.name?.toLowerCase().includes(query) ||
      chapter.school?.toLowerCase().includes(query) ||
      chapter.location?.toLowerCase().includes(query)
    );
  });

  // Get the currently selected chapter name
  const selectedChapter = chapters.find((c) => c.id === activeChapterId);
  const displayLabel = selectedChapter ? selectedChapter.name : 'Developer View';

  const handleSelect = (chapterId: string | null) => {
    setActiveChapterId(chapterId);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Position the dropdown below the trigger
  const getDropdownPosition = () => {
    if (!triggerRef.current) return {};
    const rect = triggerRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + 4,
      left: rect.left,
      minWidth: Math.max(rect.width, 280),
    };
  };

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center space-x-2 h-8 rounded-full px-3 text-sm font-medium transition-all duration-200 shadow-sm',
          activeChapterId
            ? 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        )}
      >
        <Building2 className="h-3.5 w-3.5" />
        <span className="max-w-[160px] truncate">{displayLabel}</span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {mounted &&
        isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[99999] rounded-lg border border-gray-200 bg-white shadow-xl overflow-hidden"
            style={getDropdownPosition()}
          >
            {/* Search input */}
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chapters..."
                  className="w-full h-8 pl-8 pr-8 text-sm rounded-md border border-gray-200 bg-gray-50 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>

            {/* "Developer View" option (deselect chapter) */}
            <div className="py-1 border-b border-gray-100">
              <button
                onClick={() => handleSelect(null)}
                className={cn(
                  'w-full flex items-center px-3 py-2 text-sm transition-colors',
                  !activeChapterId
                    ? 'bg-brand-primary/5 text-brand-primary font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Building2 className="h-4 w-4 mr-2.5 flex-shrink-0" />
                <span>Developer Overview</span>
              </button>
            </div>

            {/* Chapter list */}
            <div className="max-h-[280px] overflow-y-auto py-1">
              {loading ? (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  Loading chapters...
                </div>
              ) : filteredChapters.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  No chapters found
                </div>
              ) : (
                filteredChapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    onClick={() => handleSelect(chapter.id)}
                    className={cn(
                      'w-full flex items-start px-3 py-2 text-sm transition-colors',
                      activeChapterId === chapter.id
                        ? 'bg-brand-primary/5 text-brand-primary font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <div className="flex flex-col items-start min-w-0">
                      <span className="truncate w-full font-medium">{chapter.name}</span>
                      {chapter.school && (
                        <span className="text-xs text-gray-500 truncate w-full">
                          {chapter.school}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}