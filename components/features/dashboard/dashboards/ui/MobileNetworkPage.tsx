'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, X, CheckCircle, Link2, ChevronRight, Search } from 'lucide-react';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { useChapterMembers } from '@/lib/hooks/useChapterMembers';
import { useConnections } from '@/lib/contexts/ConnectionsContext';
import { useAuth } from '@/lib/supabase/auth-context';
import { ChapterMemberData } from '@/types/chapter';
import { cn } from '@/lib/utils';

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

export function MobileNetworkPage() {
  const router = useRouter();
  const { profile } = useProfile();
  const { user } = useAuth();
  const { members: chapterMembers, loading: membersLoading } = useChapterMembers(profile?.chapter_id || undefined);
  const { 
    connections, 
    sendConnectionRequest,
    updateConnectionStatus,
    refreshConnections,
    loading: connectionsLoading
  } = useConnections();
  const [connectionLoading, setConnectionLoading] = useState<string | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [connectedUserName, setConnectedUserName] = useState<string>('');
  const [localConnectionsSnapshot, setLocalConnectionsSnapshot] = useState<any[]>([]);
  const [snapshotTaken, setSnapshotTaken] = useState(false);
  const [sessionSeed, setSessionSeed] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'grow' | 'catchup'>('grow');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Get or generate session seed for randomization
  useEffect(() => {
    const storageKey = 'mobile-network-suggestions-seed';
    const storedSeed = sessionStorage.getItem(storageKey);
    
    if (storedSeed) {
      setSessionSeed(parseInt(storedSeed, 10));
    } else {
      const newSeed = Math.floor(Math.random() * 1000000);
      sessionStorage.setItem(storageKey, newSeed.toString());
      setSessionSeed(newSeed);
    }
  }, []);

  // Take snapshot of connections when they're loaded
  useEffect(() => {
    if (profile?.id && connections.length >= 0 && !connectionsLoading && !snapshotTaken) {
      setLocalConnectionsSnapshot([...connections]);
      setSnapshotTaken(true);
    }
  }, [profile?.id, connections, connectionsLoading, snapshotTaken]);

  // Filter connections
  const incomingRequests = useMemo(() => {
    if (!user || !connections) return [];
    return connections.filter(conn => 
      conn.status === 'pending' && conn.recipient_id === user.id
    );
  }, [connections, user]);

  const sentRequests = useMemo(() => {
    if (!user || !connections) return [];
    return connections.filter(conn => 
      conn.status === 'pending' && conn.requester_id === user.id
    );
  }, [connections, user]);

  const getConnectionPartner = (connection: any) => {
    if (!user) return { name: 'Unknown', initials: 'U', avatar: null };
    const partner = connection.requester_id === user.id ? connection.recipient : connection.requester;
    return {
      name: partner.full_name || 'Unknown User',
      initials: partner.full_name?.charAt(0) || 'U',
      avatar: partner.avatar_url
    };
  };

  const handleConnectionAction = async (connectionId: string, action: 'accept' | 'decline') => {
    setProcessingId(connectionId);
    try {
      const status = action === 'accept' ? 'accepted' : 'declined';
      await updateConnectionStatus(connectionId, status);
      await refreshConnections();
    } catch (error) {
      console.error('Failed to update connection:', error);
    } finally {
      setProcessingId(null);
    }
  };

  // Memoize the unconnected members using relevance-based algorithm
  const unconnectedMembers = useMemo(() => {
    if (!chapterMembers || !profile || !snapshotTaken || sessionSeed === null) return [];
    
    const connectedUserIds = new Set(
      localConnectionsSnapshot.map(conn => 
        conn.requester_id === profile.id ? conn.recipient_id : conn.requester_id
      )
    );
    
    const availableMembers = chapterMembers.filter(member => 
      member.id !== profile.id && 
      !connectedUserIds.has(member.id)
    );
    
    const calculateRelevanceScore = (member: any) => {
      let score = 0;
      const mutualCount = (member as any).mutualConnectionsCount || 0;
      score += mutualCount * 100;
      
      if (member.avatar_url) score += 60;
      if (member.bio && member.bio.trim() !== '') score += 20;
      if (member.location && member.location.trim() !== '') score += 15;
      if (member.phone && member.phone.trim() !== '') score += 10;
      
      const activityDate = (member as any).last_active_at || member.updated_at;
      if (activityDate) {
        const daysSinceActivity = (Date.now() - new Date(activityDate).getTime()) / (24 * 60 * 60 * 1000);
        if (daysSinceActivity <= 30) score += 30;
        else if (daysSinceActivity <= 90) score += 15;
      }
      
      if (profile.grad_year && member.grad_year) {
        const yearDiff = Math.abs(profile.grad_year - member.grad_year);
        if (yearDiff <= 5) score += 20 - (yearDiff * 2);
      }
      
      if (profile.location && member.location) {
        if (profile.location.toLowerCase() === member.location.toLowerCase()) {
          score += 25;
        }
      }
      
      return score;
    };
    
    const sortedMembers = availableMembers.sort((a, b) => {
      const scoreA = calculateRelevanceScore(a);
      const scoreB = calculateRelevanceScore(b);
      
      if (scoreB !== scoreA) return scoreB - scoreA;
      
      const mutualA = (a as any).mutualConnectionsCount || 0;
      const mutualB = (b as any).mutualConnectionsCount || 0;
      if (mutualB !== mutualA) return mutualB - mutualA;
      
      const nameA = a.full_name || `${a.first_name || ''} ${a.last_name || ''}`.trim() || '';
      const nameB = b.full_name || `${b.first_name || ''} ${b.last_name || ''}`.trim() || '';
      return nameA.localeCompare(nameB);
    });
    
    const alumniMembers = sortedMembers.filter(member => member.role === 'alumni');
    const activeMembers = sortedMembers.filter(member => member.role === 'active_member');
    const otherMembers = sortedMembers.filter(member => 
      member.role !== 'alumni' && member.role !== 'active_member'
    );
    
    const prioritizedMembers = [
      ...alumniMembers,
      ...activeMembers,
      ...otherMembers
    ];
    
    const topPool = prioritizedMembers.slice(0, Math.min(20, prioritizedMembers.length));
    
    if (topPool.length <= 5) {
      return topPool;
    }
    
    const shuffledPool = seededShuffle(topPool, sessionSeed);
    return shuffledPool.slice(0, 5);
  }, [chapterMembers, profile, snapshotTaken, localConnectionsSnapshot, sessionSeed]);

  const handleConnect = async (member: ChapterMemberData) => {
    if (!profile) return;
    
    setConnectionLoading(member.id);
    try {
      await sendConnectionRequest(member.id);
      
      const newConnection = {
        id: `temp-${Date.now()}`,
        requester_id: profile.id,
        recipient_id: member.id,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setLocalConnectionsSnapshot(prev => [...prev, newConnection]);
      setConnectedUserName(member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Chapter Member');
      setSuccessModalOpen(true);
    } catch (error) {
      console.error('Failed to send connection request:', error);
    } finally {
      setConnectionLoading(null);
    }
  };

  // Show loading while connections are being loaded
  if (membersLoading || connectionsLoading || !snapshotTaken) {
    return (
      <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy-600" />
            <span className="ml-2 text-gray-600">Loading network...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Search Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center space-x-3 bg-gray-100 rounded-lg px-4 py-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="I'm looking for..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('grow')}
            className={cn(
              "flex-1 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'grow'
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            )}
          >
            Grow
          </button>
          <button
            onClick={() => setActiveTab('catchup')}
            className={cn(
              "flex-1 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'catchup'
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            )}
          >
            Catch up
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Grow Tab - Incoming Requests */}
        {activeTab === 'grow' && (
          <>
            {incomingRequests.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-3">
                  Invitations ({incomingRequests.length})
                </h2>
                <div className="space-y-3">
                  {incomingRequests.map((connection) => {
                    const partner = getConnectionPartner(connection);
                    return (
                      <div
                        key={connection.id}
                        className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-sm font-semibold flex-shrink-0">
                            {partner.avatar ? (
                              <img 
                                src={partner.avatar} 
                                alt={partner.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              partner.initials
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {partner.name}
                            </p>
                            {connection.message && (
                              <p className="text-xs text-gray-500 mt-0.5 truncate">
                                {connection.message}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                          <button
                            onClick={() => handleConnectionAction(connection.id, 'decline')}
                            disabled={processingId === connection.id}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50"
                          >
                            {processingId === connection.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
                            ) : (
                              <X className="h-4 w-4 text-gray-600" />
                            )}
                          </button>
                          <button
                            onClick={() => handleConnectionAction(connection.id, 'accept')}
                            disabled={processingId === connection.id}
                            className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {processingId === connection.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-white" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {incomingRequests.length === 0 && (
              <div className="text-center py-12">
                <UserPlus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-base font-medium mb-1">No invitations</p>
                <p className="text-gray-500 text-sm">When someone sends you a connection request, it will appear here</p>
              </div>
            )}
          </>
        )}

        {/* Catch up Tab - Sent Requests */}
        {activeTab === 'catchup' && (
          <>
            {sentRequests.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-3">
                  Sent Requests ({sentRequests.length})
                </h2>
                <div className="space-y-3">
                  {sentRequests.map((connection) => {
                    const partner = getConnectionPartner(connection);
                    return (
                      <div
                        key={connection.id}
                        className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-sm font-semibold flex-shrink-0">
                            {partner.avatar ? (
                              <img 
                                src={partner.avatar} 
                                alt={partner.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              partner.initials
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {partner.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {new Date(connection.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Pending
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {sentRequests.length === 0 && (
              <div className="text-center py-12">
                <UserPlus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-base font-medium mb-1">No sent requests</p>
                <p className="text-gray-500 text-sm">Your outgoing connection requests will appear here</p>
              </div>
            )}
          </>
        )}

        {/* Manage my network */}
        <div
          onClick={() => router.push('/dashboard/network/manage')}
          className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Users className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Manage my network</span>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>

        {/* People You May Know */}
        {unconnectedMembers.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-3">
              People you may know
              {profile?.chapter_name && (
                <span className="text-gray-600 font-normal"> from {profile.chapter_name}</span>
              )}
            </h2>
            {/* Horizontal scrollable cards */}
            <div className="flex space-x-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {unconnectedMembers.map((member) => {
                const memberName = member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Chapter Member';
                const mutualCount = (member as any).mutualConnectionsCount || 0;
                
                return (
                  <div
                    key={member.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 flex-shrink-0 w-[280px] relative"
                  >
                    {/* Dismiss button */}
                    <button
                      onClick={() => {
                        // TODO: Implement dismiss functionality
                      }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <X className="h-3 w-3 text-gray-600" />
                    </button>

                    {/* Avatar */}
                    <div className="flex justify-center mb-3">
                      <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-lg font-semibold">
                        {member.avatar_url ? (
                          <img 
                            src={member.avatar_url} 
                            alt={memberName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          memberName.charAt(0).toUpperCase()
                        )}
                      </div>
                    </div>

                    {/* Name */}
                    <h3 className="text-sm font-semibold text-gray-900 text-center mb-1 truncate">
                      {memberName}
                    </h3>

                    {/* Details */}
                    <div className="text-center mb-3">
                      {member.role === 'alumni' && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs mb-1">
                          Alumni
                        </Badge>
                      )}
                      {member.grad_year && (
                        <p className="text-xs text-gray-600">
                          Class of {member.grad_year}
                        </p>
                      )}
                      {mutualCount > 0 && (
                        <div className="flex items-center justify-center space-x-1 mt-1">
                          <Link2 className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {mutualCount === 1 
                              ? '1 mutual connection' 
                              : `${mutualCount} mutual connections`
                            }
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Connect Button */}
                    <Button
                      size="sm"
                      onClick={() => handleConnect(member)}
                      disabled={connectionLoading === member.id}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    >
                      {connectionLoading === member.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Connect'
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Success Modal */}
      {successModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full mx-4 p-6 text-center">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setSuccessModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Connection Request Sent!
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Your connection request has been sent to{' '}
                <span className="font-medium text-gray-900">{connectedUserName}</span>
              </p>
            </div>
            
            <Button 
              onClick={() => setSuccessModalOpen(false)}
              className="w-full bg-navy-600 hover:bg-navy-700 h-12 text-base font-medium"
            >
              Got it!
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
