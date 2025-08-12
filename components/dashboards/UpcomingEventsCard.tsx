'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Users } from 'lucide-react';

// Mock data for upcoming events
const upcomingEvents = [
  {
    id: 1,
    title: "Spring Formal",
    start_time: "March 22, 2024 • 8:00 PM",
    location: "Grand Ballroom",
    rsvp_status: "going",
    attendees: 120
  },
  {
    id: 2,
    title: "Community Service Day",
    start_time: "March 25, 2024 • 9:00 AM",
    location: "City Park",
    rsvp_status: "maybe",
    attendees: 45
  },
  {
    id: 3,
    title: "Study Group Session",
    start_time: "March 28, 2024 • 6:00 PM",
    location: "Library Study Room",
    rsvp_status: "not_going",
    attendees: 15
  }
];

export function UpcomingEventsCard() {
  const [events, setEvents] = useState(upcomingEvents);

  const handleRSVP = (eventId: number, status: 'going' | 'maybe' | 'not_going') => {
    setEvents(prev => prev.map(event => 
      event.id === eventId ? { ...event, rsvp_status: status } : event
    ));
  };

  const getRSVPButtonVariant = (eventStatus: string, buttonStatus: string) => {
    if (eventStatus === buttonStatus) {
      return 'default';
    }
    return 'outline';
  };

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
            <Button variant="outline" size="sm" className="text-navy-600 border-navy-600 hover:bg-navy-50">
              Browse events
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-navy-600" />
          <span>Upcoming Events</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
              <h4 className="font-medium text-gray-900 text-sm mb-2">{event.title}</h4>
              
              <div className="space-y-2 text-xs text-gray-600 mb-3">
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3" />
                  <span>{event.start_time}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-3 w-3" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-3 w-3" />
                  <span>{event.attendees} attending</span>
                </div>
              </div>
              
              <div className="flex space-x-1">
                <Button 
                  size="sm" 
                  variant={getRSVPButtonVariant(event.rsvp_status, 'going')}
                  onClick={() => handleRSVP(event.id, 'going')}
                  className="text-xs h-7 px-2"
                >
                  Going
                </Button>
                <Button 
                  size="sm" 
                  variant={getRSVPButtonVariant(event.rsvp_status, 'maybe')}
                  onClick={() => handleRSVP(event.id, 'maybe')}
                  className="text-xs h-7 px-2"
                >
                  Maybe
                </Button>
                <Button 
                  size="sm" 
                  variant={getRSVPButtonVariant(event.rsvp_status, 'not_going')}
                  onClick={() => handleRSVP(event.id, 'not_going')}
                  className="text-xs h-7 px-2"
                >
                  Not going
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="pt-4 border-t border-gray-100">
          <Button variant="outline" className="w-full text-navy-600 border-navy-600 hover:bg-navy-50">
            View All Events
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
