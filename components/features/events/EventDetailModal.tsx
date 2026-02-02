'use client';

import { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { X, MapPin, Clock, Users, HelpCircle, UserX, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Event, RSVPStatus } from '@/types/events';
import { EventActionsMenu } from './EventActionsMenu';

interface Attendee {
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  responded_at: string;
}

interface AttendeeData {
  attending: Attendee[];
  maybe: Attendee[];
  not_attending: Attendee[];
  counts: {
    attending: number;
    maybe: number;
    not_attending: number;
  };
}

interface EventDetailModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  currentUserRsvp?: RSVPStatus | null;
  onRsvpChange: (eventId: string, status: RSVPStatus) => void;
}

function AttendeeAvatar({ attendee, size = 'md' }: { attendee: Attendee; size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'sm' ? 'h-6 w-6 text-xs' : 'h-8 w-8 text-sm';

  if (attendee.avatar_url) {
    return (
      <img
        src={attendee.avatar_url}
        alt={`${attendee.first_name} ${attendee.last_name}`}
        className={`${sizeClasses} rounded-full object-cover border-2 border-white shadow-sm`}
        title={`${attendee.first_name} ${attendee.last_name}`}
      />
    );
  }

  const initials = `${attendee.first_name?.[0] || ''}${attendee.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div
      className={`${sizeClasses} rounded-full bg-brand-primary text-white flex items-center justify-center font-medium border-2 border-white shadow-sm`}
      title={`${attendee.first_name} ${attendee.last_name}`}
    >
      {initials}
    </div>
  );
}

function AttendeeSection({
  title,
  attendees,
  icon: Icon,
  iconColor,
  defaultExpanded = false
}: {
  title: string;
  attendees: Attendee[];
  icon: any;
  iconColor: string;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (attendees.length === 0) return null;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          <span className="font-medium text-sm text-gray-700">{title}</span>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
            {attendees.length}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="p-3 space-y-2 max-h-40 overflow-y-auto">
          {attendees.map((attendee) => (
            <div key={attendee.user_id} className="flex items-center gap-2">
              <AttendeeAvatar attendee={attendee} size="sm" />
              <span className="text-sm text-gray-700">
                {attendee.first_name} {attendee.last_name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function EventDetailModal({
  event,
  isOpen,
  onClose,
  currentUserRsvp,
  onRsvpChange,
}: EventDetailModalProps) {
  const [attendeeData, setAttendeeData] = useState<AttendeeData | null>(null);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch attendees when modal opens
  useEffect(() => {
    if (isOpen && event.id) {
      fetchAttendees();
    }
  }, [isOpen, event.id]);

  const fetchAttendees = async () => {
    setLoadingAttendees(true);
    try {
      const response = await fetch(`/api/events/${event.id}/attendees`);
      if (response.ok) {
        const data = await response.json();
        setAttendeeData(data);
      }
    } catch (error) {
      console.error('Error fetching attendees:', error);
    } finally {
      setLoadingAttendees(false);
    }
  };

  const formatEventDate = (startTime: string, endTime: string): string => {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };

    const dateStr = start.toLocaleDateString('en-US', dateOptions);
    const startTimeStr = start.toLocaleTimeString('en-US', timeOptions);
    const endTimeStr = end.toLocaleTimeString('en-US', timeOptions);

    return `${dateStr} | ${startTimeStr} - ${endTimeStr}`;
  };

  const handleRsvp = (status: RSVPStatus) => {
    onRsvpChange(event.id, status);
  };

  const getRsvpButtonClass = (status: RSVPStatus) => {
    const isActive = currentUserRsvp === status;

    switch (status) {
      case 'attending':
        return isActive
          ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
          : 'bg-white hover:bg-green-50 text-gray-700 border-gray-300 hover:border-green-300';
      case 'maybe':
        return isActive
          ? 'bg-brand-primary hover:bg-brand-primary-hover text-white border-brand-primary'
          : 'bg-white hover:bg-primary-50 text-gray-700 border-gray-300 hover:border-primary-300';
      case 'not_attending':
        return isActive
          ? 'bg-red-600 hover:bg-red-700 text-white border-red-600'
          : 'bg-white hover:bg-red-50 text-gray-700 border-gray-300 hover:border-red-300';
      default:
        return 'bg-white text-gray-700 border-gray-300';
    }
  };

  const modalContent = (
    <>
      {/* Mobile drag handle */}
      {isMobile && (
        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300 mt-3 mb-2" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-gray-200">
        <div className="flex-1 pr-8">
          <h2 className="text-xl font-semibold text-gray-900 leading-tight">
            {event.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <EventActionsMenu event={event} />
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Date & Time */}
        <div className="flex items-start gap-3 text-sm text-gray-600">
          <Clock className="h-5 w-5 text-brand-primary flex-shrink-0 mt-0.5" />
          <span>{formatEventDate(event.start_time, event.end_time)}</span>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-start gap-3 text-sm text-gray-600">
            <MapPin className="h-5 w-5 text-brand-primary flex-shrink-0 mt-0.5" />
            <span>{event.location}</span>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <div className="pt-2">
            <h3 className="text-sm font-medium text-gray-900 mb-2">About this event</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
              {event.description}
            </p>
          </div>
        )}

        {/* Attendees Section */}
        <div className="pt-2">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Responses
            {attendeeData && (
              <span className="font-normal text-gray-500 ml-2">
                ({attendeeData.counts.attending + attendeeData.counts.maybe + attendeeData.counts.not_attending} total)
              </span>
            )}
          </h3>

          {loadingAttendees ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary"></div>
            </div>
          ) : attendeeData ? (
            <div className="space-y-2">
              <AttendeeSection
                title="Going"
                attendees={attendeeData.attending}
                icon={Users}
                iconColor="text-green-600"
                defaultExpanded={true}
              />
              <AttendeeSection
                title="Maybe"
                attendees={attendeeData.maybe}
                icon={HelpCircle}
                iconColor="text-amber-500"
              />
              <AttendeeSection
                title="Not Going"
                attendees={attendeeData.not_attending}
                icon={UserX}
                iconColor="text-red-500"
              />
              {attendeeData.counts.attending === 0 &&
                attendeeData.counts.maybe === 0 &&
                attendeeData.counts.not_attending === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No responses yet. Be the first to RSVP!
                  </p>
                )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Footer - RSVP Buttons */}
      <div className={`flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50 ${isMobile ? 'pb-[calc(1rem+env(safe-area-inset-bottom))]' : ''}`}>
        <p className="text-xs text-gray-500 mb-3 text-center">Your Response</p>
        <div className="flex gap-2">
          <Button
            onClick={() => handleRsvp('attending')}
            className={`flex-1 ${isMobile ? 'h-9 text-xs' : 'h-10'} border rounded-full transition-all ${getRsvpButtonClass('attending')}`}
            variant="outline"
          >
            <Users className={`${isMobile ? 'h-3.5 w-3.5 mr-1' : 'h-4 w-4 mr-2'}`} />
            Going
          </Button>
          <Button
            onClick={() => handleRsvp('maybe')}
            className={`flex-1 ${isMobile ? 'h-9 text-xs' : 'h-10'} border rounded-full transition-all ${getRsvpButtonClass('maybe')}`}
            variant="outline"
          >
            <HelpCircle className={`${isMobile ? 'h-3.5 w-3.5 mr-1' : 'h-4 w-4 mr-2'}`} />
            Maybe
          </Button>
          <Button
            onClick={() => handleRsvp('not_attending')}
            className={`flex-1 ${isMobile ? 'h-9 text-xs' : 'h-10'} border rounded-full transition-all ${getRsvpButtonClass('not_attending')}`}
            variant="outline"
          >
            <X className={`${isMobile ? 'h-3.5 w-3.5 mr-1' : 'h-4 w-4 mr-2'}`} />
            {isMobile ? 'No' : "Can't Go"}
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      direction="bottom"
      modal={true}
      dismissible={true}
    >
      <Drawer.Portal>
        {/* Overlay */}
        <Drawer.Overlay
          className="fixed inset-0 z-[9999] bg-black/40 transition-opacity"
        />

        {/* Drawer Content */}
        <Drawer.Content
          className={`
            bg-white flex flex-col z-[10000]
            fixed bottom-0 left-0 right-0
            ${isMobile
              ? 'h-[85vh] max-h-[85vh] rounded-t-[20px]'
              : 'max-w-lg mx-auto h-[80vh] max-h-[80vh] rounded-t-[20px]'
            }
            shadow-2xl border border-gray-200
            outline-none
          `}
        >
          {modalContent}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
