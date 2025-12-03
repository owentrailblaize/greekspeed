'use client';

import { useMemo, useState, useEffect } from 'react';
import { QuickActions, QuickAction } from './ui/QuickActions';
import { DuesSnapshot } from './ui/DuesSnapshot';
import { ComplianceSnapshot } from './ui/ComplianceSnapshot';
import { OperationsFeed } from './ui/OperationsFeed';
import { EventsPanel } from './ui/EventsPanel';
import { TasksPanel } from './ui/TasksPanel';
import { DocsCompliancePanel } from './ui/DocsCompliancePanel';
import { AlertsStrip } from './ui/AlertsStrip';
import { CompactCalendarCard } from './ui/CompactCalendarCard';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { SocialFeed, type SocialFeedInitialData } from './ui/SocialFeed';
import { DuesStatusCard } from './ui/DuesStatusCard';
import { MobileBottomNavigation } from './ui/MobileBottomNavigation'; // Changed import
import { MobileAdminTasksPage } from './ui/MobileAdminTasksPage';
import { MobileDocsCompliancePage } from './ui/MobileDocsCompliancePage';
import { MobileOperationsFeedPage } from './ui/MobileOperationsFeedPage';
import { MobileCalendarPage } from './ui/MobileCalendarPage';
import { MobileOperationsPage } from './ui/MobileOperationsPage';
import { MobileEventsVendorsPage } from './ui/MobileEventsVendorsPage';
import { Calendar, Users, MessageSquare, UserPlus, Home, Wrench, CheckSquare, FileText, Activity, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EventForm } from '@/components/ui/EventForm';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { createPortal } from 'react-dom';
import { SendAnnouncementButton } from './ui/SendAnnouncementButton';
import { EXECUTIVE_ROLES } from '@/lib/permissions';
import { UpcomingEventsCard } from './ui/UpcomingEventsCard';
import { cn } from '@/lib/utils';

interface AdminOverviewProps {
  initialFeed?: SocialFeedInitialData;
  fallbackChapterId?: string | null;
}

export function AdminOverview({ initialFeed, fallbackChapterId }: AdminOverviewProps) {
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id ?? fallbackChapterId ?? null;
  const [activeMobileTab, setActiveMobileTab] = useState('home');
  const [showQuickActionsModal, setShowQuickActionsModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false); // Add this line
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Add mobile detection useEffect (add this after line 46, before feedData)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const feedData = useMemo(() => {
    if (!initialFeed) return undefined;
    if (!chapterId) return initialFeed;
    return initialFeed.chapterId === chapterId ? initialFeed : undefined;
  }, [chapterId, initialFeed]);

  // Handle tool query param from FAB menu
  useEffect(() => {
    const tool = searchParams.get('tool');
    if (tool === 'tasks') {
      setActiveMobileTab('tasks');
    } else if (tool === 'operations') {
      setActiveMobileTab('operations');
    } else if (tool === 'events') {
      setActiveMobileTab('events');
    } else if (tool === 'docs') {
      setActiveMobileTab('docs');
    } else if (tool === 'ops') {
      setActiveMobileTab('ops');
    } else if (tool === 'calendar') {
      setActiveMobileTab('calendar');
    } else if (!tool) {
      setActiveMobileTab('home');
    }
  }, [searchParams]);

  // Quick Actions handlers
  const handleScheduleMeeting = () => {
    setShowEventModal(true);
  };

  const handleSendMessage = () => {
    router.push('/dashboard/messages');
  };

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

      toast.success('Event created successfully!');
      setShowEventModal(false);
    } catch (error) {
      toast.error('Failed to create event');
      console.error('Error creating event:', error);
    }
  };

  // Define quickActions array for the admin dashboard
  const quickActions: QuickAction[] = [
    {
      id: 'create-event',
      label: 'Create Event',
      icon: Calendar,
      onClick: handleScheduleMeeting,
      variant: 'outline',
    },
    {
      id: 'send-message',
      label: 'Send Message',
      icon: MessageSquare,
      onClick: handleSendMessage,
      variant: 'outline',
    },
    {
      id: 'manage-members',
      label: 'Manage Members',
      icon: Users,
      onClick: () => router.push('/dashboard/admin/members'),
      variant: 'outline',
    },
    {
      id: 'view-invitations',
      label: 'View Invitations',
      icon: UserPlus,
      onClick: () => {
        router.push('/dashboard/admin#invitations');
        // Scroll to invitations section after navigation
        setTimeout(() => {
          const element = document.getElementById('invitations');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      },
      variant: 'outline',
    },
  ];

  // Remove the manual tab configuration - MobileBottomNavigation will auto-detect role

  // Check if user is an executive member
  const isExecutiveMember = profile?.role === 'admin' || 
    (profile?.chapter_role && EXECUTIVE_ROLES.includes(profile.chapter_role as any));

  const renderMobileContent = () => {
    switch (activeMobileTab) {
      case 'home':
        return (
          <div className="space-y-4">
            <div className="w-full">
              {/* Show Send Announcement for executive members, DuesStatusCard for others */}
              {isExecutiveMember ? (
                <SendAnnouncementButton />
              ) : (
                <DuesStatusCard />
              )}
            </div>
            <div className="w-full">
              <SocialFeed chapterId={chapterId || ''} initialData={feedData} />
            </div>
          </div>
        );
      case 'tasks':
        return <MobileAdminTasksPage />;
      case 'operations':
        return <MobileOperationsPage />;
      case 'events':
        return <MobileEventsVendorsPage />;
      case 'docs':
        return <MobileDocsCompliancePage />;
      case 'ops':
        return <MobileOperationsFeedPage />;
      case 'calendar':
        return <MobileCalendarPage />;
      default:
        return (
          <div className="space-y-4">
            <div className="w-full">
              <SocialFeed chapterId={chapterId || ''} initialData={feedData} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Alerts Strip - Critical alerts only */}
      <div className="max-w-full mx-auto px-4 sm:px-6 py-2">
        <AlertsStrip />
      </div>

      {/* Main Content - Mobile-First Layout */}
      <div className="max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Mobile Layout: Tab-Based Navigation */}
        <div className="sm:hidden">
          {renderMobileContent()}
        </div>

        {/* Desktop Layout: Three Column Grid (Preserved) */}
        <div className="hidden sm:grid sm:grid-cols-12 sm:gap-6">
          {/* Left Column - 3 columns wide */}
          <div className="col-span-3 space-y-6">
            <DuesStatusCard />
            <OperationsFeed />
          </div>
          
          {/* Center Column - 6 columns wide */}
          <div className="col-span-6 space-y-6">
            <SocialFeed chapterId={chapterId || ''} initialData={feedData} />
          </div>
          
          {/* Right Column - 3 columns wide */}
          <div className="col-span-3 space-y-6">
            <UpcomingEventsCard />
            {chapterId && <TasksPanel chapterId={chapterId} />}
            <DocsCompliancePanel />
            <CompactCalendarCard />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Auto-configures based on admin role */}
      <MobileBottomNavigation 
        activeTab={activeMobileTab} 
        onTabChange={setActiveMobileTab}
      />

      {/* Quick Actions Floating Action Button - Only on Home Page */}
      {activeMobileTab === 'home' && (
        <div
          onClick={() => setShowQuickActionsModal(true)}
          className="fixed bottom-40 right-4 z-40 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 sm:hidden flex items-center justify-center cursor-pointer"
          title="Quick Actions"
        >
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      )}

      {/* Quick Actions Modal */}
      {showQuickActionsModal && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowQuickActionsModal(false)} />
          <div className="relative flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                  <button
                    onClick={() => setShowQuickActionsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {/* Quick Actions Content - No Card wrapper */}
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleScheduleMeeting}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Create Event
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
                    onClick={() => router.push('/dashboard/admin/members')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Members
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      router.push('/dashboard/admin#invitations');
                      setTimeout(() => {
                        const element = document.getElementById('invitations');
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    View Invitations
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Creation Modal */}
      {showEventModal && (
        <EventForm
          isOpen={showEventModal}
          event={null}
          onSubmit={handleCreateEvent}
          onCancel={() => setShowEventModal(false)}
          loading={false}
        />
      )}
    </div>
  );
} 