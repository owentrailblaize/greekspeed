'use client';
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, Users, DollarSign, BookOpen, Clock, Plus, Edit, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Trash2, X, Lock, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { EventForm } from "@/components/ui/EventForm";
import { useEvents } from "@/lib/hooks/useEvents";
import { useProfile } from "@/lib/hooks/useProfile";
import { Event as EventType, CreateEventRequest, UpdateEventRequest } from "@/types/events";
import { useVendors } from "@/lib/hooks/useVendors";
import { VendorForm } from "@/components/ui/VendorForm";
import { VendorContact, CreateVendorRequest, UpdateVendorRequest } from "@/types/vendors";
import { SocialFeed } from "@/components/features/dashboard/dashboards/ui/SocialFeed";
import { CompactCalendarCard } from "@/components/features/dashboard/dashboards/ui/CompactCalendarCard";

const eventBudget = {
  totalAllocated: 12000,
  spent: 8500,
  remaining: 3500,
  upcomingEvents: 4
};

const vendorContacts = [
  { name: "Oxford Catering Co.", type: "Catering", contact: "Sarah Johnson", phone: "(662) 555-0123", email: "sarah@oxfordcatering.com", rating: 4.8 },
  { name: "Party Perfect Rentals", type: "Equipment", contact: "Mike Davis", phone: "(662) 555-0456", email: "mike@partyrentals.com", rating: 4.6 },
  { name: "Grove Sound Systems", type: "Audio/Visual", contact: "Jessica Wilson", phone: "(662) 555-0789", email: "info@grovesound.com", rating: 4.9 },
  { name: "Elite Security Services", type: "Security", contact: "Robert Brown", phone: "(662) 555-0321", email: "rob@elitesecurity.com", rating: 4.7 }
];

const socialLoreEntries = [
  { title: "Spring Formal Venue Tips", content: "The Depot downtown works best for 80+ people. Book 6 months in advance. Parking can be an issue - coordinate with nearby lots.", date: "2023-03-15", author: "Previous Social Chair" },
  { title: "Successful Alumni Events", content: "Happy hour format works better than dinner for alumni engagement. Thursday evenings 6-8 PM get best attendance. Always provide name tags with graduation year.", date: "2023-05-10", author: "Alumni Relations" },
  { title: "Budget Management", content: "Always budget 10% extra for unexpected costs. DJ equipment rental is cheaper than hiring a full DJ for casual events. Food trucks are popular for outdoor events.", date: "2023-09-20", author: "Treasurer Notes" }
];

// Budget data
const budgetBreakdown = [
  { category: "Spring Formal", allocated: 2500, spent: 1800, remaining: 700, transactions: [
    { item: "Venue Deposit", amount: 800, date: "2024-02-15", status: "paid" },
    { item: "Catering Down Payment", amount: 600, date: "2024-02-20", status: "paid" },
    { item: "Decoration Supplies", amount: 400, date: "2024-03-01", status: "paid" }
  ]},
  { category: "Alumni Events", allocated: 1200, spent: 850, remaining: 350, transactions: [
    { item: "Alumni Mixer Venue", amount: 400, date: "2024-03-05", status: "paid" },
    { item: "Alumni Mixer Catering", amount: 450, date: "2024-03-10", status: "paid" }
  ]},
  { category: "Brotherhood Events", allocated: 800, spent: 600, remaining: 200, transactions: [
    { item: "BBQ Food & Supplies", amount: 350, date: "2024-03-15", status: "paid" },
    { item: "Games & Activities", amount: 250, date: "2024-03-18", status: "paid" }
  ]},
  { category: "Recruitment", allocated: 1500, spent: 980, remaining: 520, transactions: [
    { item: "Recruitment Dinner", amount: 600, date: "2024-02-28", status: "paid" },
    { item: "Welcome Gifts", amount: 380, date: "2024-03-02", status: "paid" }
  ]}
];

export function SocialChairDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [newLoreEntry, setNewLoreEntry] = useState({ title: "", content: "" });
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  // Event management state
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Add vendor management state
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorContact | null>(null);
  const [isSubmittingVendor, setIsSubmittingVendor] = useState(false);
  
  // Add reminder management state
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [reminderSuccess, setReminderSuccess] = useState<string | null>(null);
  
  // Get user profile and chapter ID
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;
  
  // Use events hook
  const { 
    events, 
    loading: eventsLoading, 
    error: eventsError, 
    createEvent, 
    updateEvent, 
    deleteEvent 
  } = useEvents({ 
    chapterId: chapterId || '', 
    scope: 'all' 
  });

  // Add vendors hook
  const { 
    vendors, 
    loading: vendorsLoading, 
    error: vendorsError, 
    createVendor, 
    updateVendor, 
    deleteVendor 
  } = useVendors({ 
    chapterId: chapterId || '' 
  });

  // Debug logging
  useEffect(() => {
    // SocialChairDashboard - Debug info
  }, [chapterId, events, eventsLoading, eventsError]);

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

  // Event management functions
  const handleCreateEvent = async (eventData: CreateEventRequest) => {
    if (!chapterId) return;
    
    setIsSubmitting(true);
    try {
      const newEvent = await createEvent({
        ...eventData,
        created_by: profile?.id || 'system',
        updated_by: profile?.id || 'system'
      });
      
      if (newEvent) {
        setShowEventForm(false);
        // Reset form data
        setEditingEvent(null);
      }
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEvent = async (eventData: UpdateEventRequest) => {
    if (!editingEvent) return;
    
    setIsSubmitting(true);
    try {
      const updatedEvent = await updateEvent(editingEvent.id, {
        ...eventData,
        updated_by: profile?.id || 'system'
      });
      
      if (updatedEvent) {
        setShowEventForm(false);
        setEditingEvent(null);
      }
    } catch (error) {
      console.error('Error updating event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditEvent = (event: EventType) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      const success = await deleteEvent(eventId);
      if (success) {
        // Event deleted successfully
      }
    }
  };

  const handleCancelEventForm = () => {
    setShowEventForm(false);
    setEditingEvent(null);
  };

  const handleSubmitEvent = async (data: CreateEventRequest | UpdateEventRequest) => {
    if (editingEvent) {
      await handleUpdateEvent(data as UpdateEventRequest);
    } else {
      await handleCreateEvent(data as CreateEventRequest);
    }
  };

  // Vendor management functions
  const handleCreateVendor = async (vendorData: CreateVendorRequest) => {
    if (!chapterId) return;
    
    setIsSubmittingVendor(true);
    try {
      // Add the missing user ID fields
      const vendorWithUser = {
        ...vendorData,
        created_by: profile?.id || '', // Add this
        updated_by: profile?.id || ''  // Add this
      };
      
      // Sending vendor with user data
      
      const newVendor = await createVendor(vendorWithUser);
      
      if (newVendor) {
        setShowVendorForm(false);
        setEditingVendor(null);
      }
    } catch (error) {
      console.error('Error creating vendor:', error);
    } finally {
      setIsSubmittingVendor(false);
    }
  };

  const handleUpdateVendor = async (vendorData: UpdateVendorRequest) => {
    if (!editingVendor) return;
    
    setIsSubmittingVendor(true);
    try {
      const updatedVendor = await updateVendor(editingVendor.id, vendorData);
      
      if (updatedVendor) {
        setShowVendorForm(false);
        setEditingVendor(null);
      }
    } catch (error) {
      console.error('Error updating vendor:', error);
    } finally {
      setIsSubmittingVendor(false);
    }
  };

  const handleEditVendor = (vendor: VendorContact) => {
    setEditingVendor(vendor);
    setShowVendorForm(true);
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) {
      const success = await deleteVendor(vendorId);
      if (success) {
        // Vendor deleted successfully
      }
    }
  };

  const handleCancelVendorForm = () => {
    setShowVendorForm(false);
    setEditingVendor(null);
  };

  const handleSubmitVendor = async (data: CreateVendorRequest | UpdateVendorRequest) => {
    if (editingVendor) {
      await handleUpdateVendor(data as UpdateVendorRequest);
    } else {
      await handleCreateVendor(data as CreateVendorRequest);
    }
  };

  // Event reminder functions
  const handleSendReminder = async (eventId: string) => {
    setSendingReminder(eventId);
    
    try {
      const response = await fetch('/api/events/send-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          chapterId
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Reminder emails sent
        setReminderSuccess(eventId);
        // Clear success state after 2 seconds
        setTimeout(() => setReminderSuccess(null), 2000);
      } else {
        const error = await response.json();
        console.error('❌ Failed to send reminder emails:', error);
      }
    } catch (error) {
      console.error('Error sending reminder emails:', error);
    } finally {
      setSendingReminder(null);
    }
  };

  // Format event data for display
  const formatEventDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatEventTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Keep the upcomingEvents filter as is (without slice)
  const upcomingEvents = events.filter(event => 
    event.status === 'published' && new Date(event.start_time) >= new Date()
  );

  // Calculate total attendees
  const totalAttendees = upcomingEvents.reduce((sum, event) => 
    sum + (event.attendee_count || 0), 0
  );

  // Transform events for display (to match existing mock data structure) - WITH SORTING
  const displayEvents = upcomingEvents
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .map(event => ({
      name: event.title,
      date: formatEventDate(event.start_time),
      budget: event.budget_amount || 0,
      status: event.status,
      attendees: event.attendee_count || 0
    }));

  // Budget calculation using real events data - CORRECTED VERSION
  const budgetData = useMemo(() => {
    if (!events || events.length === 0) {
      return {
        totalAllocated: 0,
        totalSpent: 0,
        remaining: 0,
        categories: [],
        eventsWithBudget: [],
        startingBudget: 12000 // Default starting budget
      };
    }

    // Filter events that have budget amounts
    const eventsWithBudget = events.filter(event => 
      event.budget_amount && parseFloat(String(event.budget_amount)) > 0
    );

    // Calculate totals
    const totalAllocated = eventsWithBudget.reduce((sum, event) => 
      sum + parseFloat(String(event.budget_amount || '0')), 0
    );

    // For MVP, we'll assume spent = allocated (since we don't have expense tracking yet)
    const totalSpent = totalAllocated;
    
    // STARTING BUDGET - This is your hardcoded starting point
    const STARTING_BUDGET = 12000; // You can adjust this value
    
    // Calculate remaining budget by subtracting allocated from starting budget
    const remaining = STARTING_BUDGET - totalAllocated;

    // Create categories based on budget_label or event title patterns
    const categoryMap = new Map<string, { allocated: number; events: any[] }>();

    eventsWithBudget.forEach(event => {
      // Determine category based on budget_label or event title
      let category = 'General Events';
      
      if (event.budget_label) {
        // Use budget_label if available
        category = event.budget_label;
      } else if (event.title) {
        // Infer category from title
        const title = event.title.toLowerCase();
        if (title.includes('formal') || title.includes('dance') || title.includes('party')) {
          category = 'Formal Events';
        } else if (title.includes('alumni') || title.includes('mixer')) {
          category = 'Alumni Events';
        } else if (title.includes('recruitment') || title.includes('rush')) {
          category = 'Recruitment';
        } else if (title.includes('brotherhood') || title.includes('bonding')) {
          category = 'Brotherhood Events';
        } else if (title.includes('meeting') || title.includes('onboarding')) {
          category = 'Meetings & Planning';
        }
      }

      // Add to category
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { allocated: 0, events: [] });
      }
      
      const categoryData = categoryMap.get(category)!;
      categoryData.allocated += parseFloat(String(event.budget_amount || '0'));
      categoryData.events.push(event);
    });

    // Convert to array format for display
    const categories = Array.from(categoryMap.entries()).map(([categoryName, data]) => ({
      category: categoryName,
      allocated: data.allocated,
      spent: data.allocated, // MVP: spent = allocated
      remaining: 0, // MVP: no expenses tracked yet
      events: data.events
    }));

    return {
      totalAllocated,
      totalSpent,
      remaining,
      categories,
      eventsWithBudget,
      startingBudget: STARTING_BUDGET
    };
  }, [events]);

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarDate);
    const firstDay = getFirstDayOfMonth(calendarDate);
    const days = [];
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-16 md:h-24"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
      const events = getEventsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <div key={day} className={`h-16 md:h-24 border border-gray-200 p-1 ${isToday ? 'bg-orange-50 border-orange-300' : 'bg-white'}`}>
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-orange-600' : 'text-gray-900'}`}>
            {day}
          </div>
          <div className="space-y-0.5 md:space-y-1">
            {events.slice(0, 2).map(event => (
              <div key={event.id} className={`text-xs px-1 py-0.5 rounded truncate ${getEventTypeColor('meeting')}`}>
                {event.title}
              </div>
            ))}
            {events.length > 2 && (
              <div className="text-xs text-gray-500">+{events.length - 2} more</div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-200">
          <h3 className="font-semibold text-base md:text-lg">
            {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
          </h3>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
              className="h-7 md:h-10 px-2 md:px-4"
            >
              <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
              className="h-7 md:h-10 px-2 md:px-4"
            >
              <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 md:p-3 text-center font-medium text-gray-600 border-r border-gray-200 last:border-r-0 text-xs md:text-sm">
              {day}
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Quick Stats - Desktop Layout */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Event Budget</p>
                  <p className="text-2xl font-semibold text-orange-900">
                    ${budgetData.remaining.toLocaleString()}
                  </p>
                  <p className="text-xs text-orange-600">Remaining</p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Upcoming Events</p>
                  <p className="text-2xl font-semibold text-blue-900">
                    {eventsLoading ? '...' : upcomingEvents.length}
                  </p>
                  <p className="text-xs text-blue-600">This month</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Total Attendees</p>
                  <p className="text-2xl font-semibold text-green-900">
                    {totalAttendees}
                  </p>
                  <p className="text-xs text-green-600">Expected</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Vendor Contacts</p>
                  <p className="text-2xl font-semibold text-purple-900">
                    {vendorsLoading ? '...' : vendors.length}
                  </p>
                  <p className="text-xs text-purple-600">Active</p>
                </div>
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Mobile Layout - Single Row */}
      <div className="md:hidden mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-2"
        >
          {/* Event Budget */}
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-2">
              <div className="flex flex-col items-center text-center space-y-1">
                <DollarSign className="h-5 w-5 text-orange-600" />
                <p className="text-base font-semibold text-orange-900">
                  ${budgetData.remaining.toLocaleString()}
                </p>
                <p className="text-orange-600 text-xs font-medium">Budget</p>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-2">
              <div className="flex flex-col items-center text-center space-y-1">
                <Calendar className="h-5 w-5 text-blue-600" />
                {eventsLoading ? (
                  <div className="animate-pulse bg-blue-200 h-5 w-6 rounded"></div>
                ) : (
                  <p className="text-base font-semibold text-blue-900">{upcomingEvents.length}</p>
                )}
                <p className="text-blue-600 text-xs font-medium">Events</p>
              </div>
            </CardContent>
          </Card>

          {/* Total Attendees */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-2">
              <div className="flex flex-col items-center text-center space-y-1">
                <Users className="h-5 w-5 text-green-600" />
                <p className="text-base font-semibold text-green-900">{totalAttendees}</p>
                <p className="text-green-600 text-xs font-medium">Attendees</p>
              </div>
            </CardContent>
          </Card>

          {/* Vendor Contacts */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-2">
              <div className="flex flex-col items-center text-center space-y-1">
                <BookOpen className="h-5 w-5 text-purple-600" />
                {vendorsLoading ? (
                  <div className="animate-pulse bg-purple-200 h-5 w-6 rounded"></div>
                ) : (
                  <p className="text-base font-semibold text-purple-900">{vendors.length}</p>
                )}
                <p className="text-purple-600 text-xs font-medium">Vendors</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        {/* Desktop Tab Navigation */}
        <div className="hidden md:flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { value: "overview", label: "Overview" },
            { value: "calendar", label: "Calendar" },
            { value: "contacts", label: "Contacts" },
            { value: "budget", label: "Budget" }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedTab(tab.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedTab === tab.value
                  ? "bg-white text-navy-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mobile Tab Navigation */}
        <div className="md:hidden">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-full">
            {[
              { value: "overview", label: "Overview", mobileLabel: "Overview" },
              { value: "calendar", label: "Calendar", mobileLabel: "Calendar" },
              { value: "contacts", label: "Contacts", mobileLabel: "Contacts" },
              { value: "budget", label: "Budget", mobileLabel: "Budget" }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedTab(tab.value)}
                className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  selectedTab === tab.value
                    ? "bg-white text-navy-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span className="truncate">
                  {tab.mobileLabel}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {selectedTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Budget Summary Card */}
          <Card>
            <CardHeader className="pb-2 md:pb-2">
              <CardTitle className="flex items-center text-lg md:text-xl">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Budget Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 md:pt-2">
              <div className="space-y-3 md:space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Starting Budget</span>
                  <span className="font-semibold">${budgetData.startingBudget?.toLocaleString() || '12,000'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Allocated</span>
                  <span className="font-semibold text-orange-600">${budgetData.totalAllocated.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Remaining</span>
                  <span className="font-semibold text-green-600">${budgetData.remaining.toLocaleString()}</span>
                </div>
                <Progress 
                  value={(budgetData.totalAllocated / Math.max(budgetData.startingBudget || 12000, 1)) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-gray-500 text-center">
                  {budgetData.startingBudget ? 
                    `${((budgetData.totalAllocated / budgetData.startingBudget) * 100).toFixed(1)}% of budget allocated`
                    : 'Budget tracking enabled'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 md:pb-2">
              <CardTitle className="text-lg md:text-xl">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 md:pt-2">
              {eventsLoading ? (
                <div className="text-center py-6 md:py-8">
                  <p className="text-gray-500">Loading events...</p>
                </div>
              ) : eventsError ? (
                <div className="text-center py-6 md:py-8">
                  <p className="text-red-500">Error loading events: {eventsError}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.location.reload()}
                    className="mt-2"
                  >
                    Retry
                  </Button>
                </div>
              ) : displayEvents.length === 0 ? (
                <div className="text-center py-6 md:py-8">
                  <p className="text-gray-500">No upcoming events</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowEventForm(true)}
                    className="mt-2"
                  >
                    Create First Event
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {displayEvents.slice(0, 2).map((event, index) => (
                    <div key={index} className="p-3 md:p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{event.name}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={event.status === 'published' ? 'default' : 
                                    event.status === 'draft' ? 'secondary' : 'destructive'}
                          >
                            {event.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteEvent(upcomingEvents[index].id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center mb-2">
                        <Clock className="h-3 w-3 mr-1" />
                        {event.date}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Budget: ${event.budget} • {event.attendees} attendees
                        </span>
                        <div className="flex items-center space-x-2">
                          {/* NEW: Send Reminder Button */}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSendReminder(upcomingEvents[index].id)}
                            disabled={sendingReminder === upcomingEvents[index].id}
                            className={`${
                              reminderSuccess === upcomingEvents[index].id
                                ? 'text-green-600 border-green-200 bg-green-50'
                                : sendingReminder === upcomingEvents[index].id 
                                  ? 'text-orange-600 border-orange-200 bg-orange-50' 
                                  : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200'
                            } transition-colors duration-200`}
                            title={reminderSuccess === upcomingEvents[index].id ? 'Reminders sent successfully!' : sendingReminder === upcomingEvents[index].id ? 'Sending reminders...' : 'Send reminder to members who haven\'t RSVP\'d'}
                          >
                            <Bell className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditEvent(upcomingEvents[index])}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2 md:pb-2">
              <CardTitle className="text-lg md:text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 md:pt-2 space-y-2 md:space-y-3">
              <Button 
                className="w-full justify-start bg-orange-600 hover:bg-orange-700"
                onClick={() => setShowEventForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Plan New Event
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  setSelectedTab("calendar")
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                View Full Calendar
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  setSelectedTab("contacts")
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Vendors
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  setSelectedTab("budget")
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Budget Report
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start opacity-60 cursor-not-allowed"
                disabled
              >
                <Lock className="h-4 w-4 mr-2 text-gray-400" />
                Book Feti
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === "calendar" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-3">
              <div className="w-full h-full">
                <CompactCalendarCard />
              </div>
            </div>

            {/* Event List */}
            <div className="space-y-3 md:space-y-4">
              <Card>
                <CardHeader className="pb-2 md:pb-0">
                  <CardTitle className="text-base">Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent className="pt-2 md:pt-6">
                  <div className="space-y-2 md:space-y-3">
                    {events
                      .filter(event => new Date(event.start_time) >= new Date())
                      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                      .slice(0, 5)
                      .map(event => (
                        <div key={event.id} className="p-2 md:p-3 border border-gray-200 rounded-lg">
                          <h4 className="font-medium text-sm">{event.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {formatEventDate(event.start_time)} at {formatEventTime(event.start_time)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                             {event.location || 'TBD'}
                          </p>
                          <Badge className={`mt-2 text-xs ${getEventTypeColor('meeting')}`}>
                            {event.status}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {selectedTab === "contacts" && (
        <Card>
          <CardHeader className="pb-2 md:pb-6">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg md:text-xl">Vendor Contacts</CardTitle>
              <Button 
                className="bg-orange-600 hover:bg-orange-700 text-xs md:text-sm h-8 md:h-10 px-2 md:px-4"
                onClick={() => setShowVendorForm(true)}
              >
                <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Add Vendor</span>
                <span className="sm:hidden">Vendor</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2 md:pt-6">
            {vendorsLoading ? (
              <div className="text-center py-6 md:py-8">
                <p className="text-gray-500 text-sm md:text-base">Loading vendors...</p>
              </div>
            ) : vendorsError ? (
              <div className="text-center py-6 md:py-8">
                <p className="text-red-500 text-sm md:text-base">Error loading vendors: {vendorsError}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.reload()}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            ) : vendors.length === 0 ? (
              <div className="text-center py-6 md:py-8">
                <p className="text-gray-500 text-base md:text-lg font-medium mb-2">No vendor contacts found</p>
                <p className="text-xs md:text-sm text-gray-400 mb-4">No vendors have been added to your chapter yet.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowVendorForm(true)}
                  className="mt-2"
                >
                  Add First Vendor
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Contact Person</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendors.map((vendor) => (
                        <TableRow key={vendor.id}>
                          <TableCell className="font-medium">{vendor.name}</TableCell>
                          <TableCell>{vendor.type}</TableCell>
                          <TableCell>{vendor.contact_person || '-'}</TableCell>
                          <TableCell>{vendor.phone || '-'}</TableCell>
                          <TableCell>{vendor.email || '-'}</TableCell>
                          <TableCell>
                            {vendor.rating ? (
                              <div className="flex items-center">
                                <span className="text-yellow-500">★</span>
                                <span className="ml-1">{vendor.rating}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditVendor(vendor)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDeleteVendor(vendor.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Table with Horizontal Scroll */}
                <div className="md:hidden">
                  <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Vendor Name</TableHead>
                            <TableHead className="text-xs">Type</TableHead>
                            <TableHead className="text-xs">Contact Person</TableHead>
                            <TableHead className="text-xs">Phone</TableHead>
                            <TableHead className="text-xs">Email</TableHead>
                            <TableHead className="text-xs">Rating</TableHead>
                            <TableHead className="text-xs">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vendors.map((vendor) => (
                            <TableRow key={vendor.id}>
                              <TableCell className="font-medium text-xs">{vendor.name}</TableCell>
                              <TableCell className="text-xs">{vendor.type}</TableCell>
                              <TableCell className="text-xs">{vendor.contact_person || '-'}</TableCell>
                              <TableCell className="text-xs">{vendor.phone || '-'}</TableCell>
                              <TableCell className="text-xs">{vendor.email || '-'}</TableCell>
                              <TableCell className="text-xs">
                                {vendor.rating ? (
                                  <div className="flex items-center">
                                    <span className="text-yellow-500">★</span>
                                    <span className="ml-1">{vendor.rating}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs">
                                <div className="flex space-x-1">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleEditVendor(vendor)}
                                    className="h-6 px-2"
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleDeleteVendor(vendor.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 px-2"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {selectedTab === "budget" && (
        <div className="space-y-4 md:space-y-6">
          {/* Budget Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Budget Allocated</p>
                    <p className="text-xl md:text-2xl font-semibold text-gray-900">
                      ${budgetData.totalAllocated.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Events with Budgets</p>
                    <p className="text-xl md:text-2xl font-semibold text-blue-600">
                      {budgetData.eventsWithBudget.length}
                    </p>
                  </div>
                  <Calendar className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Events</p>
                    <p className="text-xl md:text-2xl font-semibold text-gray-600">
                      {events?.length || 0}
                    </p>
                  </div>
                  <Users className="h-6 w-6 md:h-8 md:w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Budget Breakdown */}
          <Card>
            <CardHeader className="pb-2 md:pb-6">
              <CardTitle className="text-lg md:text-xl">Budget Breakdown by Category</CardTitle>
              <p className="text-sm text-gray-600">
                Budgets are calculated from events with budget amounts. Create events with budget labels to organize spending.
              </p>
            </CardHeader>
            <CardContent className="pt-2 md:pt-6">
              {budgetData.categories.length === 0 ? (
                <div className="text-center py-6 md:py-8">
                  <DollarSign className="h-8 w-8 md:h-12 md:w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No budget data available</p>
                  <p className="text-sm text-gray-400">
                    Create events with budget amounts and labels to start tracking your chapter's spending.
                  </p>
                  <Button 
                    onClick={() => setShowEventForm(true)}
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Event with Budget
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 md:space-y-6">
                  {budgetData.categories.map((category, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 md:p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">{category.category}</h4>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            ${category.allocated.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {category.events.length} event{category.events.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700">Events in this category:</h5>
                        {category.events.map((event, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                            <div className="flex-1">
                              <span className="font-medium text-gray-900">{event.title}</span>
                              <span className="text-gray-500 ml-2">• {event.status}</span>
                              {event.budget_label && (
                                <span className="text-gray-500 ml-2">• {event.budget_label}</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-green-900">
                                ${parseFloat(String(event.budget_amount || '0')).toLocaleString()}
                              </span>
                              <Badge 
                                variant={event.status === 'published' ? 'default' : 
                                        event.status === 'draft' ? 'secondary' : 'destructive'}
                                className="text-xs"
                              >
                                {event.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Events Budget Summary */}
          <Card>
            <CardHeader className="pb-2 md:pb-6">
              <CardTitle className="text-lg md:text-xl">All Events Budget Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 md:pt-6">
              <div className="space-y-2">
                {events?.map((event, index) => (
                  <div key={event.id || index} className="flex justify-between items-center p-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1">
                      <span className="font-medium">{event.title}</span>
                      <span className="text-gray-500 ml-2">• {event.status}</span>
                    </div>
                    <div className="text-right">
                      {event.budget_amount ? (
                        <span className="font-medium text-green-600">
                          ${parseFloat(String(event.budget_amount)).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">No budget</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Budget Actions */}
          <Card>
            <CardHeader className="pb-2 md:pb-6">
              <CardTitle className="text-lg md:text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 md:pt-6">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <Button 
                  onClick={() => setShowEventForm(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-xs md:text-sm h-8 md:h-10 px-2 md:px-4"
                >
                  <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Add Event with Budget</span>
                  <span className="sm:hidden">Event</span>
                </Button>
                <Button 
                  variant="outline" 
                  disabled
                  className="text-xs md:text-sm h-8 md:h-10 px-2 md:px-4"
                >
                  <DollarSign className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Track Expenses (Coming Soon)</span>
                  <span className="sm:hidden">Expense</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Event Form Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelEventForm}
              className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </Button>
            <EventForm
              event={editingEvent}
              onSubmit={handleSubmitEvent}
              onCancel={handleCancelEventForm}
              loading={isSubmitting}
            />
          </div>
        </div>
      )}

      {showVendorForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <VendorForm
            vendor={editingVendor}
            onSubmit={handleSubmitVendor}
            onCancel={handleCancelVendorForm}
            loading={isSubmittingVendor}
          />
        </div>
      )}
    </div>
  );
}