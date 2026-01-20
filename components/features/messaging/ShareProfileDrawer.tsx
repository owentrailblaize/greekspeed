'use client';

import { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { Button } from '@/components/ui/button';
import { X, ArrowLeft } from 'lucide-react';
import { ConnectionSelector } from './ConnectionSelector';
import { MessageList } from './MessageList';
import { MessageInputWithProfileLink } from './MessageInputWithProfileLink';
import { useConnections } from '@/lib/contexts/ConnectionsContext';
import { useMessages } from '@/lib/hooks/useMessages';
import { useAuth } from '@/lib/supabase/auth-context';
import { UserAvatar } from '@/components/features/profile/UserAvatar';
import { ClickableAvatar } from '@/components/features/user-profile/ClickableAvatar';
import { ClickableUserName } from '@/components/features/user-profile/ClickableUserName';

interface ShareProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profileToShare: {
    id: string;
    type: 'member' | 'alumni';
    name: string;
    avatarUrl?: string;
  };
}

export function ShareProfileDrawer({
  isOpen,
  onClose,
  profileToShare
}: ShareProfileDrawerProps) {
  const { user } = useAuth();
  const { connections } = useConnections();
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [profileLink, setProfileLink] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile for responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const {
    messages,
    loading: messagesLoading,
    hasMore,
    sendMessage,
    editMessage,
    deleteMessage,
    loadMore,
    sendTypingIndicator
  } = useMessages(selectedConnectionId);

  // Generate profile link when drawer opens or profile changes
  useEffect(() => {
    if (isOpen && profileToShare.id) {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const link = `${baseUrl}/dashboard/profile/${profileToShare.id}`;
      setProfileLink(link);
    }
  }, [isOpen, profileToShare.id]);

  // Reset selected connection when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedConnectionId(null);
    }
  }, [isOpen]);

  // Get selected connection details
  const selectedConnection = connections.find(conn => conn.id === selectedConnectionId);
  const otherUser = selectedConnection
    ? (selectedConnection.requester_id === user?.id
        ? selectedConnection.recipient
        : selectedConnection.requester)
    : null;

  // Filter to only accepted connections
  const acceptedConnections = connections.filter(conn => conn.status === 'accepted');

  const handleConnectionSelect = (connectionId: string) => {
    setSelectedConnectionId(connectionId);
  };

  const handleBackToConnections = () => {
    setSelectedConnectionId(null);
  };

  const handleSendMessage = async (
    content: string,
    messageType: 'text' | 'profile' = 'text',
    metadata?: Record<string, unknown>
  ) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9b79d5f7-95d0-4f63-a221-cc92278c376d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShareProfileDrawer.tsx:84',message:'handleSendMessage called',data:{hasConnectionId:!!selectedConnectionId,selectedConnectionId,content:content.substring(0,50),messageType,metadata,metadataStringified:JSON.stringify(metadata)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (!selectedConnectionId) return;
    
    try {
      if (messageType === 'profile') {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/9b79d5f7-95d0-4f63-a221-cc92278c376d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShareProfileDrawer.tsx:93',message:'Calling sendMessage with profile type',data:{content:content.substring(0,50),messageType:'profile',metadata},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        await sendMessage(content, 'profile', metadata);
      } else {
        await sendMessage(content, 'text');
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/9b79d5f7-95d0-4f63-a221-cc92278c376d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShareProfileDrawer.tsx:104',message:'handleSendMessage error',data:{error:error instanceof Error?error.message:String(error),errorStack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      await editMessage(messageId, newContent);
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  return (
    <Drawer.Root 
      open={isOpen} 
      onOpenChange={(open) => !open && onClose()}
      direction="bottom"
      modal={isMobile} // Modal on mobile (blocking), non-modal on desktop (allows background interaction)
      dismissible={true}
    >
      <Drawer.Portal>
        {/* Overlay - Minimal on desktop, visible on mobile */}
        <Drawer.Overlay 
          className={`
            fixed inset-0 z-[10002] 
            ${isMobile ? 'bg-black/40' : 'bg-black/5'} 
            transition-opacity
          `} 
        />

        {/* Drawer Content */}
        <Drawer.Content
          className={`
            bg-white flex flex-col rounded-t-[10px] z-[10003]
            fixed bottom-0
            ${isMobile 
              ? 'left-0 right-0 h-[85vh] max-h-[85vh]' 
              : 'right-4 left-auto w-[450px] h-[600px] max-h-[calc(100vh-2rem)] rounded-lg'
            }
            shadow-2xl border border-gray-200
            outline-none p-0
          `}
        >
          {/* Mobile drag handle - hidden on desktop */}
          {isMobile && (
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300 mt-3 mb-4" />
          )}

          {/* Header */}
          <div className="flex-shrink-0 border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {selectedConnectionId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToConnections}
                    className="h-8 w-8 p-0 -ml-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <Drawer.Title className="text-lg font-semibold text-gray-900">
                  {selectedConnectionId ? otherUser?.full_name || 'Message' : 'New message'}
                </Drawer.Title>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {!selectedConnectionId ? (
            // Stage 1: Connection Selection
            <ConnectionSelector
              connections={acceptedConnections}
              selectedConnectionId={null}
              onConnectionSelect={handleConnectionSelect}
              showLastMessage={true}
            />
          ) : (
            // Stage 2: Message Composer
            <div className="flex-1 flex flex-col min-h-0">
              {/* Message Header with Connection Info */}
              {otherUser && (
                <div className="flex-shrink-0 border-b border-gray-200 px-4 py-3 bg-white">
                  <div className="flex items-center space-x-3">
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
                    <div className="flex-1 min-w-0">
                      {otherUser.id ? (
                        <ClickableUserName
                          userId={otherUser.id}
                          fullName={otherUser.full_name}
                          className="font-medium text-gray-900"
                        />
                      ) : (
                        <h3 className="font-medium text-gray-900">
                          {otherUser.full_name}
                        </h3>
                      )}
                      {otherUser.chapter && (
                        <p className="text-sm text-gray-500">
                          {otherUser.chapter}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Messages List */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <MessageList
                  messages={messages}
                  loading={messagesLoading}
                  hasMore={hasMore}
                  onLoadMore={loadMore}
                  onEditMessage={handleEditMessage}
                  onDeleteMessage={handleDeleteMessage}
                />
              </div>

              {/* Message Input with Profile Link */}
              <MessageInputWithProfileLink
                onSendMessage={handleSendMessage}
                onTyping={sendTypingIndicator}
                disabled={messagesLoading}
                placeholder="Type a message..."
                profileLink={profileLink}
                profileInfo={{
                  id: profileToShare.id,
                  name: profileToShare.name,
                  avatarUrl: profileToShare.avatarUrl,
                  type: profileToShare.type
                }}
              />
            </div>
          )}
        </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

