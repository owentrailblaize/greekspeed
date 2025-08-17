'use client';

import { useState, useEffect } from 'react';
import { useMessages } from '@/lib/hooks/useMessages';
import { useConnections, Connection } from '@/lib/hooks/useConnections';
import { useAuth } from '@/lib/supabase/auth-context';
import { ChatWindow } from './ChatWindow';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';
import { ArrowLeft, Phone, Video, MoreHorizontal } from 'lucide-react';

interface ConnectionChatProps {
  connectionId: string;
  onBack?: () => void;
  className?: string;
}

export function ConnectionChat({ connectionId, onBack, className = '' }: ConnectionChatProps) {
  const { user } = useAuth();
  const { connections } = useConnections();
  const {
    messages,
    loading,
    error,
    hasMore,
    typingUsers,
    sendMessage,
    editMessage,
    deleteMessage,
    loadMore
  } = useMessages(connectionId);

  const [connection, setConnection] = useState<Connection | null>(null);
  const [otherUser, setOtherUser] = useState<{
    id: string;
    full_name: string;
    first_name: string | null;
    last_name: string | null;
    chapter: string | null;
    avatar_url: string | null;
  } | null>(null);

  // Find connection and other user details
  useEffect(() => {
    if (connections.length > 0 && user) {
      const foundConnection = connections.find(conn => conn.id === connectionId);
      if (foundConnection) {
        setConnection(foundConnection);
        
        // Determine which user is the other person
        const isRequester = foundConnection.requester_id === user.id;
        const otherUserData = isRequester ? foundConnection.recipient : foundConnection.requester;
        setOtherUser(otherUserData);
      }
    }
  }, [connections, connectionId, user]);

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content);
    } catch (error) {
      console.error('Failed to send message:', error);
      // You could show a toast notification here
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      await editMessage(messageId, newContent);
    } catch (error) {
      console.error('Failed to edit message:', error);
      // You could show a toast notification here
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
      // You could show a toast notification here
    }
  };

  const handleLoadMore = () => {
    loadMore();
  };



  if (error) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-600 text-lg font-medium mb-2">Error loading chat</p>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-navy-600 hover:bg-navy-700 text-white"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!connection || !otherUser) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <ChatWindow
        messages={messages}
        loading={loading}
        hasMore={hasMore}
        onSendMessage={handleSendMessage}
        onEditMessage={handleEditMessage}
        onDeleteMessage={handleDeleteMessage}
        onLoadMore={handleLoadMore}
        typingUsers={[]}
        disabled={loading}
        // 🔴 NEW: Pass navigation props
        onBack={onBack}
        contactName={otherUser?.full_name || 'Contact'}
      />
    </div>
  );
} 