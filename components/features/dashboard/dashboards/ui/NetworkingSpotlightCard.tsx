'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus } from 'lucide-react';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { useChapterMembers } from '@/lib/hooks/useChapterMembers';
import { useConnections } from '@/lib/contexts/ConnectionsContext';
import { useScopedChapterId } from '@/lib/hooks/useScopedChapterId';
import { useRouter } from 'next/navigation';
import { weightedRandomShuffle } from '@/lib/utils/weightedShuffle';
import { calculateNetworkingPriority } from '@/lib/utils/networkingSpotlight';
import { ClickableAvatar } from '@/components/features/user-profile/ClickableAvatar';
import { ClickableUserName } from '@/components/features/user-profile/ClickableUserName';
import { ConnectionRequestDialog } from '@/components/features/connections/ConnectionRequestDialog';
import type { ChapterMemberData } from '@/types/chapter';

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function seededShuffle<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  const random = seededRandom(seed);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function NetworkingSpotlightCard() {
  const { profile } = useProfile();
  const chapterId = useScopedChapterId();
  const { members: chapterMembers, loading: membersLoading } = useChapterMembers(chapterId ?? undefined);
  const { connections, sendConnectionRequest } = useConnections();
  const router = useRouter();
  const [connectionLoading, setConnectionLoading] = useState<string | null>(null);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [selectedMemberForConnection, setSelectedMemberForConnection] = useState<ChapterMemberData | null>(null);
  const [localConnectionsSnapshot, setLocalConnectionsSnapshot] = useState<Array<{ requester_id: string; recipient_id: string }>>([]);
  const [snapshotTaken, setSnapshotTaken] = useState(false);
  const [sessionSeed, setSessionSeed] = useState<number | null>(null);

  useEffect(() => {
    const storageKey = 'networking-spotlight-seed';
    const storedSeed = sessionStorage.getItem(storageKey);
    if (storedSeed) {
      setSessionSeed(parseInt(storedSeed, 10));
    } else {
      const newSeed = Math.floor(Math.random() * 1000000);
      sessionStorage.setItem(storageKey, newSeed.toString());
      setSessionSeed(newSeed);
    }
  }, []);

  useEffect(() => {
    if (profile?.id && connections.length >= 0 && !snapshotTaken) {
      setLocalConnectionsSnapshot(
        connections.map((c: { requester_id: string; recipient_id: string }) => ({
          requester_id: c.requester_id,
          recipient_id: c.recipient_id,
        }))
      );
      setSnapshotTaken(true);
    }
  }, [profile?.id, connections, snapshotTaken]);

  const networkingSpotlight = useMemo(() => {
    if (!chapterMembers || !profile || !snapshotTaken || sessionSeed === null) return [];

    const connectedUserIds = new Set(
      localConnectionsSnapshot.map((conn) =>
        conn.requester_id === profile.id ? conn.recipient_id : conn.requester_id
      )
    );

    const membersWithAvatars = chapterMembers.filter(
      (member) =>
        member.id !== profile.id &&
        !connectedUserIds.has(member.id) &&
        member.avatar_url &&
        member.avatar_url.trim() !== ''
    );

    let availableMembers = membersWithAvatars;
    if (membersWithAvatars.length < 5) {
      const membersWithoutAvatars = chapterMembers.filter(
        (member) =>
          member.id !== profile.id &&
          !connectedUserIds.has(member.id) &&
          (!member.avatar_url || member.avatar_url.trim() === '')
      );
      availableMembers = [...membersWithAvatars, ...membersWithoutAvatars];
    }

    const alumniMembers = availableMembers.filter((member) => member.role === 'alumni');
    const activeMembers = availableMembers.filter((member) => member.role === 'active_member');
    const adminMembers = availableMembers.filter((member) => member.role === 'admin');
    const otherMembers = availableMembers.filter(
      (member) =>
        member.role !== 'alumni' && member.role !== 'active_member' && member.role !== 'admin'
    );

    const shuffledAlumni = weightedRandomShuffle(alumniMembers, calculateNetworkingPriority, 0.4);
    const shuffledActive = weightedRandomShuffle(activeMembers, calculateNetworkingPriority, 0.4);
    const shuffledAdmin = weightedRandomShuffle(adminMembers, calculateNetworkingPriority, 0.4);
    const shuffledOther = weightedRandomShuffle(otherMembers, calculateNetworkingPriority, 0.4);

    const prioritizedMembers = [
      ...shuffledAlumni,
      ...shuffledActive,
      ...shuffledAdmin,
      ...shuffledOther,
    ];
    const topPool = prioritizedMembers.slice(0, Math.min(20, prioritizedMembers.length));
    if (topPool.length <= 10) return topPool;
    const shuffledPool = seededShuffle(topPool, sessionSeed);
    return shuffledPool.slice(0, 10);
  }, [chapterMembers, profile, snapshotTaken, localConnectionsSnapshot, sessionSeed]);

  const handleConnect = (member: ChapterMemberData) => {
    if (!profile) return;
    setSelectedMemberForConnection(member);
    setShowConnectionDialog(true);
  };

  const handleSendConnectionRequest = async (message?: string) => {
    if (!profile || !selectedMemberForConnection) return;
    setConnectionLoading(selectedMemberForConnection.id);
    try {
      await sendConnectionRequest(selectedMemberForConnection.id, message);
      setLocalConnectionsSnapshot((prev) => [
        ...prev,
        {
          requester_id: profile.id,
          recipient_id: selectedMemberForConnection.id,
        },
      ]);
      setShowConnectionDialog(false);
      setSelectedMemberForConnection(null);
    } catch (error) {
      console.error('Failed to send connection request:', error);
    } finally {
      setConnectionLoading(null);
    }
  };

  const handleBrowseMore = () => {
    router.push('/dashboard/alumni');
  };

  if (!chapterId) return null;

  return (
    <div className="h-full min-h-0 flex flex-col">
      <Card className="bg-white h-full min-h-0 flex flex-col overflow-hidden">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Users className="h-5 w-5 text-brand-primary" />
            <span>Networking Spotlight</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 flex-1 min-h-0 flex flex-col overflow-hidden">
          {membersLoading ? (
            <div className="text-center py-8 flex-shrink-0">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary mx-auto mb-2" />
              <p className="text-xs text-gray-500">Loading members...</p>
            </div>
          ) : networkingSpotlight.length > 0 ? (
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
                {networkingSpotlight.map((member) => (
                  <div
                    key={member.id}
                    className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      {member.id ? (
                        <ClickableAvatar
                          userId={member.id}
                          avatarUrl={member.avatar_url}
                          fullName={
                            member.full_name ||
                            `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim()
                          }
                          firstName={member.first_name}
                          lastName={member.last_name}
                          size="sm"
                          className="w-10 h-10 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-brand-primary text-sm font-semibold shrink-0">
                          {member.full_name?.charAt(0) || member.first_name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          {member.id &&
                          (member.full_name || member.first_name || member.last_name) ? (
                            <ClickableUserName
                              userId={member.id}
                              fullName={
                                member.full_name ||
                                `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim() ||
                                'Chapter Member'
                              }
                              className="font-medium text-gray-900 text-sm truncate"
                            />
                          ) : (
                            <h4 className="font-medium text-gray-900 text-sm truncate">
                              {member.full_name ||
                                `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim() ||
                                'Chapter Member'}
                            </h4>
                          )}
                          {member.role === 'alumni' && (
                            <Badge className="bg-accent-100 text-accent-800 text-xs">
                              Alumni
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-1 truncate">
                          {member.chapter_role && member.chapter_role !== 'member'
                            ? member.chapter_role
                                .replace('_', ' ')
                                .replace(/\b\w/g, (l: string) => l.toUpperCase())
                            : member.role === 'alumni'
                              ? 'Alumni'
                              : 'Member'}
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
                            className="text-brand-primary border-brand-primary hover:bg-primary-50 text-xs h-7 px-2 !rounded-full"
                          >
                            {connectionLoading === member.id ? (
                              <div className="w-3 h-3 border border-brand-primary border-t-transparent rounded-full animate-spin" />
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
              <div className="text-center py-8 text-gray-500 flex-shrink-0">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No new connections available</p>
                <p className="text-xs mt-1">You may already be connected with everyone!</p>
              </div>
            )}
            <div className="pt-4 border-t border-gray-100 flex-shrink-0">
              <Button
                variant="outline"
                className="w-full text-brand-primary border-brand-primary hover:bg-primary-50 rounded-full"
                onClick={handleBrowseMore}
              >
                Browse More Profiles
              </Button>
            </div>
        </CardContent>
      </Card>
      <ConnectionRequestDialog
        isOpen={showConnectionDialog}
        onClose={() => {
          setShowConnectionDialog(false);
          setSelectedMemberForConnection(null);
        }}
        onSend={handleSendConnectionRequest}
        recipientName={
          selectedMemberForConnection?.full_name ||
          (selectedMemberForConnection
            ? `${selectedMemberForConnection.first_name ?? ''} ${selectedMemberForConnection.last_name ?? ''}`.trim()
            : undefined)
        }
        isLoading={!!connectionLoading}
      />
    </div>
  );
}
