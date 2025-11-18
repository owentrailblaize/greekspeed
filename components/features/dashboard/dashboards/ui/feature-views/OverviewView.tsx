'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle, Crown, TrendingUp, Settings, Clock, UserCheck, DollarSign, Calendar, BookOpen } from 'lucide-react';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, MessageSquare, UserPlus, Users as UsersIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Megaphone, Send, Mail, Smartphone } from 'lucide-react';
import { useAnnouncements } from '@/lib/hooks/useAnnouncements';
import { CreateAnnouncementData } from '@/types/announcements';
import { toast } from 'react-toastify';
import { useAuth } from '@/lib/supabase/auth-context';

interface OverviewViewProps {
  selectedRole: string;
}

export function OverviewView({ selectedRole }: OverviewViewProps) {
  const { profile } = useProfile();
  const { session } = useAuth();
  const chapterId = profile?.chapter_id;
  const router = useRouter();
  
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [activeMemberCount, setActiveMemberCount] = useState<number | null>(null);
  const [alumniCount, setAlumniCount] = useState<number | null>(null);
  const [membershipGrowth, setMembershipGrowth] = useState<number>(0);
  const [totalTasks, setTotalTasks] = useState<number>(0);
  const [completedTasks, setCompletedTasks] = useState<number>(0);
  const [pendingTasks, setPendingTasks] = useState<number>(0);
  const [compliance, setCompliance] = useState<number>(0);
  const [eventBudget, setEventBudget] = useState<number>(0);
  const [upcomingEvents, setUpcomingEvents] = useState<number>(0);
  const [totalAttendees, setTotalAttendees] = useState<number>(0);
  const [vendorCount, setVendorCount] = useState<number>(0);

  // Announcement form state
  const { createAnnouncement, loading: announcementsLoading } = useAnnouncements(chapterId || null);
  const [announcement, setAnnouncement] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementType, setAnnouncementType] = useState<'general' | 'urgent' | 'event' | 'academic'>('general');
  const [sendSMS, setSendSMS] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailRecipientCount, setEmailRecipientCount] = useState<number | null>(null);
  const [smsRecipientCount, setSmsRecipientCount] = useState<number | null>(null);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  useEffect(() => {
    if (chapterId) {
      fetchOverviewData();
    }
  }, [chapterId, selectedRole]);

  useEffect(() => {
    setSendSMS(announcementType === 'urgent');
  }, [announcementType]);

  useEffect(() => {
    const fetchRecipientCounts = async () => {
      if (!chapterId || !session?.access_token) return;
      
      setLoadingRecipients(true);
      try {
        const response = await fetch(
          `/api/announcements/recipient-counts?chapter_id=${chapterId}`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setEmailRecipientCount(data.email_recipients);
          setSmsRecipientCount(data.sms_recipients);
        }
      } catch (error) {
        console.error('Error fetching recipient counts:', error);
      } finally {
        setLoadingRecipients(false);
      }
    };

    fetchRecipientCounts();
  }, [chapterId, session?.access_token]);

  const handleSendAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcement.trim()) {
      toast.error('Please fill in both title and content');
      return;
    }

    setIsSubmitting(true);
    try {
      const announcementData: CreateAnnouncementData = {
        title: announcementTitle.trim(),
        content: announcement.trim(),
        announcement_type: announcementType,
        send_sms: sendSMS,
        metadata: {}
      };

      await createAnnouncement(announcementData);
      
      // Reset form
      setAnnouncement("");
      setAnnouncementTitle("");
      setAnnouncementType('general');
      setSendSMS(false);
      
      toast.success('Announcement sent successfully!');
    } catch (error) {
      toast.error('Failed to send announcement');
      console.error('Error sending announcement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchOverviewData = async () => {
    // Fetch member stats
    try {
      const memberResponse = await fetch(`/api/chapter/member-count?chapter_id=${chapterId}`);
      if (memberResponse.ok) {
        const data = await memberResponse.json();
        setMemberCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching member count:', error);
    }

    try {
      const activeResponse = await fetch(`/api/chapter/active-member-count?chapter_id=${chapterId}`);
      if (activeResponse.ok) {
        const data = await activeResponse.json();
        setActiveMemberCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching active member count:', error);
    }

    try {
      const alumniResponse = await fetch(`/api/chapter/alumni-count?chapter_id=${chapterId}`);
      if (alumniResponse.ok) {
        const data = await alumniResponse.json();
        setAlumniCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching alumni count:', error);
    }

    try {
      const growthResponse = await fetch(`/api/chapter/membership-growth?chapter_id=${chapterId}`);
      if (growthResponse.ok) {
        const data = await growthResponse.json();
        setMembershipGrowth(data.growth);
      }
    } catch (error) {
      console.error('Error fetching membership growth:', error);
    }

    // Fetch task stats for VP
    if (selectedRole === 'vice-president') {
      try {
        const response = await fetch(`/api/tasks?chapter_id=${chapterId}`);
        if (response.ok) {
          const tasks = await response.json();
          const total = tasks.length || 0;
          const completed = tasks.filter((t: any) => t.status === 'completed').length || 0;
          const pending = tasks.filter((t: any) => t.status === 'pending').length || 0;
          setTotalTasks(total);
          setCompletedTasks(completed);
          setPendingTasks(pending);
          setCompliance(total > 0 ? Math.round((completed / total) * 100 * 10) / 10 : 0);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    }

    // Fetch event/budget stats for Social Chair
    if (selectedRole === 'social-chair') {
      try {
        const response = await fetch(`/api/events?chapter_id=${chapterId}&scope=all`);
        if (response.ok) {
          const events = await response.json();
          const upcoming = events.filter((e: any) => new Date(e.start_time) >= new Date() && e.status === 'published');
          setUpcomingEvents(upcoming.length);
          
          const eventsWithBudget = events.filter((e: any) => e.budget_amount && parseFloat(String(e.budget_amount)) > 0);
          const totalAllocated = eventsWithBudget.reduce((sum: number, e: any) => sum + parseFloat(String(e.budget_amount || '0')), 0);
          const remaining = 12000 - totalAllocated; // Starting budget
          setEventBudget(remaining);
          
          const attendees = upcoming.reduce((sum: number, e: any) => sum + (e.attendee_count || 0), 0);
          setTotalAttendees(attendees);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      }

      try {
        const response = await fetch(`/api/vendors?chapter_id=${chapterId}`);
        if (response.ok) {
          const vendors = await response.json();
          setVendorCount(vendors.length || 0);
        }
      } catch (error) {
        console.error('Error fetching vendors:', error);
      }
    }
  };

  const getStatsCards = () => {
    switch (selectedRole) {
      case 'president':
        return [
          { label: 'Total Members', value: memberCount ?? 0, icon: Users, color: 'from-purple-50 to-purple-100', borderColor: 'border-purple-200', textColor: 'text-purple-600' },
          { label: 'Active Members', value: activeMemberCount ?? 0, icon: CheckCircle, color: 'from-green-50 to-green-100', borderColor: 'border-green-200', textColor: 'text-green-600' },
          { label: 'Alumni', value: alumniCount ?? 0, icon: Crown, color: 'from-blue-50 to-blue-100', borderColor: 'border-blue-200', textColor: 'text-blue-600' },
          { label: 'Membership Growth', value: `${membershipGrowth >= 0 ? '+' : ''}${membershipGrowth}%`, icon: TrendingUp, color: 'from-orange-50 to-orange-100', borderColor: 'border-orange-200', textColor: 'text-orange-600' },
        ];
      
      case 'vice-president':
        return [
          { label: 'Total Tasks', value: totalTasks, icon: Settings, color: 'from-blue-50 to-blue-100', borderColor: 'border-blue-200', textColor: 'text-blue-600' },
          { label: 'Completed', value: completedTasks, icon: CheckCircle, color: 'from-green-50 to-green-100', borderColor: 'border-green-200', textColor: 'text-green-600' },
          { label: 'Pending', value: pendingTasks, icon: Clock, color: 'from-yellow-50 to-yellow-100', borderColor: 'border-yellow-200', textColor: 'text-yellow-600' },
          { label: 'Compliance', value: `${compliance}%`, icon: UserCheck, color: 'from-purple-50 to-purple-100', borderColor: 'border-purple-200', textColor: 'text-purple-600' },
        ];
      
      case 'social-chair':
        return [
          { label: 'Event Budget', value: `$${eventBudget.toLocaleString()}`, icon: DollarSign, color: 'from-orange-50 to-orange-100', borderColor: 'border-orange-200', textColor: 'text-orange-600' },
          { label: 'Upcoming Events', value: upcomingEvents, icon: Calendar, color: 'from-blue-50 to-blue-100', borderColor: 'border-blue-200', textColor: 'text-blue-600' },
          { label: 'Total Attendees', value: totalAttendees, icon: Users, color: 'from-green-50 to-green-100', borderColor: 'border-green-200', textColor: 'text-green-600' },
          { label: 'Vendor Contacts', value: vendorCount, icon: BookOpen, color: 'from-purple-50 to-purple-100', borderColor: 'border-purple-200', textColor: 'text-purple-600' },
        ];
      
      case 'treasurer':
        return [
          { label: 'Total Members', value: memberCount ?? 0, icon: Users, color: 'from-green-50 to-green-100', borderColor: 'border-green-200', textColor: 'text-green-600' },
          { label: 'Active Members', value: activeMemberCount ?? 0, icon: CheckCircle, color: 'from-blue-50 to-blue-100', borderColor: 'border-blue-200', textColor: 'text-blue-600' },
        ];
      
      default:
        return [];
    }
  };

  const getQuickActions = () => {
    const baseActions = [
      {
        id: 'create-event',
        label: 'Create Event',
        icon: CalendarIcon,
        onClick: () => router.push('/dashboard/admin?feature=events'),
      },
      {
        id: 'send-message',
        label: 'Send Message',
        icon: MessageSquare,
        onClick: () => router.push('/dashboard/messages'),
      },
    ];

    if (selectedRole === 'president' || selectedRole === 'vice-president') {
      baseActions.push({
        id: 'manage-members',
        label: 'Members',
        icon: UsersIcon,
        onClick: () => router.push('/dashboard/admin?feature=members'),
      });
    }

    if (selectedRole === 'president') {
      baseActions.push({
        id: 'manage-invitations',
        label: 'Invitations',
        icon: UserPlus,
        onClick: () => router.push('/dashboard/admin?feature=invitations'),
      });
    }

    return baseActions;
  };

  const statsCards = getStatsCards();
  const quickActions = getQuickActions();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className={`bg-gradient-to-br ${stat.color} ${stat.borderColor} border`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`${stat.textColor} text-sm font-medium mb-1`}>{stat.label}</p>
                    <p className={`text-2xl font-semibold ${stat.textColor.replace('600', '900')}`}>
                      {stat.value}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.textColor}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Announcements and Quick Actions - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-h-[500px]">
        {/* Announcements Card - Left side, 3/4 width */}
        <Card className="w-full lg:col-span-3 flex flex-col max-h-[500px]">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="flex items-center space-x-2">
              <Megaphone className="h-5 w-5 text-purple-600" />
              <span>Chapter Announcements</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="Announcement title..."
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                className="md:col-span-2"
              />
              <Select 
                value={announcementType} 
                onValueChange={(value: string) => setAnnouncementType(value as 'general' | 'urgent' | 'event' | 'academic')}
              >
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
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex flex-col space-y-2 flex-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="send-sms-notification"
                    checked={sendSMS}
                    onCheckedChange={(checked) => setSendSMS(checked as boolean)}
                  />
                  <Label htmlFor="send-sms-notification" className="text-sm cursor-pointer">
                    Send SMS notification
                  </Label>
                </div>
                
                <div className="text-xs text-gray-600 space-y-1 pl-6">
                  {emailRecipientCount !== null && (
                    <p className="flex items-center gap-1 whitespace-nowrap">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span>Email will be sent to <span className="font-medium">{emailRecipientCount}</span> Members</span>
                    </p>
                  )}
                  {sendSMS && smsRecipientCount !== null && (
                    <p className="flex items-center gap-1 whitespace-nowrap">
                      <Smartphone className="h-3 w-3 flex-shrink-0" />
                      <span>SMS will be sent to <span className="font-medium">{smsRecipientCount}</span> Members</span>
                    </p>
                  )}
                  {loadingRecipients && (
                    <p className="text-gray-400 whitespace-nowrap">Loading recipient counts...</p>
                  )}
                </div>
              </div>
              
              <Button 
                className="bg-purple-600 hover:bg-purple-700 w-full md:w-auto"
                onClick={handleSendAnnouncement}
                disabled={isSubmitting || announcementsLoading}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Sending...' : 'Send Announcement'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - Right side, 1/4 width */}
        <Card className="w-full lg:col-span-1 flex flex-col max-h-[500px]">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex-1 overflow-y-auto">
            <div className="space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.id}
                    variant="outline"
                    className="w-full justify-start text-sm whitespace-nowrap"
                    onClick={action.onClick}
                  >
                    <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{action.label}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

