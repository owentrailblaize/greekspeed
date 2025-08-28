'use client';
import { useState } from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp, Calendar, MessageSquare, AlertCircle, CheckCircle, Clock, Crown, Send, Image, Clock as ClockIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { TasksPanel } from '@/components/dashboards/ui/TasksPanel';
import { ChapterDocumentManager } from '@/components/dashboards/ui/ChapterDocumentManager';
import { useProfile } from '@/lib/hooks/useProfile';
import { useAnnouncements } from '@/lib/hooks/useAnnouncements';
import { UpcomingEventsCard } from '@/components/dashboards/ui/UpcomingEventsCard';
import { CreateAnnouncementData } from '@/types/announcements';
import { toast } from 'react-toastify';

const chapterStats = {
  totalMembers: 156,
  activeMembers: 142,
  newPledges: 23,
  graduatingMembers: 18,
  membershipGrowth: 12.5
};

const pendingApprovals = [
  { item: "Budget Amendment - Social Events", amount: "$2,500", priority: "high" },
  { item: "New Member Initiation Ceremony", date: "March 15", priority: "medium" },
  { item: "Alumni Speaker Request", contact: "Dr. Johnson", priority: "low" }
];

export function PresidentDashboard() {
  const [announcement, setAnnouncement] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementType, setAnnouncementType] = useState<'general' | 'urgent' | 'event' | 'academic'>('general');
  const [announcementPriority, setAnnouncementPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;
  const { createAnnouncement, loading: announcementsLoading } = useAnnouncements(chapterId || null);

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
        priority: announcementPriority,
        is_scheduled: isScheduled,
        scheduled_at: isScheduled ? scheduledDate : undefined,
        metadata: {}
      };

      await createAnnouncement(announcementData);
      
      // Reset form
      setAnnouncement("");
      setAnnouncementTitle("");
      setAnnouncementType('general');
      setAnnouncementPriority('normal');
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Total Members</p>
                  <p className="text-2xl font-semibold text-purple-900">{chapterStats.totalMembers}</p>
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
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Active Members</p>
                  <p className="text-2xl font-semibold text-green-900">{chapterStats.activeMembers}</p>
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
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">New Pledges</p>
                  <p className="text-2xl font-semibold text-blue-900">{chapterStats.newPledges}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Membership Growth</p>
                  <p className="text-2xl font-semibold text-orange-900">+{chapterStats.membershipGrowth}%</p>
                </div>
                <Crown className="h-8 w-8 text-orange-600" />
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
              <div className="space-y-4">
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
                  <Select value={announcementPriority} onValueChange={(value: string) => setAnnouncementPriority(value as 'low' | 'normal' | 'high' | 'urgent')}>
                    <SelectItem value="">Select priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </Select>
                </div>
                <Textarea
                  placeholder="Write a chapter announcement..."
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  className="min-h-[100px]"
                />
                
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
                  
                  {isScheduled && (
                    <Input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-auto"
                    />
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" disabled>
                      <Image className="h-4 w-4 mr-2" />
                      Add Photo
                    </Button>
                    <Button size="sm" variant="outline" disabled>
                      <ClockIcon className="h-4 w-4 mr-2" />
                      Schedule Send
                    </Button>
                  </div>
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
            </CardContent>
          </Card>

          {/* Pending Approvals */}
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

          {/* NEW: Chapter Document Management */}
          {chapterId && (
            <ChapterDocumentManager 
              chapterId={chapterId} 
              className="w-full"
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events - Now using the existing component */}
          <UpcomingEventsCard />

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Manage Members
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Reports
              </Button>
            </CardContent>
          </Card>

          {/* Add Tasks Panel */}
          {chapterId && <TasksPanel chapterId={chapterId} />}
        </div>
      </div>
    </div>
  );
}