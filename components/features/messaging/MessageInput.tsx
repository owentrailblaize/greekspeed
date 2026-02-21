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
  const lastSentContentRef = useRef<string>('');
  const lastSentTimeRef = useRef<number>(0);
  
  // Max height for mobile (larger) and desktop - increased for better long message handling
  const MAX_HEIGHT_MOBILE = 200; // Increased from 180
  const MAX_HEIGHT_DESKTOP = 250; // Increased from 150 (more reasonable for long messages)

  const handleSend = async () => {
    if (!message.trim() || isSending || disabled) return;
    
    const trimmedMessage = message.trim();
    const now = Date.now();
    
    // CRITICAL: Prevent duplicate sends within 2 seconds with same content
    if (lastSentContentRef.current === trimmedMessage && (now - lastSentTimeRef.current) < 2000) {
      return;
    }
    
    // Track this send attempt
    lastSentContentRef.current = trimmedMessage;
    lastSentTimeRef.current = now;
    
    setIsSending(true);
    try {
      await onSendMessage(trimmedMessage);
      
      setMessage('');
      setIsExpanded(false);
      // Reset textarea height and scroll position
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.scrollTop = 0;
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
    
    // CRITICAL: Always set height, but cap at maxHeight when content exceeds it
    // This ensures the textarea maintains max height and shows scrollbar (like ChatGPT)
    if (scrollHeight > maxHeight) {
      // Content exceeds max height - maintain max height and enable scrolling
      textarea.style.height = `${maxHeight}px`;
      textarea.style.overflowY = 'auto';
      setIsExpanded(true); // Ensure expanded state is maintained
      
      // Auto-scroll to cursor position to keep it visible
      requestAnimationFrame(() => {
        const cursorPosition = textarea.selectionStart;
        const textBeforeCursor = inputValue.substring(0, cursorPosition);
        const computedStyle = window.getComputedStyle(textarea);
        
        // Create a temporary element to measure text height up to cursor
        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = `
          visibility: hidden;
          position: absolute;
          width: ${textarea.offsetWidth}px;
          height: auto;
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: ${computedStyle.fontFamily};
          font-size: ${computedStyle.fontSize};
          font-weight: ${computedStyle.fontWeight};
          line-height: ${computedStyle.lineHeight};
          padding: ${computedStyle.padding};
          border: ${computedStyle.border};
          box-sizing: ${computedStyle.boxSizing};
        `;
        tempDiv.textContent = textBeforeCursor;
        document.body.appendChild(tempDiv);
        
        const textHeight = tempDiv.offsetHeight;
        document.body.removeChild(tempDiv);
        
        // Scroll to keep cursor visible (with some padding)
        const scrollTop = textHeight - (maxHeight / 2);
        if (scrollTop > 0) {
          textarea.scrollTop = scrollTop;
        }
      });
    } else {
      // Content fits within max height - grow naturally
      textarea.style.height = `${scrollHeight}px`;
      textarea.style.overflowY = 'hidden';
      textarea.scrollTop = 0; // Reset scroll when not needed
      
      // Determine if we should be in expanded mode (more than 2 lines)
      const shouldExpand = scrollHeight > 80;
      setIsExpanded(shouldExpand);
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
    
    // Manually trigger height recalculation after state update
    setTimeout(() => {
      if (textarea) {
        const isMobile = window.innerWidth < 768;
        const maxHeight = isMobile ? MAX_HEIGHT_MOBILE : MAX_HEIGHT_DESKTOP;
        
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        
        if (scrollHeight > maxHeight) {
          textarea.style.height = `${maxHeight}px`;
          textarea.style.overflowY = 'auto';
          setIsExpanded(true);
        } else {
          textarea.style.height = `${scrollHeight}px`;
          textarea.style.overflowY = 'hidden';
          setIsExpanded(scrollHeight > 80);
        }
        
        textarea.focus();
        const newCursorPosition = start + emoji.length;
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      }
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
        textareaRef.current.scrollTop = 0;
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
    <div className="border-t border-gray-200 bg-white p-2 md:p-4">
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
          <div className={`${borderRadiusClass} bg-white/80 backdrop-blur-md border border-brand-primary/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 transition-all duration-300 flex ${isExpanded ? 'items-start' : 'items-center'} px-3 md:px-4 ${isExpanded ? 'py-1.5 md:py-2' : 'py-1'}`}>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInput}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full resize-none bg-transparent border-0 focus:outline-none text-sm md:text-base text-slate-700 placeholder:text-gray-400 disabled:text-gray-400 disabled:cursor-not-allowed pr-2 scrollbar-thin scrollbar-thumb-navy-400 scrollbar-track-transparent hover:scrollbar-thumb-navy-500"
              style={{ 
                minHeight: isExpanded ? '36px' : '32px',
                // REMOVED: height - let handleInput manage it completely
                maxHeight: `${window.innerWidth < 768 ? MAX_HEIGHT_MOBILE : MAX_HEIGHT_DESKTOP}px`,
                fontSize: '16px', // Prevent zoom on iOS
                lineHeight: '1.5',
                // REMOVED: overflowY from inline style - let handleInput manage it dynamically
                padding: '0',
                margin: '0',
                verticalAlign: 'bottom',
                display: 'block'
              }}
              rows={1}
            />
          </div>
          {/* Character counter - enterprise pattern for long messages */}
          {message.length > 800 && (
            <div className="absolute -bottom-5 right-0 text-xs text-gray-400">
              {message.length}/1000
            </div>
          )}
        </div>

        {/* Send button - perfectly aligned */}
        <div className="flex-shrink-0 pt-0.5">
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isSending || disabled}
            className="rounded-full bg-white/80 backdrop-blur-md border border-brand-primary/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-brand-primary-hover hover:text-primary-900 px-3 md:px-4 py-1.5 md:py-2 font-medium h-9 md:h-10 min-w-[60px] md:min-w-[80px] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/80 flex items-center justify-center gap-1.5"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-primary" />
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