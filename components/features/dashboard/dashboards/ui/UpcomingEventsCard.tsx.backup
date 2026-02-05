'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, Users, HelpCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { Event } from '@/types/events';
import { parseRawTime } from '@/lib/utils/timezoneUtils';

export function UpcomingEventsCard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rsvpStatuses, setRsvpStatuses] = useState<Record<string, 'attending' | 'maybe' | 'not_attending'>>({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 3;
  
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;

  // Calculate pagination
  const totalPages = Math.ceil(events.length / eventsPerPage);
  const startIndex = (currentPage - 1) * eventsPerPage;
  const endIndex = startIndex + eventsPerPage;
  const currentEvents = events.slice(startIndex, endIndex);

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

  // Reset to page 1 when events change
  useEffect(() => {
    if (events.length > 0) {
      setCurrentPage(1);
    }
  }, [events.length]);

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

  const formatEventDateTime = (isoString: string): string => {
    return parseRawTime(isoString);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-navy-600" />
            <span className="text-gray-900">Upcoming Events</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-navy-600 mb-2"></div>
            <p className="text-gray-500 text-sm">Loading events...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-navy-600" />
            <span className="text-gray-900">Upcoming Events</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8">
            <p className="text-red-500 text-sm mb-2 font-medium">Error loading events</p>
            <p className="text-gray-500 text-xs mb-4">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchEvents()}
              className="text-navy-600 border-navy-600 hover:bg-navy-50"
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
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-navy-600" />
            <span className="text-gray-900">Upcoming Events</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm mb-2 font-medium">No upcoming events</p>
            <p className="text-gray-400 text-xs">Check back later for new events!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:block">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-lg font-semibold flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-navy-600" />
                <span className="text-gray-900">Upcoming Events</span>
              </div>
              {events.length > 0 && (
                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {events.length} {events.length === 1 ? 'event' : 'events'}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="space-y-2.5">
              {currentEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="group p-3 border border-gray-200 rounded-lg hover:border-navy-300 hover:shadow-sm transition-all duration-200 bg-white"
                >
                  {/* Title */}
                  <h4 className="font-semibold text-gray-900 text-sm mb-2 break-words leading-tight">
                    {event.title}
                  </h4>
                  
                  {/* Date/Time and Location on same row */}
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 mb-2">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="h-3.5 w-3.5 text-navy-600 flex-shrink-0" />
                      <span className="break-words">{formatEventDateTime(event.start_time)}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="h-3.5 w-3.5 text-navy-600 flex-shrink-0" />
                      <span className="break-words">{event.location || 'Location TBD'}</span>
                    </div>
                  </div>
                  
                  {/* Attendees and RSVP buttons on same row */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 flex-nowrap min-w-0">
                    <div className="flex items-center space-x-1.5 text-xs text-gray-600 flex-shrink-0">
                      <Users className="h-3.5 w-3.5 text-navy-600 flex-shrink-0" />
                      <span className="font-medium whitespace-nowrap">{event.attendee_count || 0} going</span>
                    </div>
                    
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <Button 
                        size="sm" 
                        variant={getRSVPButtonVariant(event.id, 'attending')}
                        onClick={() => handleRSVP(event.id, 'attending')}
                        className={`h-6 px-2 rounded-full text-xs font-medium transition-all ${
                          getRSVPButtonVariant(event.id, 'attending') === 'default'
                            ? 'bg-navy-600 hover:bg-navy-700 text-white'
                            : 'hover:bg-green-50'
                        }`}
                        title="Going"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        Going
                      </Button>
                      <Button 
                        size="sm" 
                        variant={getRSVPButtonVariant(event.id, 'maybe')}
                        onClick={() => handleRSVP(event.id, 'maybe')}
                        className={`h-6 px-2 rounded-full text-xs font-medium transition-all ${
                          getRSVPButtonVariant(event.id, 'maybe') === 'default'
                            ? 'bg-navy-600 hover:bg-navy-700 text-white'
                            : 'hover:bg-navy-50'
                        }`}
                        title="Maybe"
                      >
                        <HelpCircle className="h-3 w-3 mr-1" />
                        Maybe
                      </Button>
                      <Button 
                        size="sm" 
                        variant={getRSVPButtonVariant(event.id, 'not_attending')}
                        onClick={() => handleRSVP(event.id, 'not_attending')}
                        className={`h-6 px-2 rounded-full text-xs font-medium transition-all ${
                          getRSVPButtonVariant(event.id, 'not_attending') === 'default'
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'hover:bg-red-50'
                        }`}
                        title="Not Going"
                      >
                        <X className="h-3 w-3 mr-1" />
                        No
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-center w-full">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="h-8 px-3 text-xs"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1 max-w-full overflow-x-auto">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={`h-8 w-8 p-0 text-xs flex-shrink-0 ${
                            currentPage === page
                              ? 'bg-navy-600 text-white hover:bg-navy-700'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="h-8 px-3 text-xs"
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-lg font-semibold flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-navy-600" />
                <span className="text-gray-900">Upcoming Events</span>
              </div>
              {events.length > 0 && (
                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {events.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {currentEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="p-3 border border-gray-200 rounded-lg hover:border-navy-300 transition-colors bg-gradient-to-br from-white to-gray-50/50"
                >
                  <h4 className="font-semibold text-gray-900 text-sm mb-2 break-words leading-tight">
                    {event.title}
                  </h4>
                  
                  <div className="space-y-1.5 text-xs text-gray-600 mb-3">
                    <div className="flex items-start space-x-2">
                      <Clock className="h-3.5 w-3.5 mt-0.5 text-navy-600 flex-shrink-0" />
                      <span className="break-words">{formatEventDateTime(event.start_time)}</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 text-navy-600 flex-shrink-0" />
                      <span className="break-words">{event.location || 'Location TBD'}</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Users className="h-3.5 w-3.5 mt-0.5 text-navy-600 flex-shrink-0" />
                      <span className="font-medium">{event.attendee_count || 0} going</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1.5 pt-2 border-t border-gray-100">
                    <Button 
                      size="sm" 
                      variant={getRSVPButtonVariant(event.id, 'attending')}
                      onClick={() => handleRSVP(event.id, 'attending')}
                      className={`flex-1 h-7 text-xs font-medium ${
                        getRSVPButtonVariant(event.id, 'attending') === 'default'
                          ? 'bg-navy-600 hover:bg-navy-700'
                          : ''
                      }`}
                    >
                      <Users className="h-3 w-3 mr-1" />
                      Going
                    </Button>
                    <Button 
                      size="sm" 
                      variant={getRSVPButtonVariant(event.id, 'maybe')}
                      onClick={() => handleRSVP(event.id, 'maybe')}
                      className={`flex-1 h-7 text-xs font-medium ${
                        getRSVPButtonVariant(event.id, 'maybe') === 'default'
                          ? 'bg-navy-600 hover:bg-navy-700'
                          : ''
                      }`}
                    >
                      <HelpCircle className="h-3 w-3 mr-1" />
                      Maybe
                    </Button>
                    <Button 
                      size="sm" 
                      variant={getRSVPButtonVariant(event.id, 'not_attending')}
                      onClick={() => handleRSVP(event.id, 'not_attending')}
                      className={`flex-1 h-7 text-xs font-medium ${
                        getRSVPButtonVariant(event.id, 'not_attending') === 'default'
                          ? 'bg-red-600 hover:bg-red-700'
                          : ''
                      }`}
                    >
                      <X className="h-3 w-3 mr-1" />
                      No
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Mobile Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-col items-center space-y-3">
                  <div className="text-xs text-gray-500 text-center">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="h-8 px-3 text-xs"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                      Prev
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={`h-7 w-7 p-0 text-xs ${
                            currentPage === page
                              ? 'bg-navy-600 text-white'
                              : ''
                          }`}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="h-8 px-3 text-xs"
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
