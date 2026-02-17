'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, Users, HelpCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { useScopedChapterId } from '@/lib/hooks/useScopedChapterId';
import { Event, RSVPStatus } from '@/types/events';
import { parseRawTime } from '@/lib/utils/timezoneUtils';
import { EventDetailModal } from '@/components/features/events/EventDetailModal';
import { EventActionsMenu } from '@/components/features/events/EventActionsMenu';

/* -----------------------------------------------------------------------
 * Performance: Accept chapterId + userId as props so the widget can start
 * fetching immediately at mount without waiting for ProfileContext.
 * RSVP statuses are now included in the /api/events response
 * (user_rsvp_status field) — eliminates N+1 individual RSVP calls.
 * ----------------------------------------------------------------------- */

interface UpcomingEventsCardProps {
  /** If provided, skip ProfileContext wait and start fetching immediately */
  chapterId?: string | null;
  /** If provided, events response will include user_rsvp_status inline */
  userId?: string | null;
  /** Pre-fetched events from parent (scope=all) — filters to upcoming client-side */
  events?: Event[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function UpcomingEventsCard({
  chapterId: propChapterId,
  userId: propUserId,
  events: propEvents,
  loading: propLoading,
  error: propError,
  onRetry,
}: UpcomingEventsCardProps = {}) {
  const [rsvpStatuses, setRsvpStatuses] = useState<Record<string, 'attending' | 'maybe' | 'not_attending'>>({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 3;
  
  // Modal state
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Use prop values first, fall back to ProfileContext
  const { profile } = useProfile();
  const chapterId = useScopedChapterId();

  // ---- Filter parent-provided events to "upcoming" on the client ----
  const upcomingFromProps = useMemo(() => {
    if (!propEvents) return undefined;
    const now = new Date().toISOString();
    return propEvents
      .filter(e => e.status === 'published' && e.start_time >= now)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [propEvents]);

  // ---- Fallback: self-fetch only if no events were passed as props ----
  const [internalEvents, setInternalEvents] = useState<Event[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [internalError, setInternalError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (upcomingFromProps !== undefined) return; // Skip if parent provides data
    if (!chapterId || !userId) return;
    
    try {
      setInternalLoading(true);
      setInternalError(null);
      
      const response = await fetch(
        `/api/events?chapter_id=${chapterId}&scope=upcoming&user_id=${userId}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data: Event[] = await response.json();
      setInternalEvents(data);

      const userRsvps: Record<string, 'attending' | 'maybe' | 'not_attending'> = {};
      data.forEach((event) => {
        if (event.user_rsvp_status) {
          userRsvps[event.id] = event.user_rsvp_status;
        }
      });
      setRsvpStatuses(userRsvps);
    } catch (err) {
      setInternalError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setInternalLoading(false);
    }
  }, [chapterId, userId, upcomingFromProps]);

  useEffect(() => {
    if (upcomingFromProps === undefined) {
      fetchEvents();
    }
  }, [fetchEvents, upcomingFromProps]);

  // Use prop data when available, otherwise fall back to internal state
  const events = upcomingFromProps ?? internalEvents;
  const loading = upcomingFromProps !== undefined ? (propLoading ?? false) : internalLoading;
  const error = upcomingFromProps !== undefined ? (propError ?? null) : internalError;
  const handleRetry = onRetry ?? fetchEvents;

  // Sync RSVP statuses from parent-provided events
  useEffect(() => {
    if (upcomingFromProps) {
      const userRsvps: Record<string, 'attending' | 'maybe' | 'not_attending'> = {};
      upcomingFromProps.forEach((event) => {
        if (event.user_rsvp_status) {
          userRsvps[event.id] = event.user_rsvp_status;
        }
      });
      setRsvpStatuses(userRsvps);
    }
  }, [upcomingFromProps]);

  // Reset to page 1 when events change
  useEffect(() => {
    if (events.length > 0) {
      setCurrentPage(1);
    }
  }, [events.length]);

  // Pagination computed values
  const totalPages = Math.ceil(events.length / eventsPerPage);
  const startIndex = (currentPage - 1) * eventsPerPage;
  const endIndex = startIndex + eventsPerPage;
  const currentEvents = events.slice(startIndex, endIndex);

  const handleRSVP = useCallback(async (eventId: string, status: 'attending' | 'maybe' | 'not_attending') => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          user_id: userId,
        }),
      });

      if (response.ok) {
        // Optimistic update
        setRsvpStatuses(prev => ({ ...prev, [eventId]: status }));
        
        // Refresh events — if parent provides onRetry, use it to refresh shared data
        if (onRetry) {
          await onRetry();
        } else {
          // Fallback: self-fetch for updated counts
          const eventsResponse = await fetch(
            `/api/events?chapter_id=${chapterId}&scope=upcoming&user_id=${userId}`
          );
          if (eventsResponse.ok) {
            const updatedEvents: Event[] = await eventsResponse.json();
            setInternalEvents(updatedEvents);
            
            const userRsvps: Record<string, 'attending' | 'maybe' | 'not_attending'> = {};
            updatedEvents.forEach((event) => {
              if (event.user_rsvp_status) {
                userRsvps[event.id] = event.user_rsvp_status;
              }
            });
            setRsvpStatuses(userRsvps);
          }
        }
      } else {
        const errorData = await response.json();
        console.error('RSVP error:', errorData.error);
      }
    } catch (error) {
      console.error('Error submitting RSVP:', error);
    }
  }, [userId, chapterId, onRetry]);

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
            <span className="text-gray-900">Events</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary mb-2"></div>
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
            <span className="text-gray-900">Events</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8">
            <p className="text-red-500 text-sm mb-2 font-medium">Error loading events</p>
            <p className="text-gray-500 text-xs mb-4">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleRetry()}
              className="text-brand-primary border-brand-primary hover:bg-primary-50"
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
            <span className="text-gray-900">Events</span>
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
                <span className="text-gray-900">Events</span>
              </div>
              {events.length > 0 && (
                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {events.length}<span className="hidden lg:inline"> {events.length === 1 ? 'event' : 'events'}</span>
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="space-y-2.5">
              {currentEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="group relative p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all duration-200 bg-white cursor-pointer"
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowDetailModal(true);
                  }}
                >
                  {/* Actions Menu - Top Right */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <EventActionsMenu event={event} hideOnMobile />
                  </div>

                  {/* Title */}
                  <h4 className="font-semibold text-gray-900 text-sm mb-2 break-words leading-tight pr-6">
                    {event.title}
                  </h4>
                  
                  {/* Date/Time and Location on same row */}
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 mb-2">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="h-3.5 w-3.5 text-brand-primary flex-shrink-0" />
                      <span className="break-words">{formatEventDateTime(event.start_time)}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="h-3.5 w-3.5 text-brand-primary flex-shrink-0" />
                      <span className="break-words">{event.location || 'Location TBD'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Users className="h-3.5 w-3.5 text-brand-primary flex-shrink-0" />
                      <span className="font-medium">{event.attendee_count || 0} going</span>
                    </div>
                  </div>
                  
                  {/* RSVP buttons */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        size="sm" 
                        variant={getRSVPButtonVariant(event.id, 'attending')}
                        onClick={() => handleRSVP(event.id, 'attending')}
                        className={`h-6 w-6 p-0 rounded-full text-xs font-medium transition-all ${
                          getRSVPButtonVariant(event.id, 'attending') === 'default'
                            ? 'bg-brand-primary hover:bg-brand-primary-hover text-white'
                            : 'hover:bg-green-50'
                        }`}
                        title="Going"
                      >
                        <Users className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant={getRSVPButtonVariant(event.id, 'maybe')}
                        onClick={() => handleRSVP(event.id, 'maybe')}
                        className={`h-6 w-6 p-0 rounded-full text-xs font-medium transition-all ${
                          getRSVPButtonVariant(event.id, 'maybe') === 'default'
                            ? 'bg-brand-primary hover:bg-brand-primary-hover text-white'
                            : 'hover:bg-primary-50'
                        }`}
                        title="Maybe"
                      >
                        <HelpCircle className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant={getRSVPButtonVariant(event.id, 'not_attending')}
                        onClick={() => handleRSVP(event.id, 'not_attending')}
                        className={`h-6 w-6 p-0 rounded-full text-xs font-medium transition-all ${
                          getRSVPButtonVariant(event.id, 'not_attending') === 'default'
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'hover:bg-red-50'
                        }`}
                        title="Not Going"
                      >
                        <X className="h-3 w-3" />
                      </Button>
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
                              ? 'bg-brand-primary text-white hover:bg-brand-primary-hover'
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
                <span className="text-gray-900">Events</span>
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
                  className="relative p-3 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors bg-gradient-to-br from-white to-gray-50/50 cursor-pointer"
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowDetailModal(true);
                  }}
                >
                  {/* Actions Menu - Top Right */}
                  <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                    <EventActionsMenu event={event} hideOnMobile />
                  </div>

                  <h4 className="font-semibold text-gray-900 text-sm mb-2 break-words leading-tight pr-6">
                    {event.title}
                  </h4>
                  
                  <div className="space-y-1.5 text-xs text-gray-600 mb-3">
                    <div className="flex items-start space-x-2">
                      <Clock className="h-3.5 w-3.5 mt-0.5 text-brand-primary flex-shrink-0" />
                      <span className="break-words">{formatEventDateTime(event.start_time)}</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 text-brand-primary flex-shrink-0" />
                      <span className="break-words">{event.location || 'Location TBD'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center space-x-1.5 text-xs text-gray-600">
                      <Users className="h-3.5 w-3.5 text-brand-primary flex-shrink-0" />
                      <span className="font-medium">{event.attendee_count || 0} going</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        size="sm" 
                        variant={getRSVPButtonVariant(event.id, 'attending')}
                        onClick={() => handleRSVP(event.id, 'attending')}
                        className={`h-6 w-6 p-0 rounded-full text-xs font-medium transition-all ${
                          getRSVPButtonVariant(event.id, 'attending') === 'default'
                            ? 'bg-brand-primary hover:bg-brand-primary-hover text-white'
                            : 'hover:bg-green-50'
                        }`}
                        title="Going"
                      >
                        <Users className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant={getRSVPButtonVariant(event.id, 'maybe')}
                        onClick={() => handleRSVP(event.id, 'maybe')}
                        className={`h-6 w-6 p-0 rounded-full text-xs font-medium transition-all ${
                          getRSVPButtonVariant(event.id, 'maybe') === 'default'
                            ? 'bg-brand-primary hover:bg-brand-primary-hover text-white'
                            : 'hover:bg-primary-50'
                        }`}
                        title="Maybe"
                      >
                        <HelpCircle className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant={getRSVPButtonVariant(event.id, 'not_attending')}
                        onClick={() => handleRSVP(event.id, 'not_attending')}
                        className={`h-6 w-6 p-0 rounded-full text-xs font-medium transition-all ${
                          getRSVPButtonVariant(event.id, 'not_attending') === 'default'
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'hover:bg-red-50'
                        }`}
                        title="Not Going"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
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
                              ? 'bg-brand-primary text-white'
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

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedEvent(null);
          }}
          currentUserRsvp={rsvpStatuses[selectedEvent.id] || null}
          onRsvpChange={(eventId, status) => {
            handleRSVP(eventId, status);
          }}
        />
      )}
    </>
  );
}
