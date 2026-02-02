'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, Users, HelpCircle, X, Filter, Loader2, MoreVertical } from 'lucide-react';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { Event, RSVPStatus } from '@/types/events';
import { parseRawTime } from '@/lib/utils/timezoneUtils';
import { useFeatureRedirect } from '@/lib/hooks/useFeatureRedirect';
import { EventDetailModal } from '@/components/features/events/EventDetailModal';
import { EventActionsMenu } from '@/components/features/events/EventActionsMenu';

type EventFilter = 'all' | 'attending' | 'maybe' | 'not_attending';

export function MobileEventsPage() {
  // Feature flag protection - redirects if events_management_enabled is false
  const { loading: flagLoading } = useFeatureRedirect({
    flagName: 'events_management_enabled',
    redirectTo: '/dashboard'
  });

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rsvpStatuses, setRsvpStatuses] = useState<Record<string, 'attending' | 'maybe' | 'not_attending'>>({});
  const [activeFilter, setActiveFilter] = useState<EventFilter>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;

  // Fetch events for the user's chapter
  const fetchEvents = async () => {
    if (!chapterId || !profile?.id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/events?chapter_id=${chapterId}&scope=upcoming`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data);

      // Fetch user's RSVP statuses for all events
      await fetchUserRSVPs(data, profile.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [chapterId, profile?.id]);

  // Fetch user's RSVP statuses for all events
  const fetchUserRSVPs = async (eventsList: Event[], userId: string) => {
    try {
      const rsvpPromises = eventsList.map(async (event) => {
        const response = await fetch(`/api/events/${event.id}/rsvp?user_id=${userId}`);
        if (response.ok) {
          const rsvpData = await response.json();
          return { eventId: event.id, status: rsvpData.status };
        }
        return null;
      });

      const rsvpResults = await Promise.all(rsvpPromises);
      const userRsvps: Record<string, 'attending' | 'maybe' | 'not_attending'> = {};

      rsvpResults.forEach((result) => {
        if (result && result.status) {
          userRsvps[result.eventId] = result.status;
        }
      });

      setRsvpStatuses(userRsvps);
    } catch (error) {
      console.error('Error fetching user RSVPs:', error);
    }
  };

  const handleRSVP = async (eventId: string, status: 'attending' | 'maybe' | 'not_attending') => {
    if (!profile?.id) return;

    try {
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          user_id: profile.id,
        }),
      });

      if (response.ok) {
        // Update local RSVP status
        setRsvpStatuses(prev => ({ ...prev, [eventId]: status }));

        // Refresh events to get updated RSVP counts
        const eventsResponse = await fetch(`/api/events?chapter_id=${chapterId}&scope=upcoming`);
        if (eventsResponse.ok) {
          const updatedEvents = await eventsResponse.json();
          setEvents(updatedEvents);
        }
      } else {
        const errorData = await response.json();
        console.error('RSVP error:', errorData.error);
      }
    } catch (error) {
      console.error('Error submitting RSVP:', error);
    }
  };

  const getRSVPButtonVariant = (eventId: string, buttonStatus: string) => {
    const currentStatus = rsvpStatuses[eventId];
    if (currentStatus === buttonStatus) {
      return 'default';
    }
    return 'outline';
  };

  const getFilteredEvents = () => {
    if (activeFilter === 'all') return events;

    return events.filter(event => {
      const userStatus = rsvpStatuses[event.id];
      return userStatus === activeFilter;
    });
  };

  const filterButtons = [
    { id: 'all' as EventFilter, label: 'All Events', icon: Calendar },
    { id: 'attending' as EventFilter, label: 'Going', icon: Users },
    { id: 'maybe' as EventFilter, label: 'Maybe', icon: HelpCircle },
    { id: 'not_attending' as EventFilter, label: 'Not Going', icon: X }
  ];

  // Handle opening event detail modal
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  // Handle RSVP change from modal
  const handleModalRsvpChange = async (eventId: string, status: RSVPStatus) => {
    await handleRSVP(eventId, status as 'attending' | 'maybe' | 'not_attending');
  };

  // Show loading state while checking feature flag
  if (flagLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-brand-primary mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">Loading events...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center py-8">
            <p className="text-red-500 text-sm mb-2">Error loading events</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchEvents()}
              className="text-brand-primary border-brand-primary hover:bg-primary-50"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const filteredEvents = getFilteredEvents();

  return (
    <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
      <div className="w-full max-w-lg mx-auto sm:max-w-none sm:mx-0">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-6">
          <Calendar className="h-6 w-6 text-brand-primary" />
          <h1 className="text-xl font-semibold text-gray-900">Events</h1>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {filterButtons.map((filter) => {
              const Icon = filter.icon;
              const isActive = activeFilter === filter.id;
              const count = filter.id === 'all' ? events.length :
                events.filter(event => rsvpStatuses[event.id] === filter.id).length;

              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${isActive
                      ? 'bg-brand-accent text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{filter.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-accent-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              {activeFilter === 'all' ? 'No upcoming events' : `No events marked as ${activeFilter}`}
            </p>
            <p className="text-gray-400 text-sm">
              {activeFilter === 'all' ? 'Check back later for new events!' : 'Try a different filter'}
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredEvents.map((event, index) => (
              <div
                key={event.id}
                className={`px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${index !== filteredEvents.length - 1 ? 'border-b border-gray-100' : ''}`}
                onClick={() => handleEventClick(event)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 text-sm break-words flex-1 pr-2">{event.title}</h4>
                  <div onClick={(e) => e.stopPropagation()}>
                    <EventActionsMenu event={event} />
                  </div>
                </div>

                <div className="space-y-1 text-xs text-gray-600 mb-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3" />
                    <span className="break-words">{parseRawTime(event.start_time)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-3 w-3" />
                    <span className="break-words">{event.location || 'TBD'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-3 w-3" />
                    <span>{event.attendee_count || 0} attending</span>
                  </div>
                </div>

                {event.description && (
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                )}

                {/* RSVP Buttons */}
                <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant={getRSVPButtonVariant(event.id, 'attending')}
                    onClick={() => handleRSVP(event.id, 'attending')}
                    className="flex-1 h-8 flex items-center justify-center"
                    title="Going"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={getRSVPButtonVariant(event.id, 'maybe')}
                    onClick={() => handleRSVP(event.id, 'maybe')}
                    className="flex-1 h-8 flex items-center justify-center"
                    title="Maybe"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={getRSVPButtonVariant(event.id, 'not_attending')}
                    onClick={() => handleRSVP(event.id, 'not_attending')}
                    className="flex-1 h-8 flex items-center justify-center"
                    title="Not Going"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedEvent(null);
          }}
          currentUserRsvp={rsvpStatuses[selectedEvent.id] || null}
          onRsvpChange={handleModalRsvpChange}
        />
      )}
    </div>
  );
}
