import { useState, useEffect, useCallback } from 'react';
import { Event, CreateEventRequest, UpdateEventRequest, RSVPRequest } from '@/types/events';

interface UseEventsOptions {
  chapterId: string;
  scope?: 'upcoming' | 'all';
}

export function useEvents({ chapterId, scope = 'all' }: UseEventsOptions) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!chapterId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/events?chapter_id=${chapterId}&scope=${scope}`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [chapterId, scope]);

  const createEvent = useCallback(async (eventData: CreateEventRequest): Promise<Event | null> => {
    try {
      setError(null);
      
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...eventData,
          chapter_id: chapterId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }

      const result = await response.json();
      await fetchEvents(); // Refresh the events list
      return result.event;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
      return null;
    }
  }, [chapterId, fetchEvents]);

  const updateEvent = useCallback(async (eventId: string, updateData: UpdateEventRequest): Promise<Event | null> => {
    try {
      setError(null);
      
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update event');
      }

      const result = await response.json();
      await fetchEvents(); // Refresh the events list
      return result.event;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
      return null;
    }
  }, [fetchEvents]);

  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete event');
      }

      await fetchEvents(); // Refresh the events list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
      return false;
    }
  }, [fetchEvents]);

  const submitRSVP = useCallback(async (eventId: string, rsvpData: RSVPRequest, userId: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...rsvpData,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit RSVP');
      }

      await fetchEvents(); // Refresh the events list to get updated RSVP counts
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit RSVP');
      return false;
    }
  }, [fetchEvents]);

  // Fetch events on mount and when dependencies change
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    submitRSVP,
  };
}
