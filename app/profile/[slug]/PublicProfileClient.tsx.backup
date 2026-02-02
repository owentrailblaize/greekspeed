'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UnifiedUserProfile } from '@/types/user-profile';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Building2, MessageSquare, MessageCircle, Users, UserPlus, Clock, Lock, X } from 'lucide-react';
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
import { useMutualConnections } from '@/lib/hooks/useMutualConnections';
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
  const [tabsVisible, setTabsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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

    // Handle scroll to hide/show tabs
    useEffect(() => {
        const handleScroll = () => {
        const currentScrollY = window.scrollY;
        
        // Hide tabs when scrolling down, show when scrolling up
        // Only hide after scrolling past a threshold (e.g., 100px)
        if (currentScrollY > 100) {
            if (currentScrollY > lastScrollY) {
            // Scrolling down - hide tabs
            setTabsVisible(false);
            } else if (currentScrollY < lastScrollY) {
            // Scrolling up - show tabs
            setTabsVisible(true);
            }
        } else {
            // Always show tabs when near top
            setTabsVisible(true);
        }
        
        setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const handleClose = () => {
        router.back();
    };

  const isOwnProfile = user?.id === profile.id;
  const isLoggedIn = !!user;
  const isConnected = connectionStatus === 'accepted';

  // Fetch mutual connections (only for logged-in users viewing someone else's profile)
  const { mutualConnections, count: mutualCount } = useMutualConnections(
    isLoggedIn && !isOwnProfile ? profile.id : undefined
  );

  // Bio truncation for non-authenticated users
  const MAX_BIO_LENGTH = 150;
  const shouldTruncateBio = !isLoggedIn && profile.bio && profile.bio.length > MAX_BIO_LENGTH;
  const displayBio = shouldTruncateBio && profile.bio
    ? `${profile.bio.substring(0, MAX_BIO_LENGTH)}...` 
    : profile.bio || null;

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
          {/* Add MarketingHeader for non-authenticated users */}
          {!isLoggedIn && <MarketingHeader hideNavigation={true} />}
          
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading profile...</p>
            </div>
          </div>
          
          {/* Only show MobileBottomNavigation for authenticated users */}
          {isLoggedIn && <MobileBottomNavigation />}
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
        {/* Add MarketingHeader for non-authenticated users */}
        {!isLoggedIn && <MarketingHeader hideNavigation={true} />}
        
        {/* Header with Back and Share buttons */}
        <div className="relative">
          {profile.banner_url ? (
            <div className={`bg-gradient-to-r from-navy-100 via-blue-100 to-blue-50 relative ${!isLoggedIn ? 'h-40' : 'h-32'}`}>
              <img
                src={profile.banner_url}
                alt={`${profile.full_name}'s banner`}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className={`bg-gradient-to-r from-navy-100 via-blue-100 to-blue-50 relative ${!isLoggedIn ? 'h-40' : 'h-32'}`} />
          )}
          
          {/* Back Button */}
          {isLoggedIn && (
            <button
              onClick={handleClose}
              className="absolute top-3 left-3 z-10 h-10 w-10 rounded-full flex items-center justify-center cursor-pointer group"
              style={{
                background: 'linear-gradient(135deg, #e5e7eb 0%, #fff 100%)',
                boxShadow: `
                  0 6px 12px rgba(0, 0, 0, 0.15),
                  0 2px 4px rgba(0, 0, 0, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.9),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.05)
                `,
                border: '1px solid rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
              title="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600 relative z-10 drop-shadow-sm transition-transform duration-200 group-hover:scale-110" />
            </button>
          )}

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
                <Button size="sm" className="hover:bg-navy-700 text-white rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 25%, #3b82f6 50%, #60a5fa 75%, #93c5fd 100%)'
                }}
                >
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

        {/* Only show MobileBottomNavigation for authenticated users */}
        {isLoggedIn && <MobileBottomNavigation />}
      </div>

      {/* Desktop Layout - LinkedIn Style */}
      <div className="min-h-screen bg-white hidden sm:block">
        {/* Conditional Header: DashboardHeader for logged-in, MarketingHeader for logged-out */}
        {isLoggedIn ? <DashboardHeader /> : <MarketingHeader hideNavigation={true} />}

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
        <div className={`relative w-full ${!isLoggedIn ? 'pt-16 md:pt-18' : ''}`}>
          <div className="w-full h-[160px] lg:h-[180px] relative overflow-hidden">
            {profile.banner_url ? (
              <ImageWithFallback
                src={profile.banner_url}
                alt={`${profile.full_name}'s banner`}
                fill
                sizes="100vw"
                quality={90}
                priority
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-600 via-blue-500 to-navy-600" />
            )}

            {/* Back Button - Desktop */}
            {isLoggedIn && (
              <button
                onClick={handleClose}
                className="absolute top-3 left-3 md:top-4 md:left-8 z-10 h-10 w-10 rounded-full flex items-center justify-center cursor-pointer group"
                style={{
                  background: 'linear-gradient(135deg, #e5e7eb 0%, #fff 100%)',
                  boxShadow: `
                    0 6px 12px rgba(0, 0, 0, 0.15),
                    0 2px 4px rgba(0, 0, 0, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.9),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.05)
                  `,
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
                title="Go back"
              >
                <ArrowLeft className="h-5 w-5 text-slate-600 relative z-10 drop-shadow-sm transition-transform duration-200 group-hover:scale-110" />
              </button>
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
        <div className={`pt-8 md:pt-10 px-8 md:px-16 max-w-7xl mx-auto ${!isLoggedIn && !dismissedModal ? 'pt-24' : ''}`}>
          {/* Name and Action Buttons */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {profile.full_name}
                </h1>
                {/* Mutual Connections Count - Only for authenticated users viewing someone else's profile */}
                {isLoggedIn && !isOwnProfile && mutualCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-200">
                    <div className="flex -space-x-1">
                      {mutualConnections.slice(0, 3).map((conn, i) => (
                        <div
                          key={conn.id || `mutual-${i}`}
                          className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-gray-200 relative z-10"
                          style={{ zIndex: 10 - i }}
                          title={conn.name}
                        >
                          {conn.avatar ? (
                            <ImageWithFallback
                              src={conn.avatar}
                              alt={conn.name || 'Mutual connection'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                {conn.name
                                  ?.split(' ')
                                  ?.map((n) => n[0])
                                  ?.join('')
                                  ?.toUpperCase()
                                  ?.slice(0, 2) || '?'}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-gray-700 font-medium">
                      {mutualCount === 1 ? '1 mutual connection' : `${mutualCount} mutual connections`}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Bio */}
              {displayBio && (
                <div className="mb-4 max-w-3xl">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {displayBio}
                  </p>
                  {shouldTruncateBio && (
                    <Link 
                      href="/sign-in"
                      className="text-sm text-navy-600 hover:text-navy-700 font-medium mt-2 inline-block"
                    >
                      Sign in to see more
                    </Link>
                  )}
                </div>
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
                    className="border border-navy-600 text-navy-600 bg-white hover:bg-navy-50 transition-colors duration-200 rounded-full font-medium px-6"
                    variant="outline"
                  >
                    {connectionLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b border-navy-600 mr-2" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    Connect
                  </Button>
                )}
                {connectionStatus === 'pending_sent' && (
                  <Button
                    variant="outline"
                    disabled
                    className="border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 transition-colors duration-200 rounded-full font-medium px-6"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Pending
                  </Button>
                )}
                {connectionStatus === 'pending_received' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleConnectionAction('accept')}
                      disabled={connectionLoading}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 rounded-full font-medium"
                    >
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleConnectionAction('decline')}
                      disabled={connectionLoading}
                      variant="outline"
                      className="border-red-300 text-red-600 px-6 rounded-full font-medium"
                    >
                      Decline
                    </Button>
                  </div>
                )}
                {connectionStatus === 'accepted' && (
                  <Button
                    onClick={() => handleConnectionAction('message')}
                    className="text-white rounded-full font-medium px-6"
                    style={{
                      background: 'linear-gradient(340deg, rgba(228, 236, 255, 1) 0%, rgba(130, 130, 255, 0.95) 34%, rgba(35, 70, 224, 0.93) 85%)'
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Connected
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
                  <Button
                    className="text-white px-6 rounded-full transition-transform duration-200 hover:scale-60 hover:shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 25%, #3b82f6 50%, #60a5fa 75%, #93c5fd 100%)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'linear-gradient(120deg, #2563eb 0%, #1e40af 100%)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #1e40af 0%, #2563eb 25%, #3b82f6 50%, #60a5fa 75%, #93c5fd 100%)';
                    }}
                  >
                    Join
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation - Hides on scroll down, shows on scroll up */}
        <div 
          className={`border-b border-gray-200 bg-white z-10 shadow-sm transition-transform duration-300 ease-in-out ${
            tabsVisible ? 'translate-y-0' : '-translate-y-full'
          }`}
          style={{ position: 'relative' }}
        >
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

