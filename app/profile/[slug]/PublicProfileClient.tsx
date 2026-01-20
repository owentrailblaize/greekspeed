'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UnifiedUserProfile } from '@/types/user-profile';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Building2, MessageSquare, Users, Lock, X } from 'lucide-react';
import { MobileBottomNavigation } from '@/components/features/dashboard/dashboards/ui/MobileBottomNavigation';
import { ProfileSummary } from '@/components/features/user-profile/mobile/ProfileSummary';
import { ContentNavigationTabs } from '@/components/features/profile/mobile/ContentNavigationTabs';
import { PostsTab } from '@/components/features/user-profile/mobile/PostsTab';
import { AboutTab } from '@/components/features/user-profile/mobile/AboutTab';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { DashboardHeader } from '@/components/features/dashboard/DashboardHeader';
import { CopyProfileLinkButton } from '@/components/profile/CopyProfileLinkButton';
import { useAuth } from '@/lib/supabase/auth-context';
import { useConnections } from '@/lib/contexts/ConnectionsContext';
import Link from 'next/link';
import ImageWithFallback from '@/components/figma/ImageWithFallback';

interface PublicProfileClientProps {
  slug: string;
  initialProfile: UnifiedUserProfile;
}

export function PublicProfileClient({ slug, initialProfile }: PublicProfileClientProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { 
    connections, 
    loading: connectionsLoading,
    sendConnectionRequest,
    updateConnectionStatus,
    cancelConnectionRequest,
    getConnectionId,
    getConnectionStatus
  } = useConnections();
  const [profile, setProfile] = useState<UnifiedUserProfile>(initialProfile);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'declined' | 'blocked'>('none');
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [dismissedModal, setDismissedModal] = useState(false);

  // Fetch fresh profile data with viewer info
  useEffect(() => {
    async function fetchProfileData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/profile/public/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setProfile(data.profile);
          setConnectionStatus(data.viewer.connectionStatus);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfileData();
  }, [slug, user?.id]);

  // Get connection status from context if logged in
  useEffect(() => {
    if (user && !connectionsLoading && connections.length > 0) {
      const connection = connections.find(conn =>
        (conn.requester_id === user.id && conn.recipient_id === profile.id) ||
        (conn.requester_id === profile.id && conn.recipient_id === user.id)
      );

      if (connection) {
        if (connection.status === 'pending') {
          setConnectionStatus(connection.requester_id === user.id ? 'pending_sent' : 'pending_received');
        } else {
          setConnectionStatus(connection.status as 'accepted' | 'declined' | 'blocked');
        }
      }
    }
  }, [user, connections, profile.id, connectionsLoading]);

  const handleClose = () => {
    router.back();
  };

  const isOwnProfile = user?.id === profile.id;
  const isLoggedIn = !!user;
  const isConnected = connectionStatus === 'accepted';

  // Handle connection actions
  const handleConnectionAction = async (action: 'connect' | 'accept' | 'decline' | 'cancel' | 'message') => {
    if (!user || user.id === profile.id) return;
    
    setConnectionLoading(true);
    try {
      switch (action) {
        case 'connect':
          await sendConnectionRequest(profile.id, 'Would love to connect!');
          setConnectionStatus('pending_sent');
          break;
        case 'accept':
          const connectionId = getConnectionId(profile.id);
          if (connectionId) {
            await updateConnectionStatus(connectionId, 'accepted');
            setConnectionStatus('accepted');
          }
          break;
        case 'decline':
          const declineConnectionId = getConnectionId(profile.id);
          if (declineConnectionId) {
            await updateConnectionStatus(declineConnectionId, 'declined');
            setConnectionStatus('declined');
          }
          break;
        case 'cancel':
          const cancelConnectionId = getConnectionId(profile.id);
          if (cancelConnectionId) {
            await cancelConnectionRequest(cancelConnectionId);
            setConnectionStatus('none');
          }
          break;
        case 'message':
          const msgConnectionId = getConnectionId(profile.id);
          if (msgConnectionId) {
            router.push(`/dashboard/messages?connection=${msgConnectionId}`);
          }
          break;
      }
    } catch (error) {
      console.error('Connection action failed:', error);
    } finally {
      setConnectionLoading(false);
    }
  };

  // Loading state
  if (loading && !initialProfile) {
    return (
      <>
        {/* Mobile Loading */}
        <div className="min-h-screen bg-white sm:hidden pb-20">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading profile...</p>
            </div>
          </div>
          <MobileBottomNavigation />
        </div>
        {/* Desktop Loading */}
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 hidden sm:flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading profile...</p>
          </div>
        </div>
      </>
    );
  }

  // Define tabs - show Posts tab with lock indicator for non-logged-in
  const tabs = [
    { 
      id: 'posts', 
      label: 'Posts',
      requiresAuth: true 
    },
    { 
      id: 'about', 
      label: 'About' 
    },
  ];

  // Render profile
  return (
    <>
      {/* Mobile Layout */}
      <div className="min-h-screen bg-white sm:hidden pb-20">
        {/* Header with Back and Share buttons */}
        <div className="relative">
          {profile.banner_url ? (
            <div className="h-32 bg-gradient-to-r from-navy-100 via-blue-100 to-blue-50 relative">
              <img
                src={profile.banner_url}
                alt={`${profile.full_name}'s banner`}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-32 bg-gradient-to-r from-navy-100 via-blue-100 to-blue-50 relative" />
          )}
          
          {/* Back Button */}
          <button
            onClick={handleClose}
            className="absolute top-3 left-3 z-10 h-10 w-10 rounded-full flex items-center justify-center cursor-pointer group"
            style={{
              background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 25%, #3b82f6 50%, #60a5fa 75%, #93c5fd 100%)',
              boxShadow: `
                0 6px 12px rgba(30, 64, 175, 0.4),
                0 2px 4px rgba(30, 64, 175, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.3),
                inset 0 -1px 0 rgba(0, 0, 0, 0.2)
              `,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
            title="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-white relative z-10 drop-shadow-lg transition-transform duration-200 group-hover:scale-110" />
          </button>

          {/* Share Button */}
          <div className="absolute top-3 right-3 z-10">
            <CopyProfileLinkButton
              slug={slug}
              userId={profile.id}
              variant="icon"
              buttonVariant="outline"
              size="sm"
              className="h-10 w-10 bg-white/90 backdrop-blur-sm hover:bg-white shadow-md border-0"
            />
          </div>
        </div>

        {/* Profile Summary Section */}
        <ProfileSummary profile={profile} onClose={handleClose} />

        {/* Sign-up CTA for non-logged-in users */}
        {!isLoggedIn && (
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Join Trailblaize to connect</p>
                <p className="text-xs text-gray-600 mt-0.5">View full profiles and message members</p>
              </div>
              <Link href="/sign-up">
                <Button size="sm" className="bg-navy-600 hover:bg-navy-700 text-white">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Sticky Tab Navigation */}
        <ContentNavigationTabs
          activeTab={activeTab}
          onTabChange={(tabId) => {
            const tab = tabs.find(t => t.id === tabId);
            if (tab?.requiresAuth && !isLoggedIn) {
              return; // Don't allow switching to locked tab
            }
            setActiveTab(tabId);
          }}
          tabs={tabs.map(tab => ({
            id: tab.id,
            label: tab.label,
            disabled: tab.requiresAuth && !isLoggedIn
          }))}
          stickyTop="0"
        />

      {/* Scrollable Content Area */}
      <div className="bg-gray-50 min-h-[400px]">
        {activeTab === 'posts' && (
          <PostsTab 
            userId={profile.id} 
            isOwnProfile={isOwnProfile}
            requireAuth={true}
            isLoggedIn={isLoggedIn}
            profileName={profile.first_name || profile.full_name}
          />
        )}
        {activeTab === 'about' && (
          <AboutTab 
            profile={profile}
            isLoggedIn={isLoggedIn}
            canSeeFullProfile={isOwnProfile || isConnected}
          />
        )}
      </div>

        <MobileBottomNavigation />
      </div>

      {/* Desktop Layout - LinkedIn Style */}
      <div className="min-h-screen bg-white hidden sm:block">
        {/* Conditional Header: DashboardHeader for logged-in, MarketingHeader for logged-out */}
        {isLoggedIn ? <DashboardHeader /> : <MarketingHeader />}

        {/* Top Slide-Down Sign-In Modal */}
        {!isLoggedIn && !dismissedModal && (
          <div className="fixed top-16 left-0 right-0 z-40 animate-[slide-down_0.3s_ease-out] shadow-lg">
            <div className="bg-white border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-8 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Lock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        View {profile.first_name || profile.full_name}'s full profile
                      </h3>
                      <p className="text-sm text-gray-600">
                        See contact information, professional details, and more
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href="/sign-in">
                      <Button variant="outline" className="px-6 rounded-full">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/sign-up">
                      <Button className="bg-navy-600 hover:bg-navy-700 text-white px-6 rounded-full">
                        Join Trailblaize
                      </Button>
                    </Link>
                    <button
                      onClick={() => setDismissedModal(true)}
                      className="text-gray-400 hover:text-gray-600 p-2 -mr-2"
                      aria-label="Dismiss"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Banner Section - Full Width */}
        <div className={`relative w-full ${isLoggedIn ? 'pt-14' : 'pt-16'}`}>
          <div className="w-full h-[160px] lg:h-[180px] relative overflow-hidden">
            {profile.banner_url ? (
              <ImageWithFallback
                src={profile.banner_url}
                alt={`${profile.full_name}'s banner`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-600 via-blue-500 to-navy-600" />
            )}
          </div>

          {/* Avatar - Overlapping Banner */}
          <div className="absolute -bottom-12 left-8 md:left-16">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
              {profile.avatar_url ? (
                <ImageWithFallback
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-navy-500 to-navy-600 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl md:text-3xl">
                    {profile.first_name?.[0] || ''}{profile.last_name?.[0] || ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info Section - Below Banner/Avatar */}
        <div className={`pt-8 md:pt-10 pb-6 px-8 md:px-16 max-w-7xl mx-auto ${!isLoggedIn && !dismissedModal ? 'pt-24' : ''}`}>
          {/* Name and Action Buttons */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {profile.full_name}
              </h1>
              
              {/* Bio */}
              {profile.bio && (
                <p className="text-lg text-gray-700 mb-4 max-w-3xl leading-relaxed">
                  {profile.bio}
                </p>
              )}

              {/* Location and Chapter */}
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                {profile.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.chapter && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{profile.chapter}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons - Top Right */}
            {isLoggedIn && !isOwnProfile && (
              <div className="flex items-center gap-3 ml-4">
                {connectionStatus === 'none' && (
                  <Button
                    onClick={() => handleConnectionAction('connect')}
                    disabled={connectionLoading}
                    className="bg-navy-600 hover:bg-navy-700 text-white px-6"
                  >
                    {connectionLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b border-white mr-2" />
                    ) : (
                      <Users className="h-4 w-4 mr-2" />
                    )}
                    Connect
                  </Button>
                )}
                {connectionStatus === 'pending_sent' && (
                  <Button
                    variant="outline"
                    disabled
                    className="border-gray-300 text-gray-600 px-6"
                  >
                    Pending
                  </Button>
                )}
                {connectionStatus === 'pending_received' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleConnectionAction('accept')}
                      disabled={connectionLoading}
                      className="bg-green-600 hover:bg-green-700 text-white px-6"
                    >
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleConnectionAction('decline')}
                      disabled={connectionLoading}
                      variant="outline"
                      className="border-red-300 text-red-600 px-6"
                    >
                      Decline
                    </Button>
                  </div>
                )}
                {connectionStatus === 'accepted' && (
                  <Button
                    onClick={() => handleConnectionAction('message')}
                    variant="outline"
                    className="border-navy-600 text-navy-600 px-6"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                )}
                <CopyProfileLinkButton
                  slug={slug}
                  userId={profile.id}
                  variant="default"
                  buttonVariant="outline"
                  size="default"
                  className="border-gray-300 text-gray-700 px-6"
                />
              </div>
            )}
            {!isLoggedIn && (
              <div className="ml-4">
                <CopyProfileLinkButton
                  slug={slug}
                  userId={profile.id}
                  variant="default"
                  buttonVariant="outline"
                  size="default"
                  className="border-gray-300 text-gray-700 px-6"
                />
              </div>
            )}
          </div>
        </div>

        {/* Sign-up CTA - Below Profile Info */}
        {!isLoggedIn && (
          <div className="bg-gradient-to-r from-blue-50 to-navy-50 border-y border-blue-100">
            <div className="max-w-7xl mx-auto px-8 md:px-16 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-medium text-gray-900">
                    Join Trailblaize to connect with {profile.first_name || profile.full_name}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    View full profiles, message members, and grow your network
                  </p>
                </div>
                <Link href="/sign-up">
                  <Button className="bg-navy-600 hover:bg-navy-700 text-white px-6 rounded-full">
                    Join
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation - Sticky */}
        <div className="border-b border-gray-200 bg-white sticky top-16 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-8 md:px-16">
            <div className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 transition-colors font-medium ${
                    activeTab === tab.id
                      ? 'border-navy-600 text-navy-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content - Full Width, Cardless */}
        <div className="bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto px-8 md:px-16 py-8">
            {activeTab === 'posts' && (
              <PostsTab 
                userId={profile.id} 
                isOwnProfile={isOwnProfile}
                requireAuth={true}
                isLoggedIn={isLoggedIn}
                profileName={profile.first_name || profile.full_name}
              />
            )}
            {activeTab === 'about' && (
              <AboutTab 
                profile={profile}
                isLoggedIn={isLoggedIn}
                canSeeFullProfile={isOwnProfile || isConnected}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

