'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useProfile } from '@/lib/hooks/useProfile';
import { Event } from '@/types/events';
import { parseRawTime } from '@/lib/utils/timezoneUtils';

export function MobileCalendarPage() {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;

  // Fetch events for the calendar
  useEffect(() => {
    const fetchEvents = async () => {
      if (!chapterId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/events?chapter_id=${chapterId}&scope=all`);
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [chapterId]);

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
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`h-12 border border-gray-200 p-1 relative text-left ${
            isToday ? 'bg-orange-50 border-orange-300' : 
            isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className={`text-sm font-medium mb-1 ${
            isToday ? 'text-orange-600' : 
            isSelected ? 'text-blue-600' : 'text-gray-900'
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

  const renderSelectedDateEvents = () => {
    if (!selectedDate) return null;

    const dayEvents = getEventsForDate(selectedDate);
    const dateString = selectedDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{dateString}</h3>
        
        {dayEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No events scheduled</p>
          </div>
        ) : (
          <div className="space-y-0">
            {dayEvents.map((event, index) => (
              <div 
                key={event.id} 
                className={`px-4 py-4 ${index !== dayEvents.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                  <button
                    onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {expandedEvent === event.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
                
                <div className="space-y-1 text-xs text-gray-600 mb-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3" />
                    <span>{parseRawTime(event.start_time)}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-3 w-3" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Users className="h-3 w-3" />
                    <span>{event.attendee_count || 0} attending</span>
                  </div>
                </div>
                
                {expandedEvent === event.id && event.description && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-600">{event.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading calendar...</div>
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
              onClick={() => window.location.reload()}
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
    <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-6">
          <Calendar className="h-6 w-6 text-navy-600" />
          <h1 className="text-xl font-semibold text-gray-900">Calendar</h1>
        </div>

        {/* Calendar */}
        {renderCalendar()}

        {/* Selected Date Events */}
        {renderSelectedDateEvents()}
      </div>
    </div>
  );
}
