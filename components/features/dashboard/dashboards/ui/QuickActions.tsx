'use client';

import { useState, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EventForm } from '@/components/ui/EventForm';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { toast } from 'react-toastify';
import { createPortal } from 'react-dom';
import { Lock } from 'lucide-react';

// Action configuration interface
export interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  disabled?: boolean;
  showLock?: boolean;
  title?: string;
}

// Component props
export interface QuickActionsProps {
  actions: QuickAction[];
  title?: string;
  headerClassName?: string;
  contentClassName?: string;
  showEventModal?: boolean; // If true, handles event modal internally
  eventModalConfig?: {
    onSubmit?: (eventData: any) => Promise<void>;
    onCancel?: () => void;
    modalTitle?: string;
  };
}

export function QuickActions({ 
  actions, 
  title = "Quick Actions",
  headerClassName = "pb-0",
  contentClassName = "space-y-3",
  showEventModal = false,
  eventModalConfig
}: QuickActionsProps) {
  const [showEventModalState, setShowEventModalState] = useState(false);
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;

  // Handle event creation if event modal is enabled
  const handleCreateEvent = async (eventData: any) => {
    if (!eventModalConfig?.onSubmit) {
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

        toast.success('Meeting scheduled successfully!');
        setShowEventModalState(false);
      } catch (error) {
        toast.error('Failed to schedule meeting');
        console.error('Error creating event:', error);
      }
    } else {
      await eventModalConfig.onSubmit(eventData);
      setShowEventModalState(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className={headerClassName}>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className={contentClassName}>
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || 'outline'}
              className={action.className || 'w-full justify-start'}
              onClick={action.onClick}
              disabled={action.disabled}
              title={action.title}
            >
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
              {action.showLock && (
                <Lock className="h-3 w-3 ml-2 text-gray-400" />
              )}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Event Creation Modal - Only shown if showEventModal is true */}
      {showEventModal && showEventModalState && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black bg-opacity-50" />
          <div className="relative flex items-center justify-center min-h-screen p-4">
            <EventForm
              event={null}
              onSubmit={handleCreateEvent}
              onCancel={() => {
                setShowEventModalState(false);
                eventModalConfig?.onCancel?.();
              }}
              loading={false}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// Helper to open event modal from action
export const createEventModalHandler = (
  setShowModal: (show: boolean) => void
) => () => {
  setShowModal(true);
}; 