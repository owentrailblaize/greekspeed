'use client';

import { useState } from 'react';
import { Calendar, Users, TrendingUp, MessageSquare, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EventForm } from '@/components/ui/EventForm';
import { useProfile } from '@/lib/hooks/useProfile';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { createPortal } from 'react-dom';

export function QuickActions() {
  const [showEventModal, setShowEventModal] = useState(false);
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;
  const router = useRouter();

  // Handle schedule meeting/event
  const handleScheduleMeeting = () => {
    setShowEventModal(true);
  };

  // Handle send message navigation
  const handleSendMessage = () => {
    router.push('/dashboard/messages');
  };

  // Handle creating events
  const handleCreateEvent = async (eventData: any) => {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...eventData,
          chapter_id: chapterId,
          created_by: profile?.id || 'system',
          updated_by: profile?.id || 'system',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      toast.success('Event created successfully!');
      setShowEventModal(false);
    } catch (error) {
      toast.error('Failed to create event');
      console.error('Error creating event:', error);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleScheduleMeeting}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Create Event
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleSendMessage}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Send Message
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start opacity-60 cursor-not-allowed" 
            disabled
            title="Feature coming soon!"
          >
            <Users className="h-4 w-4 mr-2" />
            Manage Members
            <Lock className="h-3 w-3 ml-2 text-gray-400" />
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start opacity-60 cursor-not-allowed" 
            disabled
            title="Feature coming soon!"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            View Reports
            <Lock className="h-3 w-3 ml-2 text-gray-400" />
          </Button>
        </CardContent>
      </Card>

      {/* Event Creation Modal with Portal for full screen coverage */}
      {showEventModal && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50">
          {/* Full screen overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-50" />
          
          {/* Modal content centered */}
          <div className="relative flex items-center justify-center min-h-screen p-4">
            <EventForm
              event={null}
              onSubmit={handleCreateEvent}
              onCancel={() => setShowEventModal(false)}
              loading={false}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
} 