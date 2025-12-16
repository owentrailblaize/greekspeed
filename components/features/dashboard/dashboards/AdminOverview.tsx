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
import { FeatureGuard } from '@/components/shared/FeatureGuard';
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
import { useFeatureFlag } from '@/lib/hooks/useFeatureFlag';
import { AddRecruitForm } from '@/components/features/recruitment/AddRecruitForm';
import type { Recruit } from '@/types/recruitment';

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
  const [showAddRecruitModal, setShowAddRecruitModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false); // Add this line
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { enabled: eventsManagementEnabled } = useFeatureFlag('events_management_enabled');
  const { enabled: recruitmentCrmEnabled } = useFeatureFlag('recruitment_crm_enabled');

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
    const tab = searchParams.get('tab');
    
    if (tool === 'tasks') {
      setActiveMobileTab('tasks');
      // If tab=recruits is in query, we'll handle it in MobileAdminTasksPage
    } else if (tool === 'operations') {
      setActiveMobileTab('operations');
    } else if (tool === 'events') {
      setActiveMobileTab('events');
    } else if (tool === 'invites') {
      // Handle invites when events flag is disabled
      setActiveMobileTab('events'); // Still use 'events' tab but it will show invitations
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

  const handleAddRecruit = () => {
    setShowAddRecruitModal(true);
  };

  const handleRecruitSuccess = (recruit: Recruit) => {
    toast.success('Recruit added successfully!');
    setShowAddRecruitModal(false);
  };

  const handleRecruitCancel = () => {
    setShowAddRecruitModal(false);
  };

  // Define quickActions array for the admin dashboard
  const quickActions: QuickAction[] = [
    // Only include Create Event if events management is enabled
    ...(eventsManagementEnabled ? [{
      id: 'create-event',
      label: 'Create Event',
      icon: Calendar,
      onClick: handleScheduleMeeting,
      variant: 'outline' as const,
    }] : []),
    {
      id: 'send-message',
      label: 'Send Message',
      icon: MessageSquare,
      onClick: handleSendMessage,
      variant: 'outline' as const,
    },
    {
      id: 'manage-members',
      label: 'Manage Members',
      icon: Users,
      onClick: () => router.push('/dashboard/admin/members'),
      variant: 'outline' as const,
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
      variant: 'outline' as const,
    },
    // Add recruitment option conditionally based on flag
    ...(recruitmentCrmEnabled ? [{
      id: 'add-recruit',
      label: 'Add Recruit',
      icon: UserPlus,
      onClick: handleAddRecruit,
      variant: 'outline' as const,
    }] : []),
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
                <FeatureGuard flagName="financial_tools_enabled">
                  <DuesStatusCard />
                </FeatureGuard>
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
            <FeatureGuard flagName="financial_tools_enabled">
              <DuesStatusCard />
            </FeatureGuard>
            <OperationsFeed />
          </div>
          
          {/* Center Column - 6 columns wide */}
          <div className="col-span-6 space-y-6">
            <SocialFeed chapterId={chapterId || ''} initialData={feedData} />
          </div>
          
          {/* Right Column - 3 columns wide */}
          <div className="col-span-3 space-y-6">
            <FeatureGuard flagName="events_management_enabled">
              <UpcomingEventsCard />
            </FeatureGuard>
            {chapterId && <TasksPanel chapterId={chapterId} />}
            <DocsCompliancePanel />
            <FeatureGuard flagName="events_management_enabled">
              <CompactCalendarCard />
            </FeatureGuard>
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

      {/* Quick Actions Modal - Mobile: Bottom drawer, Desktop: Centered */}
      {showQuickActionsModal && (
        <div className={cn(
          "fixed inset-0 z-[9999]",
          isMobile 
            ? "flex items-end justify-center p-0 sm:hidden"
            : "hidden sm:flex items-center justify-center p-4"
        )}>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setShowQuickActionsModal(false)} 
          />
          
          {/* Mobile: Bottom Drawer */}
          {isMobile && (
            <div className="relative bg-white shadow-xl w-full flex flex-col max-h-[85dvh] mt-[15dvh] rounded-t-2xl rounded-b-none pb-[calc(48px+env(safe-area-inset-bottom))]">
              {/* Header */}
              <div className="flex items-center justify-between p-4 flex-shrink-0 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                <button
                  onClick={() => setShowQuickActionsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 pb-[calc(40px+env(safe-area-inset-bottom))]">
                <div className="space-y-3">
                  {eventsManagementEnabled && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start rounded-full bg-white/80 backdrop-blur-md border border-navy-500/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-navy-700 hover:text-navy-900 transition-all duration-300"
                      onClick={() => {
                        handleScheduleMeeting();
                        setShowQuickActionsModal(false);
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Create Event
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full justify-start rounded-full bg-white/80 backdrop-blur-md border border-navy-500/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-navy-700 hover:text-navy-900 transition-all duration-300"
                    onClick={() => {
                      handleSendMessage();
                      setShowQuickActionsModal(false);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start rounded-full bg-white/80 backdrop-blur-md border border-navy-500/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-navy-700 hover:text-navy-900 transition-all duration-300"
                    onClick={() => {
                      router.push('/dashboard/admin/members');
                      setShowQuickActionsModal(false);
                    }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Members
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start rounded-full bg-white/80 backdrop-blur-md border border-navy-500/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-navy-700 hover:text-navy-900 transition-all duration-300"
                    onClick={() => {
                      router.push('/dashboard/admin#invitations');
                      setShowQuickActionsModal(false);
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
                  {recruitmentCrmEnabled && (
                    <>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start rounded-full bg-white/80 backdrop-blur-md border border-navy-500/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-navy-700 hover:text-navy-900 transition-all duration-300"
                        onClick={() => {
                          handleAddRecruit();
                          setShowQuickActionsModal(false);
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Recruit
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start rounded-full bg-white/80 backdrop-blur-md border border-navy-500/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-navy-700 hover:text-navy-900 transition-all duration-300"
                        onClick={() => {
                          router.push('/dashboard?tool=tasks&tab=recruits');
                          setShowQuickActionsModal(false);
                        }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Manage Recruits
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Desktop: Centered Modal */}
          {!isMobile && (
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                  <button
                    onClick={() => setShowQuickActionsModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {/* Quick Actions Content */}
                <div className="space-y-3">
                  {eventsManagementEnabled && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {
                        handleScheduleMeeting();
                        setShowQuickActionsModal(false);
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Create Event
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      handleSendMessage();
                      setShowQuickActionsModal(false);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      router.push('/dashboard/admin/members');
                      setShowQuickActionsModal(false);
                    }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Members
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      router.push('/dashboard/admin#invitations');
                      setShowQuickActionsModal(false);
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
                  {recruitmentCrmEnabled && (
                    <>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => {
                          handleAddRecruit();
                          setShowQuickActionsModal(false);
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Recruit
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => {
                          router.push('/dashboard?tool=tasks&tab=recruits');
                          setShowQuickActionsModal(false);
                        }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Manage Recruits
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Recruit Modal - Mobile: Bottom drawer, Desktop: Centered */}
      {showAddRecruitModal && recruitmentCrmEnabled && createPortal(
        <div className={cn(
          "fixed inset-0 z-[9999]",
          isMobile 
            ? "flex items-end justify-center p-0 sm:hidden"
            : "hidden sm:flex items-center justify-center p-4"
        )}>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={handleRecruitCancel} 
          />
          
          {/* Mobile: Bottom Drawer with Rounded Top */}
          {isMobile && (
            <div className="relative bg-white shadow-xl w-full flex flex-col max-h-[90vh] rounded-t-2xl rounded-b-none overflow-hidden"> {/* Add overflow-hidden */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <AddRecruitForm 
                  variant="modal"
                  onSuccess={handleRecruitSuccess}
                  onCancel={handleRecruitCancel}
                />
              </div>
            </div>
          )}
          
          {/* Desktop: Centered Modal */}
          {!isMobile && (
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="overflow-y-auto max-h-[90vh] p-6">
                <AddRecruitForm 
                  variant="modal"
                  onSuccess={handleRecruitSuccess}
                  onCancel={handleRecruitCancel}
                />
              </div>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* Event Creation Modal */}
      {showEventModal && eventsManagementEnabled && (
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