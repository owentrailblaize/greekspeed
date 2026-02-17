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
  hideOnMobile?: boolean;
}

export function EventActionsMenu({ event, onClose, hideOnMobile = false }: EventActionsMenuProps) {
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
      {/* Add isolate and z-50 when open to fix stacking on mobile */}
      <div className={`relative ${isOpen ? 'z-[9998] isolate' : ''} ${hideOnMobile ? 'hidden md:block' : ''}`} ref={menuRef}>
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
                <div className="
                  absolute w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[10000]
                  /* Mobile: position below the button */
                  left-0 top-full mt-1
                  /* Desktop: position to the left */
                  md:left-auto md:right-full md:top-0 md:mt-0 md:mr-1
                ">
                  <button
                    onClick={handleAddToGoogleCalendar}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {/* ... existing Google Calendar button content ... */}
                    <img
                      src="/gmail-icon.png"
                      alt="Google Calendar"
                      className="h-4 w-4"
                      width={16}
                      height={16}
                      style={{ display: 'inline-block' }}
                    />
                    Google
                  </button>
                  <button
                    onClick={handleAddToOutlookCalendar}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <img
                      src="/outlook-logo.png"
                      alt="Outlook Calendar"
                      className="h-4 w-4"
                      width={16}
                      height={16}
                      style={{ display: 'inline-block' }}
                    />
                    Outlook
                  </button>
                  <button
                    onClick={handleDownloadICS}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download
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
