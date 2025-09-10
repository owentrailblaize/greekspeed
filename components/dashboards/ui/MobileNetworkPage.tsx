'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus } from 'lucide-react';
import { useProfile } from '@/lib/hooks/useProfile';
import { useChapterMembers } from '@/lib/hooks/useChapterMembers';
import { useConnections } from '@/lib/hooks/useConnections';
import { ChapterMemberData } from '@/types/chapter';

export function MobileNetworkPage() {
  const { profile } = useProfile();
  const { members: chapterMembers, loading: membersLoading } = useChapterMembers(profile?.chapter_id || undefined);
  const { connections, sendConnectionRequest } = useConnections();
  const [connectionLoading, setConnectionLoading] = useState<string | null>(null);

  // Get networking spotlight members from same chapter
  const getNetworkingSpotlight = () => {
    if (!chapterMembers || !profile) return [];
    
    // Get IDs of users the current user is already connected with
    const connectedUserIds = new Set(
      connections
        .filter(conn => 
          conn.status === 'accepted' && 
          (conn.requester_id === profile.id || conn.recipient_id === profile.id)
        )
        .map(conn => 
          conn.requester_id === profile.id ? conn.recipient_id : conn.requester_id
        )
    );
    
    // Filter out current user and already connected users
    const availableMembers = chapterMembers.filter(member => 
      member.id !== profile.id && 
      !connectedUserIds.has(member.id)
    );
    
    // Prioritize alumni and active members, then randomly shuffle and return up to 10 for mobile
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

  const networkingSpotlight = getNetworkingSpotlight();

  const handleConnect = async (member: ChapterMemberData) => {
    if (!profile) return;
    
    setConnectionLoading(member.id);
    try {
      await sendConnectionRequest(member.id);
      console.log('Connection request sent to:', member.full_name);
      // You could show a success toast here
    } catch (error) {
      console.error('Failed to send connection request:', error);
      // You could show an error toast here
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
          <h1 className="text-xl font-semibold text-gray-900">Networking Spotlight</h1>
        </div>

        {/* Members List */}
        {networkingSpotlight.length > 0 ? (
          <div className="space-y-4">
            {networkingSpotlight.map((member) => (
              <Card key={member.id} className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-sm font-semibold shrink-0">
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
                          member.chapter_role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
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
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No new connections available</p>
            <p className="text-gray-400 text-sm">You may already be connected with everyone!</p>
          </div>
        )}
      </div>
    </div>
  );
}
