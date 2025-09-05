'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clock, Users, DollarSign, FileText, Megaphone, CheckCircle, Calendar, RefreshCw } from 'lucide-react';
import { useProfile } from '@/lib/hooks/useProfile';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ActivityItem {
  id: string;
  type: 'event' | 'announcement' | 'task' | 'document' | 'payment';
  title: string;
  meta: string;
  createdAt: string;
  icon: any;
  user?: {
    full_name: string;
    first_name: string;
    last_name: string;
  };
}

export function OperationsFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [allActivities, setAllActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const { profile } = useProfile();

  useEffect(() => {
    if (profile?.chapter_id) {
      fetchRecentActivities();
    }
  }, [profile?.chapter_id]);

  // Fetch responsive number of recent activities for the feed
  const fetchRecentActivities = async () => {
    if (!profile?.chapter_id) return;

    try {
      setLoading(true);
      // Fetch 3 on mobile, 5 on desktop
      const limit = window.innerWidth < 640 ? 3 : 5;
      const activities = await fetchActivitiesFromDatabase(limit);
      setActivities(activities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch ALL activities for the modal
  const fetchAllActivities = async () => {
    if (!profile?.chapter_id) return;

    try {
      setModalLoading(true);
      const activities = await fetchActivitiesFromDatabase(50); // Get more for modal
      setAllActivities(activities);
    } catch (error) {
      console.error('Error fetching all activities:', error);
    } finally {
      setModalLoading(false);
    }
  };

  // Core function to fetch activities from database
  const fetchActivitiesFromDatabase = async (limit: number): Promise<ActivityItem[]> => {
    if (!profile?.chapter_id) return [];

    const [eventsResult, announcementsResult, tasksResult, documentsResult, duesResult] = await Promise.all([
      // Recent Events
      supabase
        .from('events')
        .select('id, title, created_at, created_by')
        .eq('chapter_id', profile.chapter_id)
        .order('created_at', { ascending: false })
        .limit(limit),

      // Recent Announcements  
      supabase
        .from('announcements')
        .select(`
          id, title, created_at, sender_id,
          sender:profiles!sender_id(full_name, first_name, last_name)
        `)
        .eq('chapter_id', profile.chapter_id)
        .order('created_at', { ascending: false })
        .limit(limit),

      // Recent Tasks
      supabase
        .from('tasks')
        .select(`
          id, title, status, created_at, assigned_by,
          assigner:profiles!assigned_by(full_name, first_name, last_name)
        `)
        .eq('chapter_id', profile.chapter_id)
        .order('created_at', { ascending: false })
        .limit(limit),

      // Recent Documents
      supabase
        .from('documents')
        .select(`
          id, title, created_at, owner_id,
          owner:profiles!owner_id(full_name, first_name, last_name)
        `)
        .eq('chapter_id', profile.chapter_id)
        .order('created_at', { ascending: false })
        .limit(limit),

      // Recent Dues Payments
      supabase
        .from('dues_assignments')
        .select(`
          id, status, amount_paid, updated_at, user_id,
          user:profiles!user_id(full_name, first_name, last_name),
          cycle:dues_cycles(name)
        `)
        .eq('cycle.chapter_id', profile.chapter_id)
        .eq('status', 'paid')
        .order('updated_at', { ascending: false })
        .limit(limit)
    ]);

    // Transform data into unified activity format
    const allActivities: ActivityItem[] = [];

    // Process Events
    if (eventsResult.data) {
      eventsResult.data.forEach(event => {
        allActivities.push({
          id: `event-${event.id}`,
          type: 'event',
          title: 'New Event Created',
          meta: event.title,
          createdAt: event.created_at,
          icon: Calendar
        });
      });
    }

    // Process Announcements
    if (announcementsResult.data) {
      announcementsResult.data.forEach(announcement => {
        allActivities.push({
          id: `announcement-${announcement.id}`,
          type: 'announcement',
          title: 'Announcement Sent',
          meta: announcement.title,
          createdAt: announcement.created_at,
          icon: Megaphone,
          user: Array.isArray(announcement.sender) ? announcement.sender[0] : announcement.sender
        });
      });
    }

    // Process Tasks
    if (tasksResult.data) {
      tasksResult.data.forEach(task => {
        allActivities.push({
          id: `task-${task.id}`,
          type: 'task',
          title: `Task ${task.status === 'completed' ? 'Completed' : 'Created'}`,
          meta: task.title,
          createdAt: task.created_at,
          icon: CheckCircle,
          user: Array.isArray(task.assigner) ? task.assigner[0] : task.assigner
        });
      });
    }

    // Process Documents
    if (documentsResult.data) {
      documentsResult.data.forEach(doc => {
        allActivities.push({
          id: `document-${doc.id}`,
          type: 'document',
          title: 'Document Uploaded',
          meta: doc.title,
          createdAt: doc.created_at,
          icon: FileText,
          user: Array.isArray(doc.owner) ? doc.owner[0] : doc.owner
        });
      });
    }

    // Process Dues Payments
    if (duesResult.data) {
      duesResult.data.forEach(dues => {
        const user = Array.isArray(dues.user) ? dues.user[0] : dues.user;
        allActivities.push({
          id: `dues-${dues.id}`,
          type: 'payment',
          title: 'Dues Payment Received',
          meta: `${user?.full_name || 'Member'} paid $${dues.amount_paid}`,
          createdAt: dues.updated_at,
          icon: DollarSign,
          user: user
        });
      });
    }

    // Sort by creation date and return ONLY the requested limit
    return allActivities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'event': return 'bg-blue-100 text-blue-800';
      case 'payment': return 'bg-green-100 text-green-800';
      case 'task': return 'bg-purple-100 text-purple-800';
      case 'document': return 'bg-orange-100 text-orange-800';
      case 'announcement': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'event': return 'Event';
      case 'payment': return 'Payment';
      case 'task': return 'Task';
      case 'document': return 'Document';
      case 'announcement': return 'Announcement';
      default: return 'Other';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const renderActivityItem = (item: ActivityItem) => {
    const IconComponent = item.icon;
    return (
      <div key={item.id} className="flex items-start space-x-3 p-2 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
        <div className="w-6 h-6 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 shrink-0">
          <IconComponent className="h-3 w-3" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-medium text-gray-900 text-sm whitespace-nowrap">{item.title}</h4>
            <IconComponent className="h-3 w-3 text-gray-500" />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600 flex-1 truncate mr-2">{item.meta}</p>
            <div className="flex items-center space-x-2 text-xs text-gray-500 shrink-0">
              <span>{formatTimeAgo(item.createdAt)}</span>
              {item.user && (
                <span>by {item.user.full_name || `${item.user.first_name} ${item.user.last_name}`}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Clock className="h-5 w-5 text-navy-600" />
            <span>Operations Feed</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Clock className="h-5 w-5 text-navy-600" />
          <span>Operations Feed</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Main Feed - Shows 5 most recent activities */}
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No recent activity</p>
            </div>
          ) : (
            activities.map(renderActivityItem)
          )}
        </div>
        
        <div className="pt-4 border-t border-gray-100">
          {/* Refresh and View All buttons on same row */}
          <div className="flex space-x-2">
            {/* Refresh Button - Square with icon only */}
            <button 
              className="w-8 h-8 border border-navy-600 rounded-md flex items-center justify-center text-navy-600 hover:bg-navy-50 hover:text-navy-700 transition-colors"
              onClick={fetchRecentActivities}
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            {/* View All Activities Modal Button - Takes remaining space */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 text-navy-600 border-navy-600 hover:bg-navy-50"
                  onClick={() => {
                    setModalOpen(true);
                    fetchAllActivities();
                  }}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden bg-white">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-navy-600" />
                    <span>All Chapter Activity</span>
                  </DialogTitle>
                </DialogHeader>
                
                <div className="overflow-y-auto max-h-[60vh]">
                  {modalLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-16 bg-gray-200 rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {allActivities.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>No activity found</p>
                        </div>
                      ) : (
                        allActivities.map(renderActivityItem)
                      )}
                    </div>
                  )}
                </div>

                {/* Footer with activity count */}
                <div className="border-t border-gray-200 pt-3 mt-4">
                  <p className="text-center text-sm text-gray-500">
                    Showing {allActivities.length} of {allActivities.length} activities
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 