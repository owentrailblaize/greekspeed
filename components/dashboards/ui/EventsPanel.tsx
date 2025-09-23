'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Edit, Eye, X } from 'lucide-react';
import { useProfile } from '@/lib/hooks/useProfile';
import { Event } from '@/types/events';

export function EventsPanel() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllEventsModal, setShowAllEventsModal] = useState(false);
  
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;

  // Fetch events for the user's chapter
  useEffect(() => {
    const fetchEvents = async () => {
      if (!chapterId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // EventsPanel - Fetching events for chapter
        const response = await fetch(`/api/events?chapter_id=${chapterId}&scope=upcoming`);
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        // EventsPanel - Fetched events
        setEvents(data);
      } catch (err) {
        console.error('EventsPanel - Error fetching events:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [chapterId]);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const handleEditEvent = (eventId: string) => {
    // Edit event
    // TODO: Open event edit modal/form
  };

  const handleViewRSVPs = (eventId: string) => {
    // View RSVPs for event
    // TODO: Open RSVP list modal
  };

  return (
    <>
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-navy-600" />
            <span>Events Panel</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading events...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">Error loading events: {error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No upcoming events</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.slice(0, 3).map((event) => (
                <div key={event.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      {formatDate(event.start_time)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-xs text-gray-600 mb-3">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-3 w-3" />
                      <span>{event.location || 'TBD'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-3 w-3" />
                      <span>
                        {event.attendee_count || 0} going • {event.not_attending_count || 0} not going • {event.maybe_count || 0} maybe
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEditEvent(event.id)}
                      className="text-navy-600 border-navy-600 hover:bg-navy-50 text-xs h-7 px-2"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewRSVPs(event.id)}
                      className="text-navy-600 border-navy-600 hover:bg-navy-50 text-xs h-7 px-2"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View RSVPs
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="pt-4 border-t border-gray-100">
            <Button 
              variant="outline" 
              className="w-full text-navy-600 border-navy-600 hover:bg-navy-50"
              onClick={() => setShowAllEventsModal(true)}
            >
              View All Events
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* View All Events Modal */}
      {showAllEventsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">All Chapter Events</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllEventsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading events...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-500">Error loading events: {error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.location.reload()}
                    className="mt-2"
                  >
                    Retry
                  </Button>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No events found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-gray-900">{event.title}</h3>
                        <Badge className="bg-blue-100 text-blue-800">
                          {formatDate(event.start_time)}
                        </Badge>
                      </div>
                      
                      {event.description && (
                        <p className="text-gray-600 mb-3">{event.description}</p>
                      )}
                      
                      <div className="space-y-2 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location || 'TBD'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>
                            {event.attendee_count || 0} going • {event.not_attending_count || 0} not going • {event.maybe_count || 0} maybe
                          </span>
                        </div>
                        {event.budget_amount && (
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">Budget: ${event.budget_amount}</span>
                            {event.budget_label && (
                              <span className="text-gray-500">({event.budget_label})</span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditEvent(event.id)}
                          className="text-navy-600 border-navy-600 hover:bg-navy-50"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewRSVPs(event.id)}
                          className="text-navy-600 border-navy-600 hover:bg-navy-50"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View RSVPs
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-center text-sm text-gray-600">
                Showing {events.length} of {events.length} events
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 