'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Paperclip } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import { logger } from "@/lib/utils/logger";

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  onTyping: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ 
  onSendMessage, 
  onTyping, 
  disabled = false, 
  placeholder = "Type a message..." 
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSend = async () => {
    if (!message.trim() || isSending || disabled) return;
    
    setIsSending(true);
    try {
      await onSendMessage(message.trim());
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      logger.error('Failed to send message:', { context: [error] });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    
    // Send typing indicator
    onTyping();
    
    // Clear previous typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMessage = message.slice(0, start) + emoji + message.slice(end);
    
    setMessage(newMessage);
    
    // Focus back to textarea and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPosition = start + emoji.length;
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  // File upload functionality
  const handleFileUpload = () => {
    logger.info('File upload is currently disabled');
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="flex items-end space-x-3">
        {/* File attachment button - HIDDEN ON MOBILE */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFileUpload}
          disabled={true}
          className="hidden md:flex text-gray-300 cursor-not-allowed p-2 h-10 w-10"
          title="File upload is currently disabled"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {/* Emoji picker */}
        <EmojiPicker
          onEmojiSelect={handleEmojiSelect}
          disabled={disabled}
        />

        {/* Message input - MOBILE OPTIMIZED */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-gray-400 placeholder:truncate"
            style={{ 
              minHeight: '44px', 
              maxHeight: '120px',
              fontSize: '16px' // Prevent zoom on iOS
            }}
            rows={1}
          />
        </div>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isSending || disabled}
          className="bg-navy-600 hover:bg-navy-700 text-white px-4 py-2 rounded-lg font-medium h-10 min-w-[80px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto" />
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send
            </>
          )}
        </Button>
      </div>

      {/* Character count - HIDDEN ON MOBILE */}
      <div className="hidden md:flex justify-end items-center mt-2 text-xs text-gray-400">
        <span>
          {message.length}/1000 characters
        </span>
        <span className="ml-4">
          Press Enter to send, Shift+Enter for new line
        </span>
      </div>
    </div>
  );
} 