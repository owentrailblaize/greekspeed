'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, X, CheckCircle, Home, Users as UsersIcon, Wrench, CreditCard, User, CheckSquare, FileText, Activity, X as XIcon, Search, Building2 } from 'lucide-react';
import { PersonalAlumniProfile } from './ui/PersonalAlumniProfile';
import { SocialFeed, type SocialFeedInitialData } from './ui/SocialFeed';
import { AlumniMobileBottomNavigation } from './ui/AlumniMobileBottomNavigation';
import { MobileNetworkPage } from './ui/MobileNetworkPage';
import { MobileProfilePage } from './ui/MobileProfilePage';
import { AlumniPipeline } from '@/components/features/alumni/AlumniPipeline';
import { MyChapterPage } from '@/components/mychapter/MyChapterPage';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { useChapterMembers } from '@/lib/hooks/useChapterMembers';
import { useConnections } from '@/lib/contexts/ConnectionsContext';
import { useRouter } from 'next/navigation';
import React from 'react';
import { ChapterMemberData } from '@/types/chapter';
import { MobileBottomNavigation } from './ui/MobileBottomNavigation';
import { weightedRandomShuffle } from '@/lib/utils/weightedShuffle';
import { calculateNetworkingPriority } from '@/lib/utils/networkingSpotlight';
import { ClickableAvatar } from '@/components/features/user-profile/ClickableAvatar';
import { ClickableUserName } from '@/components/features/user-profile/ClickableUserName';

interface Profile {
  id: string;
  name: string;
  avatar: string;
  chapter: string;
  gradYear: number;
  jobTitle: string;
  company: string;
  isActivelyHiring: boolean;
  location: string;
  mutualConnections: number;
}

interface AlumniOverviewProps {
  initialFeed?: SocialFeedInitialData;
  fallbackChapterId?: string | null;
}

// Seeded random number generator (deterministic - same seed = same sequence)
function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

// Fisher-Yates shuffle with seeded random
function seededShuffle<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  const random = seededRandom(seed);
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

export function AlumniOverview({ initialFeed, fallbackChapterId }: AlumniOverviewProps) {
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id ?? fallbackChapterId ?? null;
  const { members: chapterMembers, loading: membersLoading } = useChapterMembers(chapterId || undefined);
  const { connections, sendConnectionRequest, loading: connectionsLoading } = useConnections();
  const router = useRouter();
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [connectionLoading, setConnectionLoading] = useState<string | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState('home');
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [connectedUserName, setConnectedUserName] = useState<string>('');
  const [localConnectionsSnapshot, setLocalConnectionsSnapshot] = useState<any[]>([]);
  const [snapshotTaken, setSnapshotTaken] = useState(false);
  const [sessionSeed, setSessionSeed] = useState<number | null>(null);

  // Get or generate session seed for randomization
  useEffect(() => {
    // Get seed from sessionStorage or generate a new one
    const storageKey = 'networking-spotlight-seed';
    const storedSeed = sessionStorage.getItem(storageKey);
    
    if (storedSeed) {
      setSessionSeed(parseInt(storedSeed, 10));
    } else {
      // Generate new seed for this session
      const newSeed = Math.floor(Math.random() * 1000000);
      sessionStorage.setItem(storageKey, newSeed.toString());
      setSessionSeed(newSeed);
    }
  }, []);

  const feedData = useMemo(() => {
    if (!initialFeed) return undefined;
    if (!chapterId) return initialFeed;
    return initialFeed.chapterId === chapterId ? initialFeed : undefined;
  }, [chapterId, initialFeed]);

  // Take snapshot of connections when they're loaded and we haven't taken one yet
  useEffect(() => {
    if (profile?.id && connections.length >= 0 && !connectionsLoading && !snapshotTaken) {
      setLocalConnectionsSnapshot([...connections]);
      setSnapshotTaken(true);
    }
  }, [profile?.id, connections, connectionsLoading, snapshotTaken]);

  // Memoize the networking spotlight with weighted random shuffling
  const networkingSpotlight = useMemo(() => {
    if (!chapterMembers || !profile || !snapshotTaken || sessionSeed === null) return [];
    
    // Get IDs of users the current user has ANY connection with (pending, accepted, etc.)
    // Use the local snapshot, not the live connections
    const connectedUserIds = new Set(
      localConnectionsSnapshot.map(conn => 
        conn.requester_id === profile.id ? conn.recipient_id : conn.requester_id
      )
    );
    
    // First, get members with avatars (prioritized)
    const membersWithAvatars = chapterMembers.filter(member => 
      member.id !== profile.id && 
      !connectedUserIds.has(member.id) &&
      member.avatar_url && 
      member.avatar_url.trim() !== ''
    );
    
    // If we have fewer than 5 members with avatars, also include members without avatars
    // This ensures we always have suggestions if available
    let availableMembers = membersWithAvatars;
    if (membersWithAvatars.length < 5) {
      const membersWithoutAvatars = chapterMembers.filter(member => 
        member.id !== profile.id && 
        !connectedUserIds.has(member.id) &&
        (!member.avatar_url || member.avatar_url.trim() === '')
      );
      // Combine: members with avatars first, then members without avatars
      // The priority calculation will still favor those with avatars due to avatar bonus
      availableMembers = [...membersWithAvatars, ...membersWithoutAvatars];
    }
    
    // Group by role: alumni, active_member, admin (and others)
    const alumniMembers = availableMembers.filter(member => member.role === 'alumni');
    const activeMembers = availableMembers.filter(member => member.role === 'active_member');
    const adminMembers = availableMembers.filter(member => member.role === 'admin');
    const otherMembers = availableMembers.filter(member => 
      member.role !== 'alumni' && 
      member.role !== 'active_member' && 
      member.role !== 'admin'
    );
    
    // Apply weighted random shuffle to each group
    // Higher randomness factor = more random, lower = more predictable
    const shuffledAlumni = weightedRandomShuffle(
      alumniMembers,
      calculateNetworkingPriority,
      0.4 // 40% randomness factor
    );
    
    const shuffledActive = weightedRandomShuffle(
      activeMembers,
      calculateNetworkingPriority,
      0.4
    );
    
    const shuffledAdmin = weightedRandomShuffle(
      adminMembers,
      calculateNetworkingPriority,
      0.4
    );
    
    const shuffledOther = weightedRandomShuffle(
      otherMembers,
      calculateNetworkingPriority,
      0.4
    );
    
    // Combine with priority order: alumni first, then active members, then admin, then others
    const prioritizedMembers = [
      ...shuffledAlumni,
      ...shuffledActive,
      ...shuffledAdmin,
      ...shuffledOther
    ];
    
    // Instead of taking top 5, take top 15-20 and randomly select 5
    // This ensures variety across sessions while maintaining relevance
    const topPool = prioritizedMembers.slice(0, Math.min(20, prioritizedMembers.length));
    
    // If we have 5 or fewer, just return them all
    if (topPool.length <= 5) {
      return topPool;
    }
    
    // Use seeded shuffle to randomly select 5 from the top pool
    // Same seed = same selection within session
    const shuffledPool = seededShuffle(topPool, sessionSeed);
    return shuffledPool.slice(0, 5);
  }, [chapterMembers, profile, snapshotTaken, localConnectionsSnapshot, sessionSeed]);

  const handleConnect = async (member: ChapterMemberData) => {
    if (!profile) return;
    
    setConnectionLoading(member.id);
    try {
      await sendConnectionRequest(member.id);
      
      // Update our local snapshot to include the new connection
      const newConnection = {
        id: `temp-${Date.now()}`, // Temporary ID
        requester_id: profile.id,
        recipient_id: member.id,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setLocalConnectionsSnapshot(prev => [...prev, newConnection]);
      
      // Show success modal
      setConnectedUserName(member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Chapter Member');
      setSuccessModalOpen(true);
    } catch (error) {
      console.error('Failed to send connection request:', error);
    } finally {
      setConnectionLoading(null);
    }
  };

  const handleBrowseMore = () => {
    router.push('/dashboard/alumni');
  };

  const renderMobileContent = () => {
    switch (activeMobileTab) {
      case 'home':
        return (
          <div className="space-y-4">
            {/* Social Feed - Primary feature for alumni */}
            <div className="w-full">
              <SocialFeed chapterId={chapterId || ''} initialData={feedData} />
            </div>
          </div>
        );
      case 'network':
        return <MobileNetworkPage />;
      case 'profile':
        return <MobileProfilePage />;
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

  // Define alumni navigation tabs
  const alumniTabs = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      onClick: () => setActiveMobileTab('home'),
    },
    {
      id: 'network',
      label: 'Network',
      icon: Users,
      onClick: () => setActiveMobileTab('network'),
    },
    {
      id: 'pipeline',
      label: 'Pipeline',
      icon: Search,
      onClick: () => setActiveMobileTab('pipeline'),
    },
    {
      id: 'chapter',
      label: 'Members',
      icon: Building2,
      onClick: () => setActiveMobileTab('chapter'),
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      onClick: () => {
        setActiveMobileTab('profile');
        router.push('/dashboard/profile');
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Layout - Hidden on mobile */}
      <div className="hidden sm:block">
        {/* Main Content - Three Column Layout */}
        <div className="max-w-full mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Sidebar - Networking Spotlight */}
          <div className="col-span-3">
            <div className="sticky top-6">
              <Card className="bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Users className="h-5 w-5 text-navy-600" />
                    <span>Networking Spotlight</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {membersLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy-600 mx-auto mb-2"></div>
                      <p className="text-xs text-gray-500">Loading members...</p>
                    </div>
                  ) : networkingSpotlight.length > 0 ? (
                    <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                      {networkingSpotlight.map((member) => (
                        <div key={member.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-start space-x-3">
                            {/* Avatar - Now Clickable */}
                            {member.id ? (
                              <ClickableAvatar
                                userId={member.id}
                                avatarUrl={member.avatar_url}
                                fullName={member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim()}
                                firstName={member.first_name}
                                lastName={member.last_name}
                                size="sm"
                                className="w-10 h-10 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-sm font-semibold shrink-0">
                                {member.full_name?.charAt(0) || member.first_name?.charAt(0) || 'U'}
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-1">
                                {/* Name - Now Clickable */}
                                {member.id && (member.full_name || member.first_name || member.last_name) ? (
                                  <ClickableUserName
                                    userId={member.id}
                                    fullName={member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Chapter Member'}
                                    className="font-medium text-gray-900 text-sm truncate"
                                  />
                                ) : (
                                  <h4 className="font-medium text-gray-900 text-sm truncate">
                                    {member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Chapter Member'}
                                  </h4>
                                )}
                                {member.role === 'alumni' && (
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                                    Alumni
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-xs text-gray-600 mb-1 truncate">
                                {member.chapter_role && member.chapter_role !== 'member' ? 
                                  member.chapter_role.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 
                                  member.role === 'alumni' ? 'Alumni' : 'Member'
                                }
                              </p>
                              <p className="text-xs text-gray-500 mb-2">
                                {member.location || 'Location not specified'}
                              </p>
                              
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">
                                  {member.grad_year ? `Class of ${member.grad_year}` : 'Recent'}
                                </span>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleConnect(member)}
                                  disabled={connectionLoading === member.id}
                                  className="text-navy-600 border-navy-600 hover:bg-navy-50 text-xs h-7 px-2 !rounded-full"
                                >
                                  {connectionLoading === member.id ? (
                                    <div className="w-3 h-3 border border-navy-600 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <>
                                      <UserPlus className="w-3 h-3 mr-1" />
                                      Connect
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No new connections available</p>
                      <p className="text-xs mt-1">You may already be connected with everyone!</p>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-gray-100">
                    <Button 
                      variant="outline" 
                      className="w-full text-navy-600 border-navy-600 hover:bg-navy-50"
                      onClick={handleBrowseMore}
                    >
                      Browse More Profiles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Center Column - Social Feed */}
          <div className="col-span-6">
            <SocialFeed chapterId={chapterId || ''} initialData={feedData} />
          </div>

          {/* Right Sidebar - Personal Alumni Profile */}
          <div className="col-span-3">
            <PersonalAlumniProfile />
          </div>
        </div>
      </div>
      </div>

      {/* Mobile Layout - Visible only on mobile */}
      <div className="sm:hidden">
        {activeMobileTab === 'pipeline' ? (
          <>
            <AlumniPipeline />
            <MobileBottomNavigation 
              tabs={alumniTabs}
              activeTab={activeMobileTab}
              onTabChange={setActiveMobileTab}
              showToolsMenu={false}
            />
          </>
        ) : activeMobileTab === 'chapter' ? (
          <>
            <MyChapterPage />
            <MobileBottomNavigation 
              tabs={alumniTabs}
              activeTab={activeMobileTab}
              onTabChange={setActiveMobileTab}
              showToolsMenu={false}
            />
          </>
        ) : (
          <>
            <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
              <div className="max-w-md mx-auto">
                {renderMobileContent()}
              </div>
            </div>
            <MobileBottomNavigation 
              tabs={alumniTabs}
              activeTab={activeMobileTab}
              onTabChange={setActiveMobileTab}
              showToolsMenu={false}
            />
          </>
        )}
      </div>

      {/* Modals */}
      {connectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Connect with {selectedProfile?.name}</h3>
            <p className="text-gray-600 mb-4">Connection functionality coming soon!</p>
            <div className="flex space-x-2">
              <Button onClick={() => setConnectModalOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full mx-4 p-6 text-center">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setSuccessModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Connection Request Sent!
              </h3>
              <p className="text-gray-600">
                Your connection request has been sent to <span className="font-medium">{connectedUserName}</span>
              </p>
            </div>
            
            <Button 
              onClick={() => setSuccessModalOpen(false)}
              className="w-full bg-brand-primary hover:bg-brand-primary-hover"
            >
              Got it!
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 