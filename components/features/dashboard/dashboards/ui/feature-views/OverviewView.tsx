'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, CheckCircle, Crown, TrendingUp, Settings, Clock, UserCheck, DollarSign, Calendar, BookOpen } from 'lucide-react';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, MessageSquare, UserPlus, Users as UsersIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OverviewViewProps {
  selectedRole: string;
}

export function OverviewView({ selectedRole }: OverviewViewProps) {
  const { profile } = useProfile();
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

  useEffect(() => {
    if (chapterId) {
      fetchOverviewData();
    }
  }, [chapterId, selectedRole]);

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
        label: 'Manage Members',
        icon: UsersIcon,
        onClick: () => router.push('/dashboard/admin?feature=members'),
      });
    }

    if (selectedRole === 'president') {
      baseActions.push({
        id: 'manage-invitations',
        label: 'Manage Invitations',
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

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  className="h-auto flex flex-col items-center justify-center p-4 space-y-2 hover:bg-gray-50"
                  onClick={action.onClick}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

