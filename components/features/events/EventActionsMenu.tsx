'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Calendar, Download, Link2, Share2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
  downloadICSFile,
} from '@/lib/utils/calendarUtils';
import { copyEventLinkToClipboard, generateEventLink } from '@/lib/utils/eventLinkUtils';
import { toast } from 'react-toastify';
import { ShareEventDrawer } from '@/components/features/messaging/ShareEventDrawer';

interface EventActionsMenuProps {
  event: {
    id: string;
    title: string;
    description?: string;
    location?: string;
    start_time: string;
    end_time: string;
  };
  onClose?: () => void;
}

export function EventActionsMenu({ event, onClose }: EventActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCalendarSubmenu, setShowCalendarSubmenu] = useState(false);
  const [shareDrawerOpen, setShareDrawerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowCalendarSubmenu(false);
        onClose?.();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const handleAddToGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl(event);
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
    setShowCalendarSubmenu(false);
  };

  const handleAddToOutlookCalendar = () => {
    const url = generateOutlookCalendarUrl(event);
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
    setShowCalendarSubmenu(false);
  };

  const handleDownloadICS = () => {
    downloadICSFile(event);
    toast.success('Calendar file downloaded');
    setIsOpen(false);
    setShowCalendarSubmenu(false);
  };

  const handleCopyLink = async () => {
    const success = await copyEventLinkToClipboard(event.id, null, { ref: 'copy' });
    if (success) {
      toast.success('Event link copied to clipboard');
    } else {
      toast.error('Failed to copy link');
    }
    setIsOpen(false);
  };

  const handleShare = () => {
    setIsOpen(false);
    setShareDrawerOpen(true);
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
          title="More actions"
        >
          <MoreVertical className="h-4 w-4 text-gray-500" />
        </Button>

        {isOpen && (
          <div 
            className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[9999]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Add to Calendar with submenu */}
            <div className="relative">
              <button
                onClick={() => setShowCalendarSubmenu(!showCalendarSubmenu)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Add to Calendar
                </span>
                <ExternalLink className="h-3 w-3 text-gray-400" />
              </button>

              {showCalendarSubmenu && (
                <div className="absolute right-full top-0 mr-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[10000]">
                  <button
                    onClick={handleAddToGoogleCalendar}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.5 22h-15A2.5 2.5 0 0 1 2 19.5v-15A2.5 2.5 0 0 1 4.5 2h15A2.5 2.5 0 0 1 22 4.5v15a2.5 2.5 0 0 1-2.5 2.5zM9 18h6v-5H9v5zm0-6h6V7H9v5z"/>
                    </svg>
                    Google Calendar
                  </button>
                  <button
                    onClick={handleAddToOutlookCalendar}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21.17 2.06A2 2 0 0 0 19 2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V4a2 2 0 0 0-.83-1.94zM17 11h-4v4h-2v-4H7V9h4V5h2v4h4v2z"/>
                    </svg>
                    Outlook Calendar
                  </button>
                  <button
                    onClick={handleDownloadICS}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download .ics file
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 my-1" />

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Link2 className="h-4 w-4" />
              Copy Event Link
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Share Event
            </button>
          </div>
        )}
      </div>

      {/* Share Event Drawer */}
      <ShareEventDrawer
        isOpen={shareDrawerOpen}
        onClose={() => setShareDrawerOpen(false)}
        eventToShare={{
          id: event.id,
          title: event.title,
          location: event.location,
          start_time: event.start_time,
        }}
      />
    </>
  );
}
