'use client';

import { useState } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Message } from '@/lib/hooks/useMessages';

interface ChatWindowProps {
  messages: Message[];
  loading: boolean;
  hasMore: boolean;
  onSendMessage: (content: string) => Promise<void>;
  onEditMessage: (messageId: string, newContent: string) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
  onLoadMore: () => void;
  typingUsers: string[];
  disabled?: boolean;
}

export function ChatWindow({
  messages,
  loading,
  hasMore,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onLoadMore,
  typingUsers,
  disabled = false
}: ChatWindowProps) {
  const handleTyping = () => {
    // This function is called when user types
    // Could be used for additional typing logic in the future
  };

  const getTypingText = () => {
    if (typingUsers.length === 0) return '';
    
    if (typingUsers.length === 1) {
      return `${typingUsers[0]} is typing...`;
    }
    
    if (typingUsers.length === 2) {
      return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
    }
    
    return 'Several people are typing...';
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-900">Chat</span>
          </div>
          
          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-navy-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-navy-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-navy-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-xs text-gray-500">{getTypingText()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          onEditMessage={onEditMessage}
          onDeleteMessage={onDeleteMessage}
        />
      </div>

      {/* Message input */}
      <MessageInput
        onSendMessage={onSendMessage}
        onTyping={handleTyping}
        disabled={disabled}
        placeholder="Type a message..."
      />
    </div>
  );
} 