'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Share2, 
  Link2, 
  ArrowLeft,
  CalendarPlus,
  Download,
  Check
} from 'lucide-react';
import { Event } from '@/types/events';
import { 
  generateGoogleCalendarUrl, 
  generateOutlookCalendarUrl, 
  downloadICSFile 
} from '@/lib/utils/calendarUtils';
import { copyEventLinkToClipboard } from '@/lib/utils/eventLinkUtils';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface PublicEventClientProps {
  event: Event;
  attendeeCounts: {
    attending: number;
    maybe: number;
    not_attending: number;
  };
}

export function PublicEventClient({ event, attendeeCounts }: PublicEventClientProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleCopyLink = async () => {
    const success = await copyEventLinkToClipboard(event.id, null, { ref: 'public_page' });
    if (success) {
      setLinkCopied(true);
      toast.success('Event link copied to clipboard!');
      setTimeout(() => setLinkCopied(false), 2000);
    } else {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/event/${event.id}`;
    const shareData = {
      title: event.title,
      text: `Check out this event: ${event.title}${event.location ? ` at ${event.location}` : ''}`,
      url: url,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    } else {
      // Fallback to copy link
      handleCopyLink();
    }
  };

  const handleAddToGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl(event);
    window.open(url, '_blank', 'noopener,noreferrer');
    setShowCalendarMenu(false);
  };

  const handleAddToOutlookCalendar = () => {
    const url = generateOutlookCalendarUrl(event);
    window.open(url, '_blank', 'noopener,noreferrer');
    setShowCalendarMenu(false);
  };

  const handleDownloadICS = () => {
    downloadICSFile(event);
    toast.success('Calendar file downloaded');
    setShowCalendarMenu(false);
  };

  // Check if event is in the past
  const isPastEvent = new Date(event.end_time) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Trailblaize</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="flex items-center gap-2"
            >
              {linkCopied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="hidden sm:inline">Copied!</span>
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Copy Link</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Event Header */}
          <div className="bg-gradient-to-r from-brand-primary to-brand-primary-hover p-8 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {isPastEvent && (
                  <Badge className="bg-white/20 text-white mb-3">
                    Past Event
                  </Badge>
                )}
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                  {event.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-white/90">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{attendeeCounts.attending} attending</span>
                  </div>
                  {attendeeCounts.maybe > 0 && (
                    <div className="flex items-center gap-2">
                      <span>{attendeeCounts.maybe} maybe</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="p-8">
            {/* Date & Time */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-brand-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Date & Time</h3>
                <p className="text-gray-600">{formatDate(event.start_time)}</p>
                <p className="text-gray-500 text-sm">
                  {formatTime(event.start_time)} - {formatTime(event.end_time)}
                </p>
              </div>
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Location</h3>
                  <p className="text-gray-600">{event.location}</p>
                </div>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-3">About this event</h3>
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </p>
              </div>
            )}

            {/* Actions */}
            {!isPastEvent && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Add to your calendar</h3>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={handleAddToGoogleCalendar}
                    className="flex items-center gap-2"
                  >
                    <CalendarPlus className="h-4 w-4" />
                    Google Calendar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleAddToOutlookCalendar}
                    className="flex items-center gap-2"
                  >
                    <CalendarPlus className="h-4 w-4" />
                    Outlook
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownloadICS}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download .ics
                  </Button>
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Want to RSVP to this event?
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Sign in to Trailblaize to RSVP and see who else is attending.
                </p>
                <Link href="/login">
                  <Button className="bg-brand-primary hover:bg-brand-primary-hover text-white">
                    Sign in to RSVP
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>
            Powered by{' '}
            <a 
              href="https://trailblaize.net" 
              className="text-brand-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Trailblaize
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}

