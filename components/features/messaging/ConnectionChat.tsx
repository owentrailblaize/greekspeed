'use client';

import { useState, useEffect } from 'react';
import { useMessages } from '@/lib/hooks/useMessages';
import { useConnections, Connection } from '@/lib/contexts/ConnectionsContext';
import { useAuth } from '@/lib/supabase/auth-context';
import { ChatWindow } from './ChatWindow';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/features/profile/UserAvatar';
import { ArrowLeft, Phone, Video, MoreHorizontal } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

interface ConnectionChatProps {
  connectionId: string;
  onBack?: () => void;
  className?: string;
}

export function ConnectionChat({ connectionId, onBack, className = '' }: ConnectionChatProps) {
  const { user } = useAuth();
  const { connections } = useConnections();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [hasSharedProfile, setHasSharedProfile] = useState(false);
  
  // State declarations must come before useEffect hooks that reference them
  const [connection, setConnection] = useState<Connection | null>(null);
  const [otherUser, setOtherUser] = useState<{
    id: string;
    full_name: string;
    first_name: string | null;
    last_name: string | null;
    chapter: string | null;
    avatar_url: string | null;
  } | null>(null);

  const {
    messages,
    loading,
    error,
    hasMore,
    typingUsers,
    sendMessage,
    editMessage,
    deleteMessage,
    loadMore,
    markAllAsRead, // Add this
    refreshMessages
  } = useMessages(connectionId);

  // Mark all messages as read when chat opens
  useEffect(() => {
    if (connectionId && user && messages.length > 0) {
      markAllAsRead();
    }
  }, [connectionId, user, messages.length, markAllAsRead]);

  // Handle profile sharing from URL params
  useEffect(() => {
    const shareProfileId = searchParams.get('shareProfile');
    const profileType = searchParams.get('profileType');
    
    if (shareProfileId && profileType && connection && connection.status === 'accepted' && !hasSharedProfile && !loading) {
      const shareProfile = async () => {
        try {
          // Determine profile type ('member' or 'alumni')
          const messageType = profileType === 'alumni' ? 'alumni' : 'member';
          
          await sendMessage(
            `Check out this profile!`,
            'profile',
            {
              shared_profile_id: shareProfileId,
              shared_profile_type: messageType
            }
          );
          
          setHasSharedProfile(true);
          // Clean up URL params after sharing
          router.replace('/dashboard/messages');
        } catch (error) {
          console.error('Failed to share profile:', error);
        }
      };
      
      shareProfile();
    }
  }, [searchParams, connection, connectionId, hasSharedProfile, loading, sendMessage, router]);

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
    // #region agent log
    const handleSendId = `handle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'ConnectionChat.tsx:105', message: 'handleSendMessage called', data: { handleSendId, contentLength: content.length, contentPreview: content.substring(0, 30), connectionId, connectionStatus: connection?.status }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }) }).catch(() => { });
    // #endregion
    
    try {
      // Check connection status before sending
      if (connection && connection.status !== 'accepted') {
        throw new Error('This connection request has not been accepted yet. Please wait for the other person to accept your connection request.');
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'ConnectionChat.tsx:112', message: 'Calling sendMessage from hook', data: { handleSendId, contentPreview: content.substring(0, 30) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }) }).catch(() => { });
      // #endregion
      
      await sendMessage(content);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'ConnectionChat.tsx:115', message: 'sendMessage completed', data: { handleSendId }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }) }).catch(() => { });
      // #endregion
    } catch (error) {
      console.error('Failed to send message:', error);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'ConnectionChat.tsx:120', message: 'handleSendMessage error', data: { handleSendId, error: error instanceof Error ? error.message : 'Unknown error' }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }) }).catch(() => { });
      // #endregion
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      // You could show a toast notification here with errorMessage
      // For now, we'll let the error propagate to show in the UI
      throw error;
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

  // Add debug logging (remove after fixing)
  useEffect(() => {
    if (messages.length > 0) {
      console.log('Message sender data:', messages[0].sender);
      console.log('Avatar URL:', messages[0].sender?.avatar_url);
    }
  }, [messages]);


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
              onClick={() => refreshMessages()}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white"
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
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
        onBack={onBack}
        contactName={otherUser?.full_name || 'Contact'}
        contactAvatarUrl={otherUser?.avatar_url || null}
        contactFullName={otherUser?.full_name || 'Contact'}
        contactUserId={otherUser?.id || null}
        contactFirstName={otherUser?.first_name || null}
        contactLastName={otherUser?.last_name || null}
      />
    </div>
  );
} 