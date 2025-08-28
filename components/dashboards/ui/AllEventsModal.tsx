'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Edit, Eye, X, User, Clock, Shield } from 'lucide-react';
import { Event } from '@/types/events';
import { toast } from 'react-toastify';
import { 
  parseRawTime, 
  parseRawDetailedTime,
  getTimezoneInfo
} from '@/lib/utils/timezoneUtils';

interface AllEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: Event[];
  loading: boolean;
  error: string | null;
}

export function AllEventsModal({ isOpen, onClose, events, loading, error }: AllEventsModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Prevent body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatDateDetailed = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getEventStatusColor = (event: Event) => {
    const now = new Date();
    const eventDate = new Date(event.start_time);
    
    if (eventDate < now) {
      return 'bg-gray-100 text-gray-800'; // Past event
    } else if (eventDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return 'bg-orange-100 text-orange-800'; // Today/tomorrow
    } else {
      return 'bg-blue-100 text-blue-800'; // Future event
    }
  };

  const getEventStatusText = (event: Event) => {
    const now = new Date();
    const eventDate = new Date(event.start_time);
    
    if (eventDate < now) {
      return 'Past';
    } else if (eventDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return 'Upcoming';
    } else {
      return 'Future';
    }
  };

  // Action handlers
  const handleEditEvent = (eventId: string) => {
    toast.info('Event editing is currently locked. This feature will be available soon!');
  };

  const handleViewRSVPs = (eventId: string) => {
    toast.info('RSVP viewing is currently locked. This feature will be available soon!');
  };

  if (!isOpen || !mounted) return null;

  // Create portal to render modal at document body level
  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col relative">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <div>
              <h3 className="text-2xl font-bold text-navy-900">All Chapter Events</h3>
              <p className="text-sm text-gray-500 mt-1">
                {getTimezoneInfo().note}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content - All Events List */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium mb-2">Loading events...</p>
                <p className="text-sm text-gray-500">Please wait while we fetch your chapter events.</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-red-300" />
                <p className="text-lg font-medium mb-2 text-red-600">Error loading events</p>
                <p className="text-sm text-red-500 mb-4">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium mb-2">No events found</p>
                <p className="text-sm">Create your first event to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Event Header */}
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar className="h-5 w-5 text-navy-600" />
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-gray-900 truncate">
                              {event.title}
                            </h4>
                            {event.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <Badge className={getEventStatusColor(event)}>
                            {getEventStatusText(event)}
                          </Badge>
                        </div>

                        {/* Event Metadata - Using RAW parsing */}
                        <div className="space-y-2 text-xs text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className="font-medium">Start:</span>
                            <span>{parseRawDetailedTime(event.start_time)}</span>
                          </div>
                          
                          {event.end_time && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className="font-medium">End:</span>
                              <span>{parseRawDetailedTime(event.end_time)}</span>
                            </div>
                          )}
                          
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>
                              {event.attendee_count || 0} going • {event.not_attending_count || 0} not going • {event.maybe_count || 0} maybe
                            </span>
                          </div>
                        </div>

                        {/* Budget Information */}
                        {event.budget_amount && (
                          <div className="mb-3">
                            <div className="flex items-center gap-2">
                              <Shield className="h-3 w-3 text-gray-400" />
                              <span className="text-sm font-medium text-gray-700">
                                Budget: ${event.budget_amount}
                              </span>
                              {event.budget_label && (
                                <span className="text-xs text-gray-500">({event.budget_label})</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditEvent(event.id)}
                          title="Event editing is locked - coming soon!"
                          className="opacity-60 cursor-not-allowed"
                          disabled
                        >
                          <Edit className="h-4 w-4" />
                          <Shield className="h-3 w-3 ml-1 text-gray-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewRSVPs(event.id)}
                          title="RSVP viewing is locked - coming soon!"
                          className="opacity-60 cursor-not-allowed"
                          disabled
                        >
                          <Eye className="h-4 w-4" />
                          <Shield className="h-3 w-3 ml-1 text-gray-400" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Event Count Footer */}
            {events.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  Showing {events.length} of {events.length} events
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
