'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProfile } from '@/lib/hooks/useProfile';
import { Event } from '@/types/events';

export function CompactCalendarCard() {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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

  const getEventTypeColor = (type: string): string => {
    switch (type) {
      case 'formal': return 'bg-purple-100 text-purple-800';
      case 'alumni': return 'bg-blue-100 text-blue-800';
      case 'brotherhood': return 'bg-green-100 text-green-800';
      case 'recruitment': return 'bg-orange-100 text-orange-800';
      case 'meeting': return 'bg-gray-100 text-gray-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderCompactCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarDate);
    const firstDay = getFirstDayOfMonth(calendarDate);
    const days = [];
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
      const events = getEventsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <div key={day} className={`h-8 border border-gray-200 p-1 ${isToday ? 'bg-orange-50 border-orange-300' : 'bg-white'}`}>
          <div className={`text-xs font-medium mb-1 ${isToday ? 'text-orange-600' : 'text-gray-900'}`}>
            {day}
          </div>
          <div className="space-y-0.5">
            {events.slice(0, 1).map(event => (
              <div key={event.id} className={`text-xs px-1 py-0.5 rounded truncate ${getEventTypeColor('meeting')}`}>
                {event.title}
              </div>
            ))}
            {events.length > 1 && (
              <div className="text-xs text-gray-500">+{events.length - 1}</div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 w-full">
        {/* Calendar Title - Now inside the calendar */}
        <div className="flex items-center justify-center p-2 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-navy-600" />
            <span className="font-semibold text-sm text-navy-600">Calendar</span>
          </div>
        </div>

        {/* Month/Year Header with Navigation */}
        <div className="flex items-center justify-between p-2 border-b border-gray-200">
          <h3 className="font-semibold text-sm">
            {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
          </h3>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
              className="h-6 w-6 p-0 flex items-center justify-center"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
              className="h-6 w-6 p-0 flex items-center justify-center"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Days of week header - Fixed duplicate keys */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <div key={`day-${index}`} className="p-1 text-center font-medium text-gray-600 border-r border-gray-200 last:border-r-0 text-xs">
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 w-full">
        <div className="flex items-center justify-center p-2 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-navy-600" />
            <span className="font-semibold text-sm text-navy-600">Calendar</span>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 w-full">
        <div className="flex items-center justify-center p-2 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-navy-600" />
            <span className="font-semibold text-sm text-navy-600">Calendar</span>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500 text-sm mb-2">Error loading calendar</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
            className="text-navy-600 border-navy-600 hover:bg-navy-50 h-8"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return renderCompactCalendar();
}
