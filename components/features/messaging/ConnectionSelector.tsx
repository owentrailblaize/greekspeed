'use client';

import { useState, useEffect, useMemo } from 'react';
import { Connection } from '@/lib/contexts/ConnectionsContext';
import { useAuth } from '@/lib/supabase/auth-context';
import { UserAvatar } from '@/components/features/profile/UserAvatar';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ClickableAvatar } from '@/components/features/user-profile/ClickableAvatar';
import { ClickableUserName } from '@/components/features/user-profile/ClickableUserName';

interface ConnectionSelectorProps {
  connections: Connection[];
  selectedConnectionId: string | null;
  onConnectionSelect: (connectionId: string) => void;
  showLastMessage?: boolean;
}

interface LastMessage {
  connectionId: string;
  content: string;
  createdAt: string;
  senderId: string;
}

export function ConnectionSelector({
  connections,
  selectedConnectionId,
  onConnectionSelect,
  showLastMessage = true
}: ConnectionSelectorProps) {
  const { user, session } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [lastMessages, setLastMessages] = useState<Map<string, LastMessage>>(new Map());

  // Fetch last message for each connection
  useEffect(() => {
    if (!user || !session || connections.length === 0) return;

    const fetchLastMessages = async () => {
      const messagesMap = new Map<string, LastMessage>();
      
      const promises = connections.map(async (connection) => {
        try {
          const response = await fetch(`/api/messages?connectionId=${connection.id}&page=1&limit=1`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.messages && data.messages.length > 0) {
              const lastMessage = data.messages[0];
              messagesMap.set(connection.id, {
                connectionId: connection.id,
                content: lastMessage.content,
                createdAt: lastMessage.created_at,
                senderId: lastMessage.sender_id,
              });
            }
          }
        } catch (error) {
          console.error(`Failed to fetch last message for connection ${connection.id}:`, error);
        }
      });

      await Promise.all(promises);
      setLastMessages(messagesMap);
    };

    fetchLastMessages();
  }, [connections, user, session]);

  // Filter connections based on search query and status
  const filteredConnections = useMemo(() => {
    if (!user) return [];
    
    return connections.filter(connection => {
      if (connection.status !== 'accepted') {
        return false;
      }
      
      const otherUser = connection.requester_id === user.id 
        ? connection.recipient 
        : connection.requester;
      
      return otherUser.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             otherUser.chapter?.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [connections, searchQuery, user]);

  // Sort connections by last message time or connection updated_at
  const sortedConnections = useMemo(() => {
    return [...filteredConnections].sort((a, b) => {
      const lastMessageA = lastMessages.get(a.id);
      const lastMessageB = lastMessages.get(b.id);
      
      const timestampA = lastMessageA 
        ? new Date(lastMessageA.createdAt).getTime()
        : new Date(a.updated_at || a.created_at).getTime();
      
      const timestampB = lastMessageB
        ? new Date(lastMessageB.createdAt).getTime()
        : new Date(b.updated_at || b.created_at).getTime();
      
      return timestampB - timestampA;
    });
  }, [filteredConnections, lastMessages]);

  const getOtherUser = (connection: Connection) => {
    if (!user) return connection.requester;
    
    return connection.requester_id === user.id 
      ? connection.recipient 
      : connection.requester;
  };

  const getLastMessagePreview = (connection: Connection) => {
    if (!showLastMessage) return null;
    const lastMessage = lastMessages.get(connection.id);
    if (!lastMessage || !user) return 'Click to start chatting';
    
    const isFromCurrentUser = lastMessage.senderId === user.id;
    const prefix = isFromCurrentUser ? 'You: ' : '';
    return `${prefix}${lastMessage.content}`;
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Type a name or multiple names"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-primary-300"
          />
        </div>
      </div>

      {/* Suggested Section */}
      <div className="flex-1 overflow-y-auto">
        {sortedConnections.length === 0 ? (
          <div className="text-center py-8 px-4">
            {searchQuery ? (
              <>
                <p className="text-gray-500 mb-1">No connections found</p>
                <p className="text-sm text-gray-400">Try adjusting your search</p>
              </>
            ) : (
              <>
                <p className="text-gray-500 mb-1">No connections yet</p>
                <p className="text-sm text-gray-400">Connect with others to start messaging</p>
              </>
            )}
          </div>
        ) : (
          <div className="py-2">
            {sortedConnections.map((connection) => {
              const otherUser = getOtherUser(connection);
              const isSelected = selectedConnectionId === connection.id;
              const lastMessagePreview = getLastMessagePreview(connection);
              
              return (
                <div
                  key={connection.id}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-primary-50 border-r-2 border-brand-primary' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onConnectionSelect(connection.id)}
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {otherUser.id ? (
                        <ClickableAvatar
                          userId={otherUser.id}
                          avatarUrl={otherUser.avatar_url}
                          fullName={otherUser.full_name}
                          firstName={otherUser.first_name}
                          lastName={otherUser.last_name}
                          size="md"
                        />
                      ) : (
                        <UserAvatar
                          user={{ 
                            email: null, 
                            user_metadata: { 
                              avatar_url: otherUser.avatar_url, 
                              full_name: otherUser.full_name 
                            } 
                          }}
                          completionPercent={100}
                          hasUnread={false}
                          size="md"
                        />
                      )}
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          {otherUser.id ? (
                            <ClickableUserName
                              userId={otherUser.id}
                              fullName={otherUser.full_name}
                              className={`font-medium truncate ${
                                isSelected ? 'text-primary-900' : 'text-gray-900'
                              }`}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <h3 className={`font-medium truncate ${
                              isSelected ? 'text-primary-900' : 'text-gray-900'
                            }`}>
                              {otherUser.full_name}
                            </h3>
                          )}
                          {otherUser.chapter && (
                            <p className="text-sm text-gray-500 truncate">
                              {otherUser.chapter}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Last message preview */}
                      {showLastMessage && lastMessagePreview && (
                        <p className="text-xs text-gray-400 truncate mt-1">
                          {lastMessagePreview}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

