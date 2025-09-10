'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus } from 'lucide-react';
import { useProfile } from '@/lib/hooks/useProfile';
import { useChapterMembers } from '@/lib/hooks/useChapterMembers';
import { useConnections } from '@/lib/hooks/useConnections';
import { ConnectionManagement } from '@/components/ui/ConnectionManagement';
import { ChapterMemberData } from '@/types/chapter';

export function MobileNetworkPage() {
  const { profile } = useProfile();
  const { members: chapterMembers, loading: membersLoading } = useChapterMembers(profile?.chapter_id || undefined);
  const { 
    connections, 
    sendConnectionRequest,
    refreshConnections 
  } = useConnections();
  const [connectionLoading, setConnectionLoading] = useState<string | null>(null);

  // Get all unconnected chapter members for suggestions
  const getAllUnconnectedMembers = () => {
    if (!chapterMembers || !profile) return [];
    
    // Get IDs of users the current user has any connection with (pending, accepted, declined)
    const connectedUserIds = new Set(
      connections.map(conn => 
        conn.requester_id === profile.id ? conn.recipient_id : conn.requester_id
      )
    );
    
    // Filter out current user and all users with any connection status
    const availableMembers = chapterMembers.filter(member => 
      member.id !== profile.id && 
      !connectedUserIds.has(member.id)
    );
    
    // Prioritize alumni and active members, then randomly shuffle
    const alumniMembers = availableMembers.filter(member => member.role === 'alumni');
    const activeMembers = availableMembers.filter(member => member.role === 'active_member');
    const otherMembers = availableMembers.filter(member => 
      member.role !== 'alumni' && member.role !== 'active_member'
    );
    
    // Combine with priority order: alumni first, then active members, then others
    const prioritizedMembers = [
      ...alumniMembers.sort(() => Math.random() - 0.5),
      ...activeMembers.sort(() => Math.random() - 0.5),
      ...otherMembers.sort(() => Math.random() - 0.5)
    ];
    
    return prioritizedMembers;
  };

  const unconnectedMembers = getAllUnconnectedMembers();

  const handleConnect = async (member: ChapterMemberData) => {
    if (!profile) return;
    
    setConnectionLoading(member.id);
    try {
      await sendConnectionRequest(member.id);
      console.log('Connection request sent to:', member.full_name);
      await refreshConnections(); // Refresh connections to update the list
    } catch (error) {
      console.error('Failed to send connection request:', error);
    } finally {
      setConnectionLoading(null);
    }
  };

  if (membersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy-600" />
            <span className="ml-2 text-gray-600">Loading members...</span>
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

        {/* Suggestions Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-navy-600" />
              <span>Suggestions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {unconnectedMembers.length > 0 ? (
              <div className="space-y-3">
                {unconnectedMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-sm font-semibold">
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
                        <div className="flex items-center space-x-2 mb-1">
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
                            member.chapter_role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
                            member.role === 'alumni' ? 'Alumni' : 'Member'
                          }
                        </p>
                        <p className="text-xs text-gray-500">
                          {member.grad_year ? `Class of ${member.grad_year}` : 'Recent'}
                        </p>
                      </div>
                    </div>
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
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">You're connected with everyone!</p>
                <p className="text-xs text-gray-400 mt-1">All chapter members are already connected</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
