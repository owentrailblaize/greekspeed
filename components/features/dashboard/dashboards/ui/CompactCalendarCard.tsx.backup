'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Users } from 'lucide-react';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { Event } from '@/types/events';
import { parseRawTime } from '@/lib/utils/timezoneUtils';

export function CompactCalendarCard() {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<Event | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0, placement: 'bottom-right' });
  
  const popupRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;

  // Calculate optimal popup position to prevent overflow
  const calculatePopupPosition = useCallback((mouseX: number, mouseY: number) => {
    if (!popupRef.current) {
      // Fallback position if popup isn't rendered yet
      return { 
        x: Math.min(mouseX + 10, window.innerWidth - 340), 
        y: Math.max(mouseY - 10, 10), 
        placement: 'bottom-right' 
      };
    }

    const popup = popupRef.current;
    const popupRect = popup.getBoundingClientRect();
    const popupWidth = popupRect.width;
    const popupHeight = popupRect.height;
    
    const padding = 16; // Safe padding from viewport edges
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let x = mouseX + 10;
    let y = mouseY - 10;
    let placement = 'bottom-right';
    
    // Check horizontal overflow - flip to left side if needed
    if (x + popupWidth > viewportWidth - padding) {
      x = mouseX - popupWidth - 10;
      placement = 'bottom-left';
    }
    
    // Check vertical overflow - flip to top if needed
    if (y - popupHeight < padding) {
      y = mouseY + 10;
      placement = placement === 'bottom-right' ? 'top-right' : 'top-left';
    }
    
    // Final boundary checks to ensure popup stays within viewport
    x = Math.max(padding, Math.min(x, viewportWidth - popupWidth - padding));
    y = Math.max(padding, Math.min(y, viewportHeight - popupHeight - padding));
    
    return { x, y, placement };
  }, []);

  // Recalculate position when popup is rendered
  useEffect(() => {
    if (hoveredEvent && popupRef.current) {
      const newPosition = calculatePopupPosition(hoverPosition.x, hoverPosition.y);
      setPopupPosition(newPosition);
    }
  }, [hoveredEvent, hoverPosition, calculatePopupPosition]);

  // Fetch events for the calendar - ONLY for this chapter
  const fetchEvents = async () => {
    if (!chapterId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // CompactCalendarCard - Fetching events for chapter
      const response = await fetch(`/api/events?chapter_id=${chapterId}&scope=all`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      // CompactCalendarCard - Fetched events
      setEvents(data);
    } catch (err) {
      console.error('CompactCalendarCard - Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  const handleEventHover = (event: Event, mouseEvent: React.MouseEvent) => {
    setHoveredEvent(event);
    setHoverPosition({
      x: mouseEvent.clientX,
      y: mouseEvent.clientY
    });
  };

  const handleEventLeave = () => {
    setHoveredEvent(null);
  };

  const renderCompactCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarDate);
    const firstDay = getFirstDayOfMonth(calendarDate);
    const days = [];
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 md:h-12"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
      const dayEvents = getEventsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <div key={day} className={`h-8 md:h-12 border border-gray-200 p-1 relative ${isToday ? 'bg-orange-50 border-orange-300' : 'bg-white'}`}>
          <div className={`text-xs font-medium mb-1 ${isToday ? 'text-orange-600' : 'text-gray-900'}`}>
            {day}
          </div>
          
          {/* Event dots positioned near the date number - all blue */}
          {dayEvents.length > 0 && (
            <div className="absolute top-1 right-1 flex space-x-0.5">
              {dayEvents.slice(0, 3).map((event, index) => (
                <div
                  key={event.id}
                  className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full cursor-pointer hover:scale-125 transition-transform bg-blue-500"
                  onMouseEnter={(e) => handleEventHover(event, e)}
                  onMouseLeave={handleEventLeave}
                  title={event.title}
                />
              ))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-gray-500 ml-0.5">+{dayEvents.length - 3}</div>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div ref={calendarRef} className="bg-white rounded-lg border border-gray-200 w-full relative">
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
            <button
              onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
              className="h-6 w-6 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center"
            >
              <ChevronLeft className="h-3 w-3 text-gray-700" />
            </button>
            <button
              onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
              className="h-6 w-6 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center"
            >
              <ChevronRight className="h-3 w-3 text-gray-700" />
            </button>
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
            onClick={() => fetchEvents()}
            className="text-navy-600 border-navy-600 hover:bg-navy-50 h-8"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {renderCompactCalendar()}
      
      {/* Event Hover Popup - Rendered outside calendar container for better positioning */}
      {hoveredEvent && (
        <div 
          ref={popupRef}
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs pointer-events-none transition-all duration-150 ease-out"
          style={{
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`,
            transform: popupPosition.placement.includes('bottom') 
              ? 'translateY(-100%)' 
              : 'translateY(0)'
          }}
        >
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-900">{hoveredEvent.title}</h4>
            
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <Clock className="h-3 w-3" />
                <span>{parseRawTime(hoveredEvent.start_time)}</span>
              </div>
              {hoveredEvent.location && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-3 w-3" />
                  <span>{hoveredEvent.location}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Users className="h-3 w-3" />
                <span>{hoveredEvent.attendee_count || 0} attending</span>
              </div>
            </div>
            
            {hoveredEvent.description && (
              <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                {hoveredEvent.description}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
