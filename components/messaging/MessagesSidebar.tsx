'use client';

import { useState } from 'react';
import { Connection } from '@/lib/hooks/useConnections';
import { useAuth } from '@/lib/supabase/auth-context';
import { UserAvatar } from '@/components/UserAvatar';
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
}

export function MessagesSidebar({
  connections,
  loading,
  selectedConnectionId,
  onConnectionSelect,
  onMobileMenuToggle,
  isMobile = false
}: MessagesSidebarProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter connections based on search query
  const filteredConnections = connections.filter(connection => {
    if (!user) return false;
    
    const otherUser = connection.requester_id === user.id 
      ? connection.recipient 
      : connection.requester;
    
    return otherUser.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           otherUser.chapter?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getOtherUser = (connection: Connection) => {
    if (!user) return connection.requester;
    
    return connection.requester_id === user.id 
      ? connection.recipient 
      : connection.requester;
  };

  const getLastActivity = (connection: Connection) => {
    // For now, we'll use the connection updated_at as last activity
    // In a real implementation, you might want to track last message time
    return connection.updated_at;
  };

  // Early return if no user
  if (!user) {
    return (
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-full min-h-0">
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
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
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
          {isMobile && onMobileMenuToggle && (
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

      {/* Connections List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy-600"></div>
            <span className="ml-2 text-gray-500">Loading...</span>
          </div>
        ) : filteredConnections.length === 0 ? (
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
            {filteredConnections.map((connection) => {
              const otherUser = getOtherUser(connection);
              const isSelected = selectedConnectionId === connection.id;
              const lastActivity = getLastActivity(connection);
              
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
                      
                      {/* Last message preview - placeholder for now */}
                      <p className="text-xs text-gray-400 truncate mt-1">
                        Click to start chatting
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