'use client';
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, CheckCircle, Clock, Calendar, MessageSquare, UserCheck, Settings, Lock, Eye, Edit, DollarSign, MapPin, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProfile } from "@/lib/hooks/useProfile";
import { supabase } from "@/lib/supabase/client";
import { Event } from '@/types/events';
import { EventForm } from "@/components/ui/EventForm";
import { CreateEventRequest, UpdateEventRequest } from "@/types/events";
import { logger } from "@/lib/utils/logger";

const committeeStatus = [
  { name: "Risk Management", chair: "John Smith", members: 8, completion: 92, nextMeeting: "March 10" },
  { name: "Professional Development", chair: "Mike Johnson", members: 12, completion: 78, nextMeeting: "March 12" },
  { name: "Community Service", chair: "David Wilson", members: 15, completion: 85, nextMeeting: "March 15" },
  { name: "Alumni Relations", chair: "Chris Brown", members: 10, completion: 95, nextMeeting: "March 18" }
];

export function VicePresidentDashboard() {
  const { profile } = useProfile();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [operationsOverview, setOperationsOverview] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    memberCompliance: 0
  });
  const [loading, setLoading] = useState(true);

  // Add this state for real tasks
  const [chapterTasks, setChapterTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  // Add state for events
  const [chapterEvents, setChapterEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // State for modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [editingEvent, setEditingEvent] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);

  // Load real task data from Supabase
  useEffect(() => {
    if (profile?.chapter_id) {
      loadTaskStats();
      loadChapterTasks();
      loadChapterEvents();
    }
  }, [profile?.chapter_id]);

  const loadTaskStats = async () => {
    try {
      setLoading(true);
      
      // Add null check for profile
      if (!profile?.chapter_id) {
        return;
      }
      
      // Fetch all tasks for the current chapter
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('chapter_id', profile.chapter_id);

      if (error) {
        logger.error('Error fetching tasks:', { context: [error] });
        return;
      }

      // Calculate task statistics
      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(task => task.status === 'completed').length || 0;
      const pendingTasks = tasks?.filter(task => task.status === 'pending').length || 0;
      
      // Calculate member compliance (you can adjust this logic based on your needs)
      const memberCompliance = totalTasks > 0 ? ((completedTasks / totalTasks) * 100) : 0;

      setOperationsOverview({
        totalTasks,
        completedTasks,
        pendingTasks,
        memberCompliance: Math.round(memberCompliance * 10) / 10 // Round to 1 decimal place
      });
    } catch (error) {
      logger.error('Error loading task stats:', { context: [error] });
    } finally {
      setLoading(false);
    }
  };

  // Add this function to load tasks with assignee names
  const loadChapterTasks = async () => {
    try {
      setTasksLoading(true);
      
      if (!profile?.chapter_id) {
        return;
      }
      
      // Fetch tasks with assignee information
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(full_name)
        `)
        .eq('chapter_id', profile.chapter_id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching tasks:', { context: [error] });
        return;
      }

      setChapterTasks(tasks || []);
    } catch (error) {
      logger.error('Error loading chapter tasks:', { context: [error] });
    } finally {
      setTasksLoading(false);
    }
  };

  // Add function to load events
  const loadChapterEvents = async () => {
    try {
      setEventsLoading(true);
      
      if (!profile?.chapter_id) {
        return;
      }
      
      // Fetch events for the current chapter
      const response = await fetch(`/api/events?chapter_id=${profile.chapter_id}&scope=upcoming`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const events = await response.json();
      setChapterEvents(events);
    } catch (error) {
      logger.error('Error loading chapter events:', { context: [error] });
    } finally {
      setEventsLoading(false);
    }
  };

  // Add helper function to format event dates
  const formatEventDate = (startTime: string) => {
    const now = new Date();
    const eventDate = new Date(startTime);
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today, ' + eventDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      });
    } else if (diffDays === 1) {
      return 'Tomorrow, ' + eventDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      });
    } else if (diffDays > 1 && diffDays <= 7) {
      return eventDate.toLocaleDateString('en-US', { 
        weekday: 'long',
        hour: 'numeric', 
        minute: '2-digit' 
      });
    } else {
      return eventDate.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric',
        hour: 'numeric', 
        minute: '2-digit' 
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "overdue": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleEditEvent = async (eventData: CreateEventRequest | UpdateEventRequest) => {
    if (!selectedEvent?.id) return;
    
    setEditingEvent(true);
    try {
      const response = await fetch(`/api/events/${selectedEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...eventData,
          updated_by: profile?.id || 'system',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      // Refresh events list
      await loadChapterEvents();
      setIsEditModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      logger.error('Error editing event:', { context: [error] });
    } finally {
      setEditingEvent(false);
    }
  };

  const handleCreateEvent = async (eventData: CreateEventRequest | UpdateEventRequest) => {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...eventData,
          chapter_id: profile?.chapter_id,
          created_by: profile?.id || 'system',
          updated_by: profile?.id || 'system',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      // Refresh events list
      await loadChapterEvents();
      setShowCreateEventModal(false);
    } catch (error) {
      logger.error('Error creating event:', { context: [error] });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Operations Overview - Desktop Layout */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Tasks</p>
                  <p className="text-2xl font-semibold text-blue-900">
                    {loading ? '...' : operationsOverview.totalTasks}
                  </p>
                </div>
                <Settings className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Completed</p>
                  <p className="text-2xl font-semibold text-green-900">
                    {loading ? '...' : operationsOverview.completedTasks}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">Pending</p>
                  <p className="text-2xl font-semibold text-yellow-900">
                    {loading ? '...' : operationsOverview.pendingTasks}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
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
                  <p className="text-purple-600 text-sm font-medium">Compliance</p>
                  <p className="text-2xl font-semibold text-purple-900">
                    {loading ? '...' : `${operationsOverview.memberCompliance}%`}
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-purple-600" />
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
          {/* Total Tasks */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-2">
              <div className="flex flex-col items-center text-center space-y-1">
                <Settings className="h-5 w-5 text-blue-600" />
                {loading ? (
                  <div className="animate-pulse bg-blue-200 h-5 w-6 rounded"></div>
                ) : (
                  <p className="text-base font-semibold text-blue-900">{operationsOverview.totalTasks}</p>
                )}
                <p className="text-blue-600 text-xs font-medium">Tasks</p>
              </div>
            </CardContent>
          </Card>

          {/* Completed */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-2">
              <div className="flex flex-col items-center text-center space-y-1">
                <CheckCircle className="h-5 w-5 text-green-600" />
                {loading ? (
                  <div className="animate-pulse bg-green-200 h-5 w-6 rounded"></div>
                ) : (
                  <p className="text-base font-semibold text-green-900">{operationsOverview.completedTasks}</p>
                )}
                <p className="text-green-600 text-xs font-medium">Done</p>
              </div>
            </CardContent>
          </Card>

          {/* Pending */}
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-2">
              <div className="flex flex-col items-center text-center space-y-1">
                <Clock className="h-5 w-5 text-yellow-600" />
                {loading ? (
                  <div className="animate-pulse bg-yellow-200 h-5 w-6 rounded"></div>
                ) : (
                  <p className="text-base font-semibold text-yellow-900">{operationsOverview.pendingTasks}</p>
                )}
                <p className="text-yellow-600 text-xs font-medium">Pending</p>
              </div>
            </CardContent>
          </Card>

          {/* Compliance */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-2">
              <div className="flex flex-col items-center text-center space-y-1">
                <UserCheck className="h-5 w-5 text-purple-600" />
                {loading ? (
                  <div className="animate-pulse bg-purple-200 h-5 w-6 rounded"></div>
                ) : (
                  <p className="text-base font-semibold text-purple-900">{operationsOverview.memberCompliance}%</p>
                )}
                <p className="text-purple-600 text-xs font-medium">Compliance</p>
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
            { value: "tasks", label: "Member Tasks" },
            { value: "meetings", label: "Meetings" },
            { value: "committees", label: "Committees", locked: true }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => !tab.locked && setSelectedTab(tab.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedTab === tab.value
                  ? "bg-white text-navy-600 shadow-sm"
                  : tab.locked
                  ? "opacity-60 cursor-not-allowed text-gray-400"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              disabled={tab.locked}
            >
              {tab.label}
              {tab.locked && <Lock className="h-3 w-3 ml-2 text-gray-400 inline" />}
            </button>
          ))}
        </div>

        {/* Mobile Tab Navigation */}
        <div className="md:hidden">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-full">
            {[
              { value: "overview", label: "Overview", mobileLabel: "Overview" },
              { value: "tasks", label: "Member Tasks", mobileLabel: "Tasks" },
              { value: "meetings", label: "Meetings", mobileLabel: "Meetings" },
              { value: "committees", label: "Committees", mobileLabel: "Committees", locked: true }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => !tab.locked && setSelectedTab(tab.value)}
                className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  selectedTab === tab.value
                    ? "bg-white text-navy-600 shadow-sm"
                    : tab.locked
                    ? "opacity-60 cursor-not-allowed text-gray-400"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                disabled={tab.locked}
              >
                <span className="truncate">
                  {tab.mobileLabel}
                  {tab.locked && <Lock className="h-2.5 w-2.5 ml-1 text-gray-400 inline" />}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {selectedTab === "overview" && (
        <div className="space-y-8">
          {/* Task Completion Progress - Full Width */}
          <Card>
            <CardHeader className="pb-2 md:pb-6">
              <CardTitle className="text-lg md:text-xl">Task Completion Progress</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 md:pt-6">
              <div className="space-y-3 md:space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm md:text-base">Overall Progress</span>
                  <span className="font-medium text-sm md:text-base">
                    {loading ? '...' : `${((operationsOverview.completedTasks / operationsOverview.totalTasks) * 100).toFixed(1)}%`}
                  </span>
                </div>
                <Progress 
                  value={loading ? 0 : ((operationsOverview.completedTasks / operationsOverview.totalTasks) * 100)} 
                  className="h-2 md:h-3" 
                />
                
                <div className="grid grid-cols-2 gap-3 md:gap-4 mt-4 md:mt-6">
                  <div className="text-center">
                    <p className="text-xl md:text-2xl font-semibold text-green-600">
                      {loading ? '...' : operationsOverview.completedTasks}
                    </p>
                    <p className="text-xs md:text-sm text-gray-600">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl md:text-2xl font-semibold text-yellow-600">
                      {loading ? '...' : operationsOverview.pendingTasks}
                    </p>
                    <p className="text-xs md:text-sm text-gray-600">Pending</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Committee Overview - Full Width Below (LOCKED) */}
          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Committee Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {committeeStatus.map((committee, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg opacity-60">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-sm">{committee.name}</h4>
                      <span className="text-xs text-gray-600">{committee.completion}%</span>
                    </div>
                    <Progress value={committee.completion} className="h-2 mb-2" />
                    <div className="flex justify-between items-center text-xs text-gray-600">
                      <span>Chair: {committee.chair}</span>
                      <span>{committee.members} members</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center py-4 text-gray-500">
                <Lock className="h-5 w-5 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Committee management features coming soon</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === "tasks" && (
        <Card>
          <CardHeader className="pb-2 md:pb-6">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg md:text-xl">
                <span className="md:hidden">Task Tracking</span>
                <span className="hidden md:inline">Member Task Tracking</span>
              </CardTitle>
              <Button className="bg-blue-600 hover:bg-blue-700 opacity-60 cursor-not-allowed text-xs md:text-sm h-8 md:h-10 px-2 md:px-4" disabled>
                <MessageSquare className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Send Reminders</span>
                <span className="sm:hidden">Remind</span>
                <Lock className="h-2.5 w-2.5 md:h-3 md:w-3 ml-1 md:ml-2 text-gray-400" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2 md:pt-6">
            {tasksLoading ? (
              <div className="text-center py-6 md:py-8">
                <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm md:text-base">Loading tasks...</p>
              </div>
            ) : chapterTasks.length === 0 ? (
              <div className="text-center py-6 md:py-8 text-gray-500">
                <p className="text-base md:text-lg font-medium mb-2">No tasks found</p>
                <p className="text-xs md:text-sm">No tasks have been assigned to chapter members yet.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Task</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chapterTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">
                            {task.assignee?.full_name || 'Unassigned'}
                          </TableCell>
                          <TableCell>{task.title}</TableCell>
                          <TableCell>
                            {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            }) : 'No due date'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {task.status !== "completed" && (
                              <Button size="sm" variant="outline" className="opacity-60 cursor-not-allowed" disabled>
                                Follow Up
                                <Lock className="h-3 w-3 ml-2 text-gray-400" />
                              </Button>
                            )}
                            {task.status === "completed" && (
                              <span className="text-green-600 text-sm">✓ Done</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card Layout */}
                <div className="md:hidden space-y-3">
                  {chapterTasks.map((task) => (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-900 truncate">
                            {task.title}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {task.assignee?.full_name || 'Unassigned'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-1 ml-2">
                          <Badge className={`text-xs px-2 py-1 ${getStatusColor(task.status)}`}>
                            {task.status}
                          </Badge>
                          <Badge className={`text-xs px-2 py-1 ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <div className="text-xs text-gray-600">
                          {task.due_date ? (
                            <span>Due: {new Date(task.due_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}</span>
                          ) : (
                            <span>No due date</span>
                          )}
                        </div>
                        
                        <div className="text-xs">
                          {task.status !== "completed" ? (
                            <span className="text-gray-400">Follow up locked</span>
                          ) : (
                            <span className="text-green-600">✓ Done</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {selectedTab === "meetings" && (
        <Card>
          <CardHeader className="pb-2 md:pb-6">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg md:text-xl">
                <span className="whitespace-nowrap">Upcoming Events</span>
              </CardTitle>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-xs md:text-sm h-8 md:h-10 px-2 md:px-4" 
                onClick={() => setShowCreateEventModal(true)}
              >
                <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Schedule Event</span>
                <span className="sm:hidden">Schedule</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2 md:pt-6">
            {eventsLoading ? (
              <div className="text-center py-6 md:py-8">
                <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm md:text-base">Loading events...</p>
              </div>
            ) : chapterEvents.length === 0 ? (
              <div className="text-center py-6 md:py-8 text-gray-500">
                <Calendar className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-base md:text-lg font-medium mb-2">No upcoming events</p>
                <p className="text-xs md:text-sm">No events have been scheduled for your chapter yet.</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {chapterEvents.map((event) => (
                  <div key={event.id} className="p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        {/* Desktop Layout */}
                        <div className="hidden md:block">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-lg">{event.title}</h4>
                            <Badge 
                              className={
                                event.status === 'published' ? 'bg-green-100 text-green-800' :
                                event.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                              }
                            >
                              {event.status}
                            </Badge>
                          </div>
                          
                          {event.description && (
                            <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                          )}
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div className="flex items-center min-w-0">
                              <Clock className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                              <span>{formatEventDate(event.start_time)}</span>
                            </div>
                            
                            {event.location && (
                              <div className="flex items-center min-w-0">
                                <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                                <span>{event.location}</span>
                              </div>
                            )}
                            
                            {event.budget_label && event.budget_amount && (
                              <div className="flex items-center min-w-0">
                                <DollarSign className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                                <span>{event.budget_label}: ${event.budget_amount.toLocaleString()}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center min-w-0">
                              <Users className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                              <span>
                                {event.attendee_count || 0} attending
                                {event.maybe_count ? `, ${event.maybe_count} maybe` : ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Mobile Layout */}
                        <div className="md:hidden">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-md text-gray-900 truncate flex-1 mr-2">
                              {event.title}
                            </h4>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 px-2 text-xs flex-shrink-0"
                              onClick={() => { setSelectedEvent(event); setIsEditModalOpen(true); }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </div>
                          
                          <div className="mb-2">
                            <Badge 
                              className={`text-xs px-2 py-1 ${
                                event.status === 'published' ? 'bg-green-100 text-green-800' :
                                event.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                              }`}
                            >
                              {event.status}
                            </Badge>
                          </div>
                          
                          {event.description && (
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{event.description}</p>
                          )}
                          
                          <div className="space-y-1 text-xs text-gray-600">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{formatEventDate(event.start_time)}</span>
                            </div>
                            
                            {event.location && (
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center">
                              <Users className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                              <span>
                                {event.attendee_count || 0} attending
                                {event.maybe_count ? `, ${event.maybe_count} maybe` : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Desktop Edit Button */}
                      <div className="hidden md:flex space-x-2 ml-4">
                        <Button size="sm" variant="outline" onClick={() => { setSelectedEvent(event); setIsEditModalOpen(true); }}>
                          <Edit className="h-4 w-4 mr-1" />
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
      )}

      {/* Edit Event Modal */}
      {isEditModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <EventForm
              event={selectedEvent}
              onSubmit={handleEditEvent}
              onCancel={() => setIsEditModalOpen(false)}
              loading={editingEvent}
            />
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <EventForm
              event={null}
              onSubmit={handleCreateEvent}
              onCancel={() => setShowCreateEventModal(false)}
              loading={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}