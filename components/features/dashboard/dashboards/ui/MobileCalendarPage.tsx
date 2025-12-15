'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Users, HelpCircle, X, Loader2 } from 'lucide-react';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { Event } from '@/types/events';
import { parseRawTime } from '@/lib/utils/timezoneUtils';
import { toast } from 'react-toastify';
import { useFeatureRedirect } from '@/lib/hooks/useFeatureRedirect';

const MAX_DESCRIPTION_CHARS = 150;

type EventFilter = 'all' | 'attending' | 'maybe' | 'not_attending';

export function MobileCalendarPage() {
  // Feature flag protection - redirects if events_management_enabled is false
  const { loading: flagLoading } = useFeatureRedirect({
    flagName: 'events_management_enabled',
    redirectTo: '/dashboard'
  });

  const [activeTab, setActiveTab] = useState<'calendar' | 'events'>('calendar');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rsvpStatuses, setRsvpStatuses] = useState<Record<string, 'attending' | 'maybe' | 'not_attending'>>({});
  const [activeFilter, setActiveFilter] = useState<EventFilter>('all');
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;

  // Fetch events for the calendar and events list
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
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

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
        
        toast.success(`RSVP updated to ${status === 'attending' ? 'Going' : status === 'maybe' ? 'Maybe' : 'Not Going'}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update RSVP');
      }
    } catch (error) {
      console.error('Error submitting RSVP:', error);
      toast.error('Failed to update RSVP');
    }
  };

  const getRSVPButtonVariant = (eventId: string, buttonStatus: string) => {
    const currentStatus = rsvpStatuses[eventId];
    if (currentStatus === buttonStatus) {
      return 'default';
    }
    return 'outline';
  };

  useEffect(() => {
    if (activeTab === 'events' || activeTab === 'calendar') {
      fetchEvents();
    }
  }, [chapterId, profile?.id, activeTab]);

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear();
    });
  };

  // Filter events by RSVP status
  const filteredEvents = useMemo(() => {
    if (activeFilter === 'all') return events;
    
    return events.filter(event => {
      const userStatus = rsvpStatuses[event.id];
      return userStatus === activeFilter;
    });
  }, [events, rsvpStatuses, activeFilter]);

  const filterButtons = [
    { id: 'all' as EventFilter, label: 'All', icon: Calendar },
    { id: 'attending' as EventFilter, label: 'Going', icon: Users },
    { id: 'maybe' as EventFilter, label: 'Maybe', icon: HelpCircle },
    { id: 'not_attending' as EventFilter, label: 'Not Going', icon: X }
  ];

  // Helper function to get truncated description
  const getDescriptionDisplay = (description: string, eventId: string) => {
    if (!description) return { displayText: '', shouldTruncate: false };
    
    const isExpanded = expandedDescriptions[eventId] || false;
    
    if (description.length <= MAX_DESCRIPTION_CHARS) {
      return {
        displayText: description,
        shouldTruncate: false,
      };
    }
    
    const truncated = description.slice(0, MAX_DESCRIPTION_CHARS).trimEnd();
    
    return {
      displayText: isExpanded ? description : `${truncated}…`,
      shouldTruncate: true,
    };
  };

  const toggleDescription = (eventId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarDate);
    const firstDay = getFirstDayOfMonth(calendarDate);
    const days = [];
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
      const dayEvents = getEventsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <button
          key={day}
          className={`h-12 border border-gray-200 p-1 relative text-left ${
            isToday ? 'bg-orange-50 border-orange-300' : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className={`text-sm font-medium mb-1 ${
            isToday ? 'text-orange-600' : 'text-gray-900'
          }`}>
            {day}
          </div>
          
          {/* Event dots */}
          {dayEvents.length > 0 && (
            <div className="absolute bottom-1 right-1 flex space-x-0.5">
              {dayEvents.slice(0, 3).map((event, index) => (
                <div
                  key={event.id}
                  className="w-2 h-2 rounded-full bg-blue-500"
                  title={event.title}
                />
              ))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-gray-500 ml-0.5">+{dayEvents.length - 3}</div>
              )}
            </div>
          )}
        </button>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 w-full">
        {/* Month/Year Header with Navigation */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-semibold text-lg">
            {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
              className="h-8 w-8 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center"
            >
              <ChevronLeft className="h-4 w-4 text-gray-700" />
            </button>
            <button
              onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
              className="h-8 w-8 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center"
            >
              <ChevronRight className="h-4 w-4 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <div key={`day-${index}`} className="p-2 text-center font-medium text-gray-600 border-r border-gray-200 last:border-r-0 text-sm">
              {day.charAt(0)}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days}
        </div>
      </div>
    );
  };


  // Show loading state while checking feature flag
  if (flagLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-navy-600" />
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (loading && activeTab === 'calendar') {
    return (
      <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-navy-600" />
            <span className="ml-2 text-gray-600">Loading calendar...</span>
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
            <p className="text-red-500 text-sm mb-2">Error loading calendar</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchEvents()}
              className="text-navy-600 border-navy-600 hover:bg-navy-50"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-0 pb-20 px-4">
      <div className="max-w-md mx-auto">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="calendar" className="text-xs">Calendar</TabsTrigger>
            <TabsTrigger value="events" className="text-xs">Events</TabsTrigger>
          </TabsList>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-4">
            {renderCalendar()}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
              </div>
            ) : filteredEvents.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-md border border-navy-100/50 shadow-lg shadow-navy-100/20">
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-slate-700 text-lg mb-2">
                    {activeFilter === 'all' ? 'No upcoming events' : `No events marked as ${activeFilter}`}
                  </p>
                  <p className="text-slate-600 text-sm">
                    {activeFilter === 'all' ? 'Check back later for new events!' : 'Try a different filter'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Filter Buttons */}
                <div className="-mx-4 px-4">
                  <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                    {filterButtons.map((filter) => {
                      const Icon = filter.icon;
                      const isActive = activeFilter === filter.id;
                      const count = filter.id === 'all' ? events.length : 
                                   events.filter(event => rsvpStatuses[event.id] === filter.id).length;
                      
                      return (
                        <button
                          key={filter.id}
                          onClick={() => setActiveFilter(filter.id)}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                            isActive 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{filter.label}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Events List */}
                <div className="space-y-2">
                  {filteredEvents.map((event) => (
                    <Card key={event.id} className="p-3 bg-white/80 backdrop-blur-md border border-navy-100/50 shadow-lg shadow-navy-100/20 transition-all duration-300 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90">
                      <div className="space-y-2">
                        <h4 className="font-medium text-slate-900 text-sm break-words">{event.title}</h4>
                        
                        <div className="space-y-1 text-xs text-slate-700">
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
                        
                        {event.description && (() => {
                          const { displayText, shouldTruncate } = getDescriptionDisplay(event.description, event.id);
                          const isExpanded = expandedDescriptions[event.id] || false;
                          
                          return (
                            <div className="space-y-1">
                              <p className="text-xs text-slate-600 break-words whitespace-pre-wrap">
                                {displayText}
                              </p>
                              {shouldTruncate && (
                                <button
                                  type="button"
                                  onClick={() => toggleDescription(event.id)}
                                  className="text-xs text-navy-600 hover:text-navy-700 font-medium transition-colors"
                                >
                                  {isExpanded ? 'View less' : 'View more'}
                                </button>
                              )}
                            </div>
                          );
                        })()}
                        
                        {/* RSVP Buttons */}
                        <div className="flex space-x-1 pt-2 border-t border-gray-100">
                          <Button 
                            size="sm" 
                            variant={getRSVPButtonVariant(event.id, 'attending') === 'default' ? 'default' : 'outline'}
                            onClick={() => handleRSVP(event.id, 'attending')}
                            className={`h-7 px-3 text-xs flex-1 rounded-full transition-all duration-300 ${
                              getRSVPButtonVariant(event.id, 'attending') === 'default'
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-white/80 backdrop-blur-md border border-navy-500/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-navy-700 hover:text-navy-900'
                            }`}
                            title="Going"
                          >
                            <Users className="h-3 w-3 mr-1" />
                            Going
                          </Button>
                          <Button 
                            size="sm" 
                            variant={getRSVPButtonVariant(event.id, 'maybe') === 'default' ? 'default' : 'outline'}
                            onClick={() => handleRSVP(event.id, 'maybe')}
                            className={`h-7 px-3 text-xs flex-1 rounded-full transition-all duration-300 ${
                              getRSVPButtonVariant(event.id, 'maybe') === 'default'
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-white/80 backdrop-blur-md border border-navy-500/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-navy-700 hover:text-navy-900'
                            }`}
                            title="Maybe"
                          >
                            <HelpCircle className="h-3 w-3 mr-1" />
                            Maybe
                          </Button>
                          <Button 
                            size="sm" 
                            variant={getRSVPButtonVariant(event.id, 'not_attending') === 'default' ? 'default' : 'outline'}
                            onClick={() => handleRSVP(event.id, 'not_attending')}
                            className={`h-7 px-3 text-xs flex-1 rounded-full transition-all duration-300 ${
                              getRSVPButtonVariant(event.id, 'not_attending') === 'default'
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-white/80 backdrop-blur-md border border-navy-500/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-navy-700 hover:text-navy-900'
                            }`}
                            title="Not Going"
                          >
                            <X className="h-3 w-3 mr-1" />
                            No
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
