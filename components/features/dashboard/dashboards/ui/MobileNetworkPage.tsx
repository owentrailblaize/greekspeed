'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, X, CheckCircle } from 'lucide-react';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { useChapterMembers } from '@/lib/hooks/useChapterMembers';
import { useConnections } from '@/lib/contexts/ConnectionsContext';
import { ConnectionManagement } from '@/components/ui/ConnectionManagement';
import { ChapterMemberData } from '@/types/chapter';

export function MobileNetworkPage() {
  const router = useRouter();
  const { profile } = useProfile();
  const { members: chapterMembers, loading: membersLoading } = useChapterMembers(profile?.chapter_id || undefined);
  const { 
    connections, 
    sendConnectionRequest,
    refreshConnections,
    loading: connectionsLoading
  } = useConnections();
  const [connectionLoading, setConnectionLoading] = useState<string | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [connectedUserName, setConnectedUserName] = useState<string>('');
  const [localConnectionsSnapshot, setLocalConnectionsSnapshot] = useState<any[]>([]);
  const [snapshotTaken, setSnapshotTaken] = useState(false);

  // Take snapshot of connections when they're loaded and we haven't taken one yet
  useEffect(() => {
    if (profile?.id && connections.length >= 0 && !connectionsLoading && !snapshotTaken) {
      setLocalConnectionsSnapshot([...connections]);
      setSnapshotTaken(true);
    }
  }, [profile?.id, connections, connectionsLoading, snapshotTaken]);

  // Memoize the unconnected members using the local connections snapshot
  const unconnectedMembers = useMemo(() => {
    if (!chapterMembers || !profile || !snapshotTaken) return [];
    
    // Get IDs of users the current user has any connection with (pending, accepted, declined)
    // Use the local snapshot, not the live connections
    const connectedUserIds = new Set(
      localConnectionsSnapshot.map(conn => 
        conn.requester_id === profile.id ? conn.recipient_id : conn.requester_id
      )
    );
    
    // Filter out current user and all users with any connection status
    const availableMembers = chapterMembers.filter(member => 
      member.id !== profile.id && 
      !connectedUserIds.has(member.id)
    );
    
    // Prioritize alumni and active members, then sort by name for consistent ordering
    const alumniMembers = availableMembers.filter(member => member.role === 'alumni');
    const activeMembers = availableMembers.filter(member => member.role === 'active_member');
    const otherMembers = availableMembers.filter(member => 
      member.role !== 'alumni' && member.role !== 'active_member'
    );
    
    // Sort each group by name for consistent ordering (not random)
    const sortByName = (a: any, b: any) => {
      const nameA = a.full_name || `${a.first_name || ''} ${a.last_name || ''}`.trim() || '';
      const nameB = b.full_name || `${b.first_name || ''} ${b.last_name || ''}`.trim() || '';
      return nameA.localeCompare(nameB);
    };
    
    // Combine with priority order: alumni first, then active members, then others
    const prioritizedMembers = [
      ...alumniMembers.sort(sortByName),
      ...activeMembers.sort(sortByName),
      ...otherMembers.sort(sortByName)
    ];
    
    return prioritizedMembers.slice(0, 5); // Limit to 5 results
  }, [chapterMembers, profile, snapshotTaken, localConnectionsSnapshot]);

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
    <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-6">
          <Users className="h-6 w-6 text-navy-600" />
          <h1 className="text-xl font-semibold text-gray-900">Network</h1>
        </div>

        {/* Connection Management */}
        <ConnectionManagement variant="mobile" className="mb-6" />

        {/* Suggestions Section - Cardless Layout */}
        <div className="mb-6">
          {/* Section Header */}
          <div className="flex items-center space-x-2 mb-4">
            <UserPlus className="h-5 w-5 text-navy-600" />
            <h2 className="text-lg font-semibold text-gray-900">Suggestions</h2>
          </div>

          {/* Suggestions List */}
          {unconnectedMembers.length > 0 ? (
            <div className="space-y-0">
              {unconnectedMembers.map((member, index) => (
                <div 
                  key={member.id} 
                  className={`px-4 py-4 ${index !== unconnectedMembers.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-sm font-semibold">
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
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900 text-sm">
                          {member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Chapter Member'}
                        </h3>
                        {member.role === 'alumni' && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            Alumni
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-1">
                        {member.chapter_role && member.chapter_role !== 'member' ? 
                          member.chapter_role.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 
                          member.role === 'alumni' ? 'Alumni' : 'Member'
                        }
                      </p>
                      <p className="text-xs text-gray-500">
                        {member.grad_year ? `Class of ${member.grad_year}` : 'Recent'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Full-width Connect Button */}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleConnect(member)}
                    disabled={connectionLoading === member.id}
                    className="w-full h-8 text-sm text-navy-600 border-navy-600 hover:bg-navy-50 !rounded-full"
                  >
                    {connectionLoading === member.id ? (
                      <div className="w-4 h-4 border border-navy-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Connect
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">You're connected with everyone!</p>
              <p className="text-gray-400 text-sm">All chapter members are already connected</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Success Modal */}
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
