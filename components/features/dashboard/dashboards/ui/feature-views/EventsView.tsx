'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Edit, Trash2, MapPin, Clock, Users, DollarSign, TrendingUp, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { useEvents } from '@/lib/hooks/useEvents';
import { EventForm } from '@/components/ui/EventForm';
import { Event, CreateEventRequest, UpdateEventRequest } from '@/types/events';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CompactCalendarCard } from '../CompactCalendarCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function EventsView() {
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [sortColumn, setSortColumn] = useState<'title' | 'date' | 'location' | 'budget' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 6;
  
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

  // Calculate budget statistics
  const budgetStats = useMemo(() => {
    const eventsWithBudget = events.filter(e => e.budget_amount && parseFloat(String(e.budget_amount)) > 0);
    const totalBudgetAllocated = eventsWithBudget.reduce((sum, e) => sum + parseFloat(String(e.budget_amount || 0)), 0);
    const startingBudget = 12000; // Default starting budget
    const remaining = startingBudget - totalBudgetAllocated;
    
    return {
      totalBudgetAllocated,
      eventsWithBudget: eventsWithBudget.length,
      totalEvents: events.length,
      startingBudget,
      remaining
    };
  }, [events]);

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


  // Sort all events based on selected column and direction
  const sortedEvents = useMemo(() => {
    const eventsCopy = [...events];
    
    if (!sortColumn) {
      // Default: sort by date (newest first)
      return eventsCopy.sort((a, b) => 
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      );
    }

    return eventsCopy.sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'date':
          comparison = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
          break;
        case 'location':
          const locationA = a.location || '';
          const locationB = b.location || '';
          comparison = locationA.localeCompare(locationB);
          break;
        case 'budget':
          const budgetA = parseFloat(String(a.budget_amount || 0));
          const budgetB = parseFloat(String(b.budget_amount || 0));
          comparison = budgetA - budgetB;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [events, sortColumn, sortDirection]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedEvents.length / eventsPerPage);
  const startIndex = (currentPage - 1) * eventsPerPage;
  const endIndex = startIndex + eventsPerPage;
  const paginatedEvents = sortedEvents.slice(startIndex, endIndex);

  // Reset to page 1 when sort changes
  const handleSort = (column: 'title' | 'date' | 'location' | 'budget') => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Reset to page 1 when events change
  useEffect(() => {
    setCurrentPage(1);
  }, [events.length]);

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/80 backdrop-blur-md border border-navy-100/50 shadow-lg shadow-navy-100/20 transition-all duration-300 hover:shadow-xl hover:shadow-navy-100/30 hover:scale-[1.02] hover:bg-white/90">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-navy-700 text-sm font-medium mb-1">Total Budget Allocated</p>
                <p className="text-2xl font-semibold text-navy-900">
                  ${budgetStats.totalBudgetAllocated.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-navy-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md border border-navy-100/50 shadow-lg shadow-navy-100/20 transition-all duration-300 hover:shadow-xl hover:shadow-navy-100/30 hover:scale-[1.02] hover:bg-white/90">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-navy-700 text-sm font-medium mb-1">Events with Budgets</p>
                <p className="text-2xl font-semibold text-navy-900">
                  {budgetStats.eventsWithBudget}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-navy-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md border border-navy-100/50 shadow-lg shadow-navy-100/20 transition-all duration-300 hover:shadow-xl hover:shadow-navy-100/30 hover:scale-[1.02] hover:bg-white/90">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-navy-700 text-sm font-medium mb-1">Total Events</p>
                <p className="text-2xl font-semibold text-navy-900">
                  {budgetStats.totalEvents}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-navy-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar and Budget Overview - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar Component */}
        <div>
          <CompactCalendarCard />
        </div>

        {/* Budget Overview */}
        <Card className="bg-white/80 backdrop-blur-md border border-navy-100/50 shadow-lg shadow-navy-100/20">
          <CardHeader className="border-b border-navy-100/30">
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-navy-600" />
              <span className="text-navy-900">Budget Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Starting Budget</span>
              <span className="font-semibold">${budgetStats.startingBudget.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Allocated</span>
              <span className="font-semibold text-navy-600">${budgetStats.totalBudgetAllocated.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Remaining</span>
              <span className="font-semibold text-green-600">${budgetStats.remaining.toLocaleString()}</span>
            </div>
            <Progress 
              value={(budgetStats.totalBudgetAllocated / budgetStats.startingBudget) * 100} 
              className="h-2"
            />
            <p className="text-xs text-gray-500 text-center">
              {((budgetStats.totalBudgetAllocated / budgetStats.startingBudget) * 100).toFixed(1)}% of budget allocated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* All Events Table/List */}
        <Card className="bg-white/80 backdrop-blur-md border border-navy-100/50 shadow-lg shadow-navy-100/20">
        <CardHeader className="pb-2 border-b border-navy-100/30">
          <div className="flex items-center justify-between">
            <CardTitle>All Events</CardTitle>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {sortedEvents.length} {sortedEvents.length === 1 ? 'event' : 'events'}
                </span>
                {totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="h-8 px-3 text-xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={`h-8 w-8 p-0 text-xs flex-shrink-0 ${
                          currentPage === page
                            ? 'bg-navy-600 text-white hover:bg-navy-700'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="h-8 px-3 text-xs"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading events...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">Error: {error}</p>
            </div>
          ) : sortedEvents.length === 0 ? (
            <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 mb-2">No events found</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setEditingEvent(null);
                setShowEventForm(true);
              }}
            >
              Create First Event
            </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button
                        onClick={() => handleSort('title')}
                        className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
                      >
                        <span>Title</span>
                        {sortColumn === 'title' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('date')}
                        className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
                      >
                        <span>Date & Time</span>
                        {sortColumn === 'date' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('location')}
                        className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
                      >
                        <span>Location</span>
                        {sortColumn === 'location' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('budget')}
                        className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
                      >
                        <span>Budget</span>
                        {sortColumn === 'budget' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>Attendees</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEvents.map((event) => (
                    <TableRow key={event.id} className="whitespace-nowrap">
                      <TableCell className="font-medium max-w-[200px]">
                        <span className="truncate block" title={event.title}>{event.title}</span>
                      </TableCell>
                      <TableCell className="max-w-[180px]">
                        <div className="flex items-center text-sm whitespace-nowrap">
                          <Clock className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{formatEventDate(event.start_time)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px]">
                        {event.location ? (
                          <div className="flex items-center text-sm whitespace-nowrap">
                            <MapPin className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                            <span className="truncate" title={event.location}>{event.location}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">TBD</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[120px]">
                        {event.budget_amount ? (
                          <div className="flex items-center text-sm whitespace-nowrap">
                            <DollarSign className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                            <span className="truncate">${parseFloat(String(event.budget_amount)).toLocaleString()}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center text-sm">
                          <Users className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                          {event.attendee_count || 0}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                      <Badge 
                        className={
                          event.status === 'published' ? 'bg-green-100 text-green-800' :
                          event.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }
                      >
                        {event.status}
                      </Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex justify-end space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEditEvent(event)}
                            className="flex-shrink-0"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDeleteEvent(event.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
                </div>
          )}
              </CardContent>
            </Card>

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
                onSubmit={async (data) => {
                  if (editingEvent) {
                    await handleUpdateEvent(data as UpdateEventRequest);
                  } else {
                    await handleCreateEvent(data as CreateEventRequest);
                  }
                }}
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

