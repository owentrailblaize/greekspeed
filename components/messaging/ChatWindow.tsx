'use client';

import { useState } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Message } from '@/lib/hooks/useMessages';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

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
  onBack?: () => void;
  contactName?: string;
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
  disabled = false,
  onBack,
  contactName = "Contact"
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
    // 🔴 FIXED: Use h-full and flex flex-col for full height
    <div className="h-full flex flex-col bg-white">
      {/* Chat header - fixed height */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Back Button */}
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="p-2 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            {/* Contact Info */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">U</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{contactName}</h3>
              </div>
            </div>
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

      {/* Messages area - flex-1 to fill remaining space */}
      <div className="flex-1 overflow-hidden min-h-0">
        <MessageList
          messages={messages}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          onEditMessage={onEditMessage}
          onDeleteMessage={onDeleteMessage}
        />
      </div>

      {/* Message input - fixed at bottom */}
      <div className="flex-shrink-0 border-t border-gray-200">
        <MessageInput
          onSendMessage={onSendMessage}
          onTyping={handleTyping}
          disabled={disabled}
          placeholder="Type a message..."
        />
      </div>
    </div>
  );
} 