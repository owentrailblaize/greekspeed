'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Paperclip } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';

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
      console.error('Failed to send message:', error);
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
    console.log('File upload is currently disabled');
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="border-t border-gray-200 bg-white p-3 md:p-4">
      {/* Main input row - all elements perfectly aligned */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* File attachment button - HIDDEN ON MOBILE */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFileUpload}
          disabled={true}
          className="hidden md:flex text-gray-300 cursor-not-allowed p-2 h-10 w-10 flex-shrink-0"
          title="File upload is currently disabled"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {/* Emoji picker - perfectly aligned */}
        <div className="flex-shrink-0">
          <EmojiPicker
            onEmojiSelect={handleEmojiSelect}
            disabled={disabled}
          />
        </div>

        {/* Message input container - rounded-full with modern styling */}
        <div className="flex-1 relative min-w-0">
          <div className="rounded-full bg-white/80 backdrop-blur-md border border-navy-500/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 transition-all duration-300 flex items-center px-3 md:px-4">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInput}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full resize-none bg-transparent border-0 focus:outline-none text-sm md:text-base text-navy-700 placeholder:text-gray-400 disabled:text-gray-400 disabled:cursor-not-allowed py-2.5 md:py-2 pr-2"
              style={{ 
                minHeight: '40px',
                maxHeight: '120px',
                fontSize: '16px', // Prevent zoom on iOS
                lineHeight: '1.5'
              }}
              rows={1}
            />
          </div>
        </div>

        {/* Send button - perfectly aligned */}
        <div className="flex-shrink-0">
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isSending || disabled}
            className="rounded-full bg-white/80 backdrop-blur-md border border-navy-500/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-navy-700 hover:text-navy-900 px-3 md:px-4 py-2 font-medium h-10 min-w-[60px] md:min-w-[80px] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/80 flex items-center justify-center gap-1.5"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-navy-600" />
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Send</span>
              </>
            )}
          </Button>
        </div>
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