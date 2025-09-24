'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, X, CheckCircle } from 'lucide-react';
import { PersonalAlumniProfile } from './ui/PersonalAlumniProfile';
import { SocialFeed } from './ui/SocialFeed';
import { AlumniMobileBottomNavigation } from './ui/AlumniMobileBottomNavigation';
import { MobileNetworkPage } from './ui/MobileNetworkPage';
import { MobileProfilePage } from './ui/MobileProfilePage';
import { AlumniPipeline } from '@/components/AlumniPipeline';
import { MyChapterPage } from '@/components/MyChapterPage';
import { useProfile } from '@/lib/hooks/useProfile';
import { useChapterMembers } from '@/lib/hooks/useChapterMembers';
import { useConnections } from '@/lib/contexts/ConnectionsContext';
import { useRouter } from 'next/navigation';
import React from 'react';
import { ChapterMemberData } from '@/types/chapter';

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

export function AlumniOverview() {
  const { profile } = useProfile();
  const { members: chapterMembers, loading: membersLoading } = useChapterMembers(profile?.chapter_id || undefined);
  const { connections, sendConnectionRequest } = useConnections();
  const router = useRouter();
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [connectionLoading, setConnectionLoading] = useState<string | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState('home');
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [connectedUserName, setConnectedUserName] = useState<string>('');

  // Memoize the networking spotlight to prevent constant refreshing
  const networkingSpotlight = useMemo(() => {
    if (!chapterMembers || !profile) return [];
    
    // Get IDs of users the current user has ANY connection with (pending, accepted, etc.)
    const connectedUserIds = new Set(
      connections
        .filter(conn => 
          conn.requester_id === profile.id || conn.recipient_id === profile.id
        )
        .map(conn => 
          conn.requester_id === profile.id ? conn.recipient_id : conn.requester_id
        )
    );
    
    // Filter out current user and users with any existing connection
    const availableMembers = chapterMembers.filter(member => 
      member.id !== profile.id && 
      !connectedUserIds.has(member.id)
    );
    
    // Prioritize alumni and active members, then randomly shuffle and return up to 5
    const alumniMembers = availableMembers.filter(member => member.role === 'alumni');
    const activeMembers = availableMembers.filter(member => member.role === 'active_member');
    const otherMembers = availableMembers.filter(member => 
      member.role !== 'alumni' && member.role !== 'active_member'
    );
    
    // Combine with priority order: alumni first, then active members, then others
    // Use a seeded shuffle based on user ID for consistent randomness per user
    const shuffleArray = (arr: any[], seed: string) => {
      const shuffled = [...arr];
      let currentIndex = shuffled.length;
      
      // Simple seeded random function
      let seedNum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const seededRandom = () => {
        seedNum = (seedNum * 9301 + 49297) % 233280;
        return seedNum / 233280;
      };
      
      while (currentIndex !== 0) {
        const randomIndex = Math.floor(seededRandom() * currentIndex);
        currentIndex--;
        [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
      }
      
      return shuffled;
    };
    
    const prioritizedMembers = [
      ...shuffleArray(alumniMembers, profile.id),
      ...shuffleArray(activeMembers, profile.id),
      ...shuffleArray(otherMembers, profile.id)
    ];
    
    return prioritizedMembers.slice(0, 5);
  }, [chapterMembers, profile, connections]); // Only recalculate when these dependencies change

  const handleConnect = async (member: ChapterMemberData) => {
    if (!profile) return;
    
    setConnectionLoading(member.id);
    try {
      await sendConnectionRequest(member.id);
      // Show success modal
      setConnectedUserName(member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Chapter Member');
      setSuccessModalOpen(true);
    } catch (error) {
      console.error('Failed to send connection request:', error);
      // You could show an error toast here
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
              <SocialFeed chapterId={profile?.chapter_id || ''} />
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
              <SocialFeed chapterId={profile?.chapter_id || ''} />
            </div>
          </div>
        );
    }
  };

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
                            {/* Avatar */}
                            <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-sm font-semibold shrink-0">
                              {member.avatar_url ? (
                                <img 
                                  src={member.avatar_url} 
                                  alt={member.full_name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                member.full_name?.charAt(0) || member.first_name?.charAt(0) || 'U'
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-medium text-gray-900 text-sm truncate">
                                  {member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Chapter Member'}
                                </h4>
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
                                  className="text-navy-600 border-navy-600 hover:bg-navy-50 text-xs h-7 px-2"
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
            <SocialFeed chapterId={profile?.chapter_id || ''} />
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
        {/* Special handling for Pipeline and Chapter tabs - render full screen */}
        {activeMobileTab === 'pipeline' ? (
          <>
            <AlumniPipeline />
            <AlumniMobileBottomNavigation 
              activeTab={activeMobileTab} 
              onTabChange={setActiveMobileTab} 
            />
          </>
        ) : activeMobileTab === 'chapter' ? (
          <>
            <MyChapterPage />
            <AlumniMobileBottomNavigation 
              activeTab={activeMobileTab} 
              onTabChange={setActiveMobileTab} 
            />
          </>
        ) : (
          <>
            <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
              <div className="max-w-md mx-auto">
                {renderMobileContent()}
              </div>
            </div>
            <AlumniMobileBottomNavigation 
              activeTab={activeMobileTab} 
              onTabChange={setActiveMobileTab} 
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
              className="w-full bg-navy-600 hover:bg-navy-700"
            >
              Got it!
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 