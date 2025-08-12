'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Edit, Eye } from 'lucide-react';

// Mock data for events panel
const eventsData = [
  {
    id: 1,
    title: "Spring Formal",
    startISO: "2024-03-22T20:00:00Z",
    location: "Grand Ballroom",
    rsvpYes: 45,
    rsvpNo: 8,
    rsvpMaybe: 12
  },
  {
    id: 2,
    title: "Community Service Day",
    startISO: "2024-03-25T09:00:00Z",
    location: "City Park",
    rsvpYes: 28,
    rsvpNo: 5,
    rsvpMaybe: 7
  },
  {
    id: 3,
    title: "Study Group Session",
    startISO: "2024-03-28T18:00:00Z",
    location: "Library Study Room",
    rsvpYes: 15,
    rsvpNo: 3,
    rsvpMaybe: 2
  },
  {
    id: 4,
    title: "Chapter Meeting",
    startISO: "2024-04-01T19:00:00Z",
    location: "Chapter House",
    rsvpYes: 52,
    rsvpNo: 2,
    rsvpMaybe: 1
  }
];

export function EventsPanel() {
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const handleEditEvent = (eventId: number) => {
    console.log('Edit event:', eventId);
    // TODO: Open event edit modal/form
  };

  const handleViewRSVPs = (eventId: number) => {
    console.log('View RSVPs for event:', eventId);
    // TODO: Open RSVP list modal
  };

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-navy-600" />
          <span>Events Panel</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {eventsData.map((event) => (
            <div key={event.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  {formatDate(event.startISO)}
                </Badge>
              </div>
              
              <div className="space-y-2 text-xs text-gray-600 mb-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-3 w-3" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-3 w-3" />
                  <span>{event.rsvpYes} going • {event.rsvpNo} not going • {event.rsvpMaybe} maybe</span>
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
        
        <div className="pt-4 border-t border-gray-100">
          <Button variant="outline" className="w-full text-navy-600 border-navy-600 hover:bg-navy-50">
            Manage All Events
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 