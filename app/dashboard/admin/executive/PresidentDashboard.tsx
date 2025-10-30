'use client';
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp, Calendar, MessageSquare, AlertCircle, CheckCircle, Clock, Crown, Send, Image, Clock as ClockIcon, Lock, X, UserPlus, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { TasksPanel } from '@/components/features/dashboard/dashboards/ui/TasksPanel';
import { ChapterDocumentManager } from '@/components/features/dashboard/dashboards/ui/ChapterDocumentManager';
import { InviteManagement } from '@/components/features/invitations/InviteManagement';
import { useProfile } from '@/lib/hooks/useProfile';
import { useAnnouncements } from '@/lib/hooks/useAnnouncements';
import { UpcomingEventsCard } from '@/components/features/dashboard/dashboards/ui/UpcomingEventsCard';
import { CreateAnnouncementData } from '@/types/announcements';
import { EventForm } from '@/components/ui/EventForm';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

export function PresidentDashboard() {
  const [announcement, setAnnouncement] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementType, setAnnouncementType] = useState<'general' | 'urgent' | 'event' | 'academic'>('general');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New state for event modal
  const [showEventModal, setShowEventModal] = useState(false);
  
  // Add state for member count
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [loadingMemberCount, setLoadingMemberCount] = useState(false);
  
  // Add state for active member count
  const [activeMemberCount, setActiveMemberCount] = useState<number | null>(null);
  const [loadingActiveMemberCount, setLoadingActiveMemberCount] = useState(false);
  
  // Add state for membership growth
  const [membershipGrowth, setMembershipGrowth] = useState<number>(0);
  const [loadingGrowth, setLoadingGrowth] = useState(false);
  
  // Add state for alumni count
  const [alumniCount, setAlumniCount] = useState<number | null>(null);
  const [loadingAlumniCount, setLoadingAlumniCount] = useState(false);

  // Add SMS-related state variables
  const [sendSMS, setSendSMS] = useState(false);

  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;
  const { createAnnouncement, loading: announcementsLoading } = useAnnouncements(chapterId || null);
  const router = useRouter();

  // Simple function to fetch just the member count
  const fetchMemberCount = async () => {
    if (!chapterId) return;
    
    try {
      setLoadingMemberCount(true);
      const response = await fetch(`/api/chapter/member-count?chapter_id=${chapterId}`);
      
      if (response.ok) {
        const data = await response.json();
        setMemberCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching member count:', error);
    } finally {
      setLoadingMemberCount(false);
    }
  };

  // Function to fetch active member count
  const fetchActiveMemberCount = async () => {
    if (!chapterId) return;
    
    try {
      setLoadingActiveMemberCount(true);
      const response = await fetch(`/api/chapter/active-member-count?chapter_id=${chapterId}`);
      
      if (response.ok) {
        const data = await response.json();
        setActiveMemberCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching active member count:', error);
    } finally {
      setLoadingActiveMemberCount(false);
    }
  };

  // Add useEffect for membership growth
  useEffect(() => {
    const fetchMembershipGrowth = async () => {
      if (!chapterId) return;
      
      setLoadingGrowth(true);
      try {
        const response = await fetch(`/api/chapter/membership-growth?chapter_id=${chapterId}`);
        if (response.ok) {
          const data = await response.json();
          setMembershipGrowth(data.growth);
        }
      } catch (error) {
        console.error('Error fetching membership growth:', error);
      } finally {
        setLoadingGrowth(false);
      }
    };

    fetchMembershipGrowth();
  }, [chapterId]);

  // Add useEffect for alumni count
  useEffect(() => {
    const fetchAlumniCount = async () => {
      if (!chapterId) return;
      
      setLoadingAlumniCount(true);
      try {
        const response = await fetch(`/api/chapter/alumni-count?chapter_id=${chapterId}`);
        if (response.ok) {
          const data = await response.json();
          setAlumniCount(data.count);
        }
      } catch (error) {
        console.error('Error fetching alumni count:', error);
      } finally {
        setLoadingAlumniCount(false);
      }
    };

    fetchAlumniCount();
  }, [chapterId]);

  // Fetch both counts when component mounts
  useEffect(() => {
    if (chapterId) {
      fetchMemberCount();
      fetchActiveMemberCount();
    }
  }, [chapterId]);

  // Calculate stats with real data
  const chapterStats = {
    totalMembers: memberCount || 0,
    activeMembers: activeMemberCount || 0,
    newPledges: 23, // Keep existing for now
    graduatingMembers: 18, // Keep existing for now
    membershipGrowth: 12.5 // Keep existing for now
  };

  const pendingApprovals = [
    { item: "Budget Amendment - Social Events", amount: "$2,500", priority: "high" },
    { item: "New Member Initiation Ceremony", date: "March 15", priority: "medium" },
    { item: "Alumni Speaker Request", contact: "Dr. Johnson", priority: "low" }
  ];

  const handleSendAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcement.trim()) {
      toast.error('Please fill in both title and content');
      return;
    }

    if (isScheduled && !scheduledDate) {
      toast.error('Please select a scheduled date');
      return;
    }

    setIsSubmitting(true);
    try {
      const announcementData: CreateAnnouncementData = {
        title: announcementTitle.trim(),
        content: announcement.trim(),
        announcement_type: announcementType,
        is_scheduled: isScheduled,
        scheduled_at: isScheduled ? scheduledDate : undefined,
        metadata: {}
      };

      await createAnnouncement(announcementData);
      
      // Reset form
      setAnnouncement("");
      setAnnouncementTitle("");
      setAnnouncementType('general');
      setIsScheduled(false);
      setScheduledDate("");
      
      toast.success('Announcement sent successfully!');
    } catch (error) {
      toast.error('Failed to send announcement');
      console.error('Error sending announcement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // New function for send message navigation
  const handleSendMessage = () => {
    router.push('/dashboard/messages');
  };

  // New function for schedule meeting
  const handleScheduleMeeting = () => {
    setShowEventModal(true);
  };

  // New function for creating events
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

      toast.success('Meeting scheduled successfully!');
      setShowEventModal(false);
    } catch (error) {
      toast.error('Failed to schedule meeting');
      console.error('Error creating event:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-0 sm:py-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Desktop Layout - Preserved */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="hidden md:block"
        >
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Total Members</p>
                  {loadingMemberCount ? (
                    <div className="animate-pulse bg-purple-200 h-8 w-16 rounded"></div>
                  ) : (
                    <p className="text-2xl font-semibold text-purple-900">{chapterStats.totalMembers}</p>
                  )}
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="hidden md:block"
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Active Members</p>
                  {loadingActiveMemberCount ? (
                    <div className="animate-pulse bg-green-200 h-8 w-16 rounded"></div>
                  ) : (
                    <p className="text-2xl font-semibold text-green-900">{chapterStats.activeMembers}</p>
                  )}
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
          className="hidden md:block"
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Alumni</p>
                  {loadingAlumniCount ? (
                    <p className="text-2xl font-semibold text-blue-900">...</p>
                  ) : (
                    <p className="text-2xl font-semibold text-blue-900">{alumniCount || 0}</p>
                  )}
                </div>
                <Crown className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="hidden md:block"
        >
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Membership Growth</p>
                  {loadingGrowth ? (
                    <p className="text-2xl font-semibold text-orange-900">...</p>
                  ) : (
                    <p className="text-2xl font-semibold text-orange-900">
                      {membershipGrowth >= 0 ? '+' : ''}{membershipGrowth}%
                    </p>
                  )}
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
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
          {/* Total Members */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-2">
              <div className="flex flex-col items-center text-center space-y-1">
                <Users className="h-5 w-5 text-purple-600" />
                {loadingMemberCount ? (
                  <div className="animate-pulse bg-purple-200 h-5 w-6 rounded"></div>
                ) : (
                  <p className="text-base font-semibold text-purple-900">{chapterStats.totalMembers}</p>
                )}
                <p className="text-purple-600 text-xs font-medium">Members</p>
              </div>
            </CardContent>
          </Card>

          {/* Active Members */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-2">
              <div className="flex flex-col items-center text-center space-y-1">
                <CheckCircle className="h-5 w-5 text-green-600" />
                {loadingActiveMemberCount ? (
                  <div className="animate-pulse bg-green-200 h-5 w-6 rounded"></div>
                ) : (
                  <p className="text-base font-semibold text-green-900">{chapterStats.activeMembers}</p>
                )}
                <p className="text-green-600 text-xs font-medium">Active</p>
              </div>
            </CardContent>
          </Card>

          {/* Alumni */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-2">
              <div className="flex flex-col items-center text-center space-y-1">
                <Crown className="h-5 w-5 text-blue-600" />
                {loadingAlumniCount ? (
                  <p className="text-base font-semibold text-blue-900">...</p>
                ) : (
                  <p className="text-base font-semibold text-blue-900">{alumniCount || 0}</p>
                )}
                <p className="text-blue-600 text-xs font-medium">Alumni</p>
              </div>
            </CardContent>
          </Card>

          {/* Membership Growth */}
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-2">
              <div className="flex flex-col items-center text-center space-y-1">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                {loadingGrowth ? (
                  <p className="text-base font-semibold text-orange-900">...</p>
                ) : (
                  <p className="text-base font-semibold text-orange-900">
                    {membershipGrowth >= 0 ? '+' : ''}{membershipGrowth}%
                  </p>
                )}
                <p className="text-orange-600 text-xs font-medium">Growth</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chapter Announcements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                <span>Chapter Announcements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Desktop Layout - Preserved */}
              <div className="hidden md:block space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Announcement title..."
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    className="md:col-span-2"
                  />
                  <Select value={announcementType} onValueChange={(value: string) => setAnnouncementType(value as 'general' | 'urgent' | 'event' | 'academic')}>
                    <SelectItem value="">Select type</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                  </Select>
                </div>
                <Textarea
                  placeholder="Write a chapter announcement..."
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  className="min-h-[100px]"
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isScheduled}
                        onChange={(e) => setIsScheduled(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Schedule for later</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={false} // Always false
                        onChange={() => {}} // No-op function
                        className="rounded"
                        disabled={true} // Disable the checkbox
                      />
                      <span className="text-sm text-gray-400">Send SMS notification</span>
                      <span className="text-xs text-gray-400">(Coming Soon)</span>
                    </label>
                    
                    {isScheduled && (
                      <Input
                        type="datetime-local"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-auto"
                      />
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={handleSendAnnouncement}
                      disabled={isSubmitting || announcementsLoading}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSubmitting ? 'Sending...' : 'Send Announcement'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="md:hidden space-y-4">
                <div className="space-y-3">
                  <Input
                    placeholder="Announcement title..."
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    className="w-full"
                  />
                  <Select value={announcementType} onValueChange={(value: string) => setAnnouncementType(value as 'general' | 'urgent' | 'event' | 'academic')}>
                    <SelectItem value="">Select type</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                  </Select>
                </div>
                
                <Textarea
                  placeholder="Write a chapter announcement..."
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  className="min-h-[80px] w-full"
                />
                
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Schedule for later</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={false} // Always false
                      onChange={() => {}} // No-op function
                      className="rounded"
                      disabled={true} // Disable the checkbox
                    />
                    <span className="text-sm text-gray-400">Send SMS notification</span>
                    <span className="text-xs text-gray-400">(Coming Soon)</span>
                  </label>
                  
                  {isScheduled && (
                    <Input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full"
                    />
                  )}
                </div>
                
                <div className="flex flex-col space-y-2 pt-2">
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700 w-full"
                    onClick={handleSendAnnouncement}
                    disabled={isSubmitting || announcementsLoading}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Sending...' : 'Send Announcement'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Pending Approvals */}
          {/*
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span>Pending Approvals</span>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  {pendingApprovals.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApprovals.map((approval, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{approval.item}</h4>
                      <p className="text-sm text-gray-600">
                        {approval.amount && `Amount: ${approval.amount}`}
                        {approval.date && `Date: ${approval.date}`}
                        {approval.contact && `Contact: ${approval.contact}`}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant={approval.priority === 'high' ? 'destructive' : 
                                approval.priority === 'medium' ? 'default' : 'secondary'}
                      >
                        {approval.priority}
                      </Badge>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">Deny</Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">Approve</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          */}

          {/* NEW: Chapter Document Management */}
          {chapterId && (
            <ChapterDocumentManager 
              chapterId={chapterId} 
              className="w-full"
            />
          )}

          {/* NEW: Invitation Management */}
          {chapterId && (
            <div id="invitations">
              <InviteManagement 
                chapterId={chapterId} 
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events - Now using the existing component */}
          <UpcomingEventsCard />

          {/* Quick Actions */}
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
                Schedule Meeting
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
                className="w-full justify-start"
                onClick={() => window.location.href = '#invitations'}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Manage Invitations
              </Button>
              
              {/* Manage Members - navigate to admin members page */}
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/admin/members')}
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Members
              </Button>
            </CardContent>
          </Card>

          {/* Add Tasks Panel */}
          {chapterId && <TasksPanel chapterId={chapterId} />}
        </div>
      </div>

      {/* Event Creation Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Schedule Chapter Meeting</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEventModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <EventForm
                event={null}
                onSubmit={handleCreateEvent}
                onCancel={() => setShowEventModal(false)}
                loading={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}