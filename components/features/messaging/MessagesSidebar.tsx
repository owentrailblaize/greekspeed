'use client';

import { useState, useEffect, useMemo } from 'react';
import { Connection } from '@/lib/contexts/ConnectionsContext';
import { useAuth } from '@/lib/supabase/auth-context';
import { UserAvatar } from '@/components/features/profile/UserAvatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MessageSquare, Menu } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MessagesSidebarProps {
  connections: Connection[];
  loading: boolean;
  selectedConnectionId: string | null;
  onConnectionSelect: (connectionId: string) => void;
  onMobileMenuToggle?: () => void;
  isMobile?: boolean;
  isMainView?: boolean;
}

interface LastMessage {
  connectionId: string;
  content: string;
  createdAt: string;
  senderId: string;
}

export function MessagesSidebar({
  connections,
  loading,
  selectedConnectionId,
  onConnectionSelect,
  onMobileMenuToggle,
  isMobile = false,
  isMainView = false
}: MessagesSidebarProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [lastMessages, setLastMessages] = useState<Map<string, LastMessage>>(new Map());

  // Fetch last message for each connection
  useEffect(() => {
    if (!user || connections.length === 0) return;

    const fetchLastMessages = async () => {
      const messagesMap = new Map<string, LastMessage>();
      
      // Fetch last message for each connection in parallel
      const promises = connections.map(async (connection) => {
        try {
          const response = await fetch(`/api/messages?connectionId=${connection.id}&page=1&limit=1`);
          if (response.ok) {
            const data = await response.json();
            if (data.messages && data.messages.length > 0) {
              const lastMessage = data.messages[0]; // Most recent message (first in descending order)
              messagesMap.set(connection.id, {
                connectionId: connection.id,
                content: lastMessage.content,
                createdAt: lastMessage.created_at,
                senderId: lastMessage.sender_id
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
  }, [connections, user]);

  // Filter connections based on search query and status
  const filteredConnections = useMemo(() => {
    if (!user) return [];
    
    return connections.filter(connection => {
      // Only show accepted connections in messages
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
      
      // Get timestamp for comparison
      const timestampA = lastMessageA 
        ? new Date(lastMessageA.createdAt).getTime()
        : new Date(a.updated_at || a.created_at).getTime();
      
      const timestampB = lastMessageB
        ? new Date(lastMessageB.createdAt).getTime()
        : new Date(b.updated_at || b.created_at).getTime();
      
      // Sort descending (most recent first)
      return timestampB - timestampA;
    });
  }, [filteredConnections, lastMessages]);

  const getOtherUser = (connection: Connection) => {
    if (!user) return connection.requester;
    
    return connection.requester_id === user.id 
      ? connection.recipient 
      : connection.requester;
  };

  const getLastActivity = (connection: Connection) => {
    const lastMessage = lastMessages.get(connection.id);
    if (lastMessage) {
      return lastMessage.createdAt;
    }
    return connection.updated_at || connection.created_at;
  };

  const getLastMessagePreview = (connection: Connection) => {
    const lastMessage = lastMessages.get(connection.id);
    if (!lastMessage || !user) return 'Click to start chatting';
    
    const isFromCurrentUser = lastMessage.senderId === user.id;
    const prefix = isFromCurrentUser ? 'You: ' : '';
    return `${prefix}${lastMessage.content}`;
  };

  // Early return if no user
  if (!user) {
    return (
      <div className={`${isMainView ? 'w-full' : 'w-80'} bg-gray-50 ${isMainView ? '' : 'border-r border-gray-200'} flex flex-col h-full min-h-0`}>
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
          {!isMainView && <h2 className="text-lg font-semibold text-gray-900">Messages</h2>}
        </div>
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Loading user...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isMainView ? 'w-full' : 'w-80'} bg-gray-50 ${isMainView ? '' : 'border-r border-gray-200'} flex flex-col h-full`}>
      {/* Header - Only show if not main view on mobile */}
      {!isMainView && (
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            {/* Only show menu toggle on desktop when sidebar can be collapsed */}
            {!isMobile && onMobileMenuToggle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMobileMenuToggle}
                className="p-2 hover:bg-gray-100"
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Search */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search connections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-navy-300"
            />
          </div>
        </div>
      )}

      {/* Search bar for main view on mobile */}
      {isMainView && (
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search connections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-navy-300"
            />
          </div>
        </div>
      )}

      {/* Connections List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy-600"></div>
            <span className="ml-2 text-gray-500">Loading...</span>
          </div>
        ) : sortedConnections.length === 0 ? (
          <div className="text-center py-8 px-4">
            {searchQuery ? (
              <>
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No connections found</p>
                <p className="text-sm text-gray-400">Try adjusting your search</p>
              </>
            ) : (
              <>
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No connections yet</p>
                <p className="text-sm text-gray-400">Connect with alumni to start messaging</p>
              </>
            )}
          </div>
        ) : (
          <div className="py-2">
            {sortedConnections.map((connection) => {
              const otherUser = getOtherUser(connection);
              const isSelected = selectedConnectionId === connection.id;
              const lastActivity = getLastActivity(connection);
              const lastMessagePreview = getLastMessagePreview(connection);
              
              return (
                <div
                  key={connection.id}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-navy-50 border-r-2 border-navy-600' 
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => onConnectionSelect(connection.id)}
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
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
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium truncate ${
                          isSelected ? 'text-navy-900' : 'text-gray-900'
                        }`}>
                          {otherUser.full_name}
                        </h3>
                        {lastActivity && (
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {formatDistanceToNow(new Date(lastActivity), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-500 truncate">
                        {otherUser.chapter || 'Chapter not specified'}
                      </p>
                      
                      {/* Last message preview */}
                      <p className="text-xs text-gray-400 truncate mt-1">
                        {lastMessagePreview}
                      </p>
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