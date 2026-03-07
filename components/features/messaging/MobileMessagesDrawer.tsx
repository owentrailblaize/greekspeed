'use client';

import { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useConnections } from '@/lib/contexts/ConnectionsContext';
import { useMessages } from '@/lib/hooks/useMessages';
import { useVisualViewportHeight } from '@/lib/hooks/useVisualViewportHeight';
import { useAuth } from '@/lib/supabase/auth-context';
import { UserAvatar } from '@/components/features/profile/UserAvatar';
import { ClickableAvatar } from '@/components/features/user-profile/ClickableAvatar';
import { ClickableUserName } from '@/components/features/user-profile/ClickableUserName';

interface MobileMessagesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  connectionId: string | null;
}

export function MobileMessagesDrawer({
  isOpen,
  onClose,
  connectionId
}: MobileMessagesDrawerProps) {
  const { user } = useAuth();
  const { connections } = useConnections();

  const {
    messages,
    loading: messagesLoading,
    hasMore,
    sendMessage,
    editMessage,
    deleteMessage,
    loadMore,
    sendTypingIndicator,
    markAllAsRead
  } = useMessages(connectionId);

  const { height: visualHeight, offsetTop } = useVisualViewportHeight();
  const [innerHeight, setInnerHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 768
  );
  useEffect(() => {
    setInnerHeight(window.innerHeight);
  }, []);
  const keyboardLikelyOpen = visualHeight < innerHeight;
  const maxHeightPx = keyboardLikelyOpen ? visualHeight - 56 : undefined;
  const bottomPx =
    keyboardLikelyOpen
      ? innerHeight - (offsetTop + visualHeight)
      : undefined;

  // Get connection details
  const connection = connections.find(conn => conn.id === connectionId);
  const otherUser = connection
    ? (connection.requester_id === user?.id
        ? connection.recipient
        : connection.requester)
    : null;

  // Mark all messages as read when drawer opens
  useEffect(() => {
    if (isOpen && connectionId && user && messages.length > 0) {
      markAllAsRead();
    }
  }, [isOpen, connectionId, user, messages.length, markAllAsRead]);

  const handleSendMessage = async (content: string) => {
    if (!connectionId) return;
    try {
      await sendMessage(content, 'text');
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

  // Don't render if no connection or connection not found
  if (!connectionId || !connection || !otherUser) {
    return null;
  }

  return (
    <Drawer.Root 
      open={isOpen} 
      onOpenChange={(open) => !open && onClose()}
      direction="bottom"
      modal={true}
      dismissible={true}
    >
      <Drawer.Portal>
        {/* Overlay */}
        <Drawer.Overlay 
          className="fixed inset-0 z-[10002] bg-black/40 transition-opacity" 
        />

        {/* Drawer Content */}
        <Drawer.Content
          className="
            bg-white flex flex-col rounded-t-[10px] z-[10003]
            fixed bottom-0 left-0 right-0 
            h-[80dvh] min-h-[60dvh] max-h-[85dvh]
            shadow-2xl border border-gray-200
            outline-none p-0
          "
          style={
            maxHeightPx !== undefined || bottomPx !== undefined
              ? {
                  ...(maxHeightPx !== undefined && {
                    maxHeight: `${maxHeightPx}px`
                  }),
                  ...(bottomPx !== undefined && { bottom: `${bottomPx}px` })
                }
              : undefined
          }
        >
          {/* Mobile drag handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300 mt-3 mb-4" />

          {/* Header */}
          <div className="flex-shrink-0 border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
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
                  <Drawer.Title className="sr-only">
                    Messages with {otherUser.full_name}
                  </Drawer.Title>
                  {otherUser.id ? (
                    <ClickableUserName
                      userId={otherUser.id}
                      fullName={otherUser.full_name}
                      className="font-medium text-gray-900"
                    />
                  ) : (
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

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

          {/* Message Input */}
          <div className="flex-shrink-0 border-t border-gray-200 bg-white">
            <MessageInput
              onSendMessage={handleSendMessage}
              onTyping={sendTypingIndicator}
              disabled={messagesLoading}
              placeholder="Type a message..."
            />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

