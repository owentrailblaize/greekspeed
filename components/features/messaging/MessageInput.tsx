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
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Max height for mobile (larger) and desktop
  const MAX_HEIGHT_MOBILE = 180; // Increased for mobile
  const MAX_HEIGHT_DESKTOP = 150;

  const handleSend = async () => {
    if (!message.trim() || isSending || disabled) return;
    
    setIsSending(true);
    try {
      await onSendMessage(message.trim());
      setMessage('');
      setIsExpanded(false);
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
    const inputValue = e.target.value;
    
    // Enforce character limit (1000 characters)
    if (inputValue.length > 1000) {
      return; // Don't update if over limit
    }
    
    setMessage(inputValue);
    
    // Auto-resize textarea
    const textarea = e.target;
    const isMobile = window.innerWidth < 768;
    const maxHeight = isMobile ? MAX_HEIGHT_MOBILE : MAX_HEIGHT_DESKTOP;
    
    // Reset height to calculate scrollHeight
    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(scrollHeight, maxHeight);
    
    // Set new height
    textarea.style.height = `${newHeight}px`;
    
    // Determine if we should be in expanded mode (more than 2 lines)
    // Roughly 2 lines = ~80px (40px per line with padding)
    const shouldExpand = scrollHeight > 80;
    setIsExpanded(shouldExpand);
    
    // Enable scrolling if at max height
    if (scrollHeight > maxHeight) {
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.overflowY = 'hidden';
    }
    
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
    
    // Trigger input event to recalculate height
    const event = new Event('input', { bubbles: true });
    Object.defineProperty(event, 'target', { value: textarea, enumerable: true });
    textarea.dispatchEvent(event);
    
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

  // Reset expanded state when message is cleared
  useEffect(() => {
    if (!message.trim()) {
      setIsExpanded(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.overflowY = 'hidden';
      }
    }
  }, [message]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Determine border radius based on expansion state
  const borderRadiusClass = isExpanded 
    ? 'rounded-2xl' // Rounded rectangle for longer messages
    : 'rounded-full'; // Pill shape for short messages

  // Determine alignment based on expansion
  const containerAlignClass = isExpanded 
    ? 'items-start' // Align to top when expanded
    : 'items-center'; // Center align when compact

  return (
    <div className="border-t border-gray-200 bg-white p-3 md:p-4">
      {/* Main input row - all elements perfectly aligned */}
      <div className={`flex ${containerAlignClass} gap-2 md:gap-3`}>
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
        <div className="flex-shrink-0 pt-0.5">
          <EmojiPicker
            onEmojiSelect={handleEmojiSelect}
            disabled={disabled}
          />
        </div>

        {/* Message input container - dynamically styled based on expansion */}
        <div className="flex-1 relative min-w-0">
          <div className={`${borderRadiusClass} bg-white/80 backdrop-blur-md border border-navy-500/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 transition-all duration-300 flex ${isExpanded ? 'items-start' : 'items-center'} px-3 md:px-4 ${isExpanded ? 'py-2' : 'py-1'}`}>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInput}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full resize-none bg-transparent border-0 focus:outline-none text-sm md:text-base text-slate-700 placeholder:text-gray-400 disabled:text-gray-400 disabled:cursor-not-allowed pr-2 overflow-y-auto scrollbar-thin scrollbar-thumb-navy-300 scrollbar-track-transparent"
              style={{ 
                minHeight: isExpanded ? '40px' : '36px',
                height: isExpanded ? 'auto' : '36px',
                maxHeight: `${window.innerWidth < 768 ? MAX_HEIGHT_MOBILE : MAX_HEIGHT_DESKTOP}px`,
                fontSize: '16px', // Prevent zoom on iOS
                lineHeight: '1.5',
                overflowY: 'hidden', // Will be set to 'auto' when needed
                padding: '0',
                margin: '0',
                verticalAlign: 'bottom',
                display: 'block'
              }}
              rows={1}
            />
          </div>
        </div>

        {/* Send button - perfectly aligned */}
        <div className="flex-shrink-0 pt-0.5">
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
    </div>
  );
} 