'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, Users, HelpCircle, X } from 'lucide-react';
import { useProfile } from '@/lib/hooks/useProfile';
import { Event } from '@/types/events';
import { AllEventsModal } from './AllEventsModal';
import { parseRawTime } from '@/lib/utils/timezoneUtils';
import { logger } from "@/lib/utils/logger";

export function UpcomingEventsCard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rsvpStatuses, setRsvpStatuses] = useState<Record<string, 'attending' | 'maybe' | 'not_attending'>>({});
  const [showAllEventsModal, setShowAllEventsModal] = useState(false);
  
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;

  // Fetch events for the user's chapter
  useEffect(() => {
    const fetchEvents = async () => {
      if (!chapterId || !profile?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // UpcomingEventsCard - Fetching events for chapter
        const response = await fetch(`/api/events?chapter_id=${chapterId}&scope=upcoming`);
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        // UpcomingEventsCard - Fetched events
        setEvents(data);

        // Fetch user's RSVP statuses for all events
        await fetchUserRSVPs(data, profile.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

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
      // UpcomingEventsCard - Fetched user RSVPs
    } catch (error) {
      logger.error('Error fetching user RSVPs:', { context: [error] });
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
        logger.error('RSVP error:', { context: [errorData.error] });
      }
    } catch (error) {
      logger.error('Error submitting RSVP:', { context: [error] });
    }
  };

  const getRSVPButtonVariant = (eventId: string, buttonStatus: string) => {
    const currentStatus = rsvpStatuses[eventId];
    if (currentStatus === buttonStatus) {
      return 'default';
    }
    return 'outline';
  };

  const formatEventDateTime = (isoString: string): string => {
    return parseRawTime(isoString);
  };

  const handleViewAllEvents = () => {
    // View All Events button clicked!
    // Current showAllEventsModal state
  };

  if (loading) {
    return (
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-navy-600" />
            <span>Upcoming Events</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">Loading events...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-navy-600" />
            <span>Upcoming Events</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8">
            <p className="text-red-500 text-sm mb-2">Error loading events</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
              className="text-navy-600 border-navy-600 hover:bg-navy-50 h-10 sm:h-8"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-navy-600" />
            <span>Upcoming Events</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm mb-2">No upcoming events 👀</p>
            <Button variant="outline" size="sm" className="text-navy-600 border-navy-600 hover:bg-navy-50 h-10 sm:h-8">
              Browse events
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop Layout - Preserved */}
      <div className="hidden md:block">
        <Card className="bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-navy-600" />
              <span>Upcoming Events</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {events.slice(0, 3).map((event) => (
                <div key={event.id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <h4 className="font-medium text-gray-900 text-base mb-3 break-words">{event.title}</h4>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span className="break-words">{formatEventDateTime(event.start_time)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span className="break-words">{event.location || 'TBD'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>{event.attendee_count || 0} attending</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
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
            
            <div className="pt-4 border-t border-gray-100">
              <Button 
                variant="outline" 
                className="w-full text-navy-600 border-navy-600 hover:bg-navy-50 h-10"
                onClick={handleViewAllEvents}
              >
                View All Events
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <Card className="bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-navy-600" />
              <span>Upcoming Events</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {events.slice(0, 3).map((event) => (
                <div key={event.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <h4 className="font-medium text-gray-900 text-sm mb-2 break-words">{event.title}</h4>
                  
                  <div className="space-y-1 text-xs text-gray-600 mb-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3" />
                      <span className="break-words">{formatEventDateTime(event.start_time)}</span>
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
                  
                  {/* Mobile RSVP Buttons - Same Row with Icons */}
                  <div className="flex space-x-1">
                    <Button 
                      size="sm" 
                      variant={getRSVPButtonVariant(event.id, 'attending')}
                      onClick={() => handleRSVP(event.id, 'attending')}
                      className="flex-1 text-xs h-8 px-2"
                    >
                      <Users className="h-3 w-3 mr-2 text-slate-600" />
                      Going
                    </Button>
                    <Button 
                      size="sm" 
                      variant={getRSVPButtonVariant(event.id, 'maybe')}
                      onClick={() => handleRSVP(event.id, 'maybe')}
                      className="flex-1 text-xs h-8 px-2"
                    >
                      <HelpCircle className="h-3 w-3 mr-2 text-slate-600" />
                      Maybe
                    </Button>
                    <Button 
                      size="sm" 
                      variant={getRSVPButtonVariant(event.id, 'not_attending')}
                      onClick={() => handleRSVP(event.id, 'not_attending')}
                      className="flex-1 text-xs h-8 px-2"
                    >
                      <X className="h-3 w-3 mr-2 text-red-400" />
                      Not
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-3 border-t border-gray-100">
              <Button 
                variant="outline" 
                className="w-full text-navy-600 border-navy-600 hover:bg-navy-50 h-8 text-sm"
                onClick={handleViewAllEvents}
              >
                View All Events
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Events Modal */}
      <AllEventsModal
        isOpen={showAllEventsModal}
        onClose={() => setShowAllEventsModal(false)}
        events={events}
        loading={loading}
        error={error}
      />
    </>
  );
}
