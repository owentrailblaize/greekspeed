'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Edit, Trash2, MapPin, Clock, Users, DollarSign } from 'lucide-react';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { useEvents } from '@/lib/hooks/useEvents';
import { EventForm } from '@/components/ui/EventForm';
import { Event, CreateEventRequest, UpdateEventRequest } from '@/types/events';
import { Badge } from '@/components/ui/badge';

export function EventsView() {
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  
  const { 
    events, 
    loading, 
    error, 
    createEvent, 
    updateEvent, 
    deleteEvent 
  } = useEvents({ 
    chapterId: chapterId || '', 
    scope: 'all' 
  });

  const handleCreateEvent = async (eventData: CreateEventRequest) => {
    if (!chapterId) return;
    
    try {
      await createEvent({
        ...eventData,
        created_by: profile?.id || 'system',
        updated_by: profile?.id || 'system'
      });
      
      setShowEventForm(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleUpdateEvent = async (eventData: UpdateEventRequest) => {
    if (!editingEvent) return;
    
    try {
      await updateEvent(editingEvent.id, {
        ...eventData,
        updated_by: profile?.id || 'system'
      });
      
      setShowEventForm(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      await deleteEvent(eventId);
    }
  };

  const formatEventDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const upcomingEvents = events.filter(event => 
    event.status === 'published' && new Date(event.start_time) >= new Date()
  ).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Events</h2>
          <p className="text-sm text-gray-600 mt-1">Manage chapter events and meetings</p>
        </div>
        <Button 
          onClick={() => {
            setEditingEvent(null);
            setShowEventForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">Loading events...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-500">Error: {error}</p>
          </CardContent>
        </Card>
      ) : upcomingEvents.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-2">No upcoming events</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setEditingEvent(null);
                setShowEventForm(true);
              }}
            >
              Create First Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {upcomingEvents.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                      <Badge 
                        className={
                          event.status === 'published' ? 'bg-green-100 text-green-800' :
                          event.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }
                      >
                        {event.status}
                      </Badge>
                    </div>
                    
                    {event.description && (
                      <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        {formatEventDate(event.start_time)}
                      </div>
                      
                      {event.location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          {event.location}
                        </div>
                      )}
                      
                      {event.budget_amount && (
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                          ${event.budget_amount.toLocaleString()}
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                        {event.attendee_count || 0} attending
                        {event.maybe_count ? `, ${event.maybe_count} maybe` : ''}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEditEvent(event)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDeleteEvent(event.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Event Form Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingEvent ? 'Edit Event' : 'Create Event'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowEventForm(false);
                  setEditingEvent(null);
                }}
              >
                ×
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <EventForm
                event={editingEvent}
                onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
                onCancel={() => {
                  setShowEventForm(false);
                  setEditingEvent(null);
                }}
                loading={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

