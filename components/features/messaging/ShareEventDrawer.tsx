'use client';

import { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { Button } from '@/components/ui/button';
import { X, ArrowLeft, Calendar } from 'lucide-react';
import { ConnectionSelector } from './ConnectionSelector';
import { MessageList } from './MessageList';
import { MessageInputWithEventLink } from './MessageInputWithEventLink';
import { useConnections } from '@/lib/contexts/ConnectionsContext';
import { useMessages } from '@/lib/hooks/useMessages';
import { useAuth } from '@/lib/supabase/auth-context';
import { UserAvatar } from '@/components/features/profile/UserAvatar';
import { ClickableAvatar } from '@/components/features/user-profile/ClickableAvatar';
import { ClickableUserName } from '@/components/features/user-profile/ClickableUserName';
import { generateEventLink } from '@/lib/utils/eventLinkUtils';

interface ShareEventDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  eventToShare: {
    id: string;
    title: string;
    location?: string;
    start_time: string;
  };
}

export function ShareEventDrawer({
  isOpen,
  onClose,
  eventToShare
}: ShareEventDrawerProps) {
  const { user } = useAuth();
  const { connections } = useConnections();
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [eventLink, setEventLink] = useState('');
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

  // Generate event link when drawer opens or event changes
  useEffect(() => {
    if (isOpen && eventToShare.id) {
      const link = generateEventLink(eventToShare.id, null, { ref: 'share' });
      setEventLink(link);
    }
  }, [isOpen, eventToShare.id]);

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
    messageType: 'text' | 'event' = 'text',
    metadata?: Record<string, unknown>
  ) => {
    if (!selectedConnectionId) return;

    try {
      // Send event messages with proper type and metadata
      if (messageType === 'event' && metadata) {
        await sendMessage(content, 'event', metadata);
      } else {
        await sendMessage(content, 'text');
      }
    } catch (error) {
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

  // Format date for display
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      direction="bottom"
      modal={isMobile}
      dismissible={true}
    >
      <Drawer.Portal>
        {/* Overlay */}
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
              ? 'left-0 right-0 max-h-[70vh]'
              : 'right-4 left-auto w-[450px] h-[600px] max-h-[calc(100vh-2rem)] rounded-lg'
            }
            shadow-2xl border border-gray-200
            outline-none p-0
          `}
        >
          {/* Mobile drag handle */}
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
                  {selectedConnectionId ? otherUser?.full_name || 'Message' : 'Share Event'}
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

          {/* Event Preview Card (shown before selecting connection) */}
          {!selectedConnectionId && (
            <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-brand-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {eventToShare.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatEventDate(eventToShare.start_time)}
                  </p>
                  {eventToShare.location && (
                    <p className="text-xs text-gray-500 truncate">
                      {eventToShare.location}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

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

                {/* Message Input with Event Link */}
                <MessageInputWithEventLink
                  onSendMessage={handleSendMessage}
                  onTyping={sendTypingIndicator}
                  disabled={messagesLoading}
                  placeholder="Add a message..."
                  eventLink={eventLink}
                  eventInfo={{
                    id: eventToShare.id,
                    title: eventToShare.title,
                    location: eventToShare.location,
                    start_time: eventToShare.start_time,
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

