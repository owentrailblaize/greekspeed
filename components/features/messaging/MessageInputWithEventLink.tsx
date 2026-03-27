'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, X, Calendar } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';

interface MessageInputWithEventLinkProps {
  onSendMessage: (content: string, messageType?: 'text' | 'event', metadata?: Record<string, unknown>) => Promise<void>;
  onTyping: () => void;
  disabled?: boolean;
  placeholder?: string;
  eventLink: string;
  eventInfo?: {
    id: string;
    title: string;
    location?: string;
    start_time: string | null;
  };
  onEventLinkRemove?: () => void;
}

export function MessageInputWithEventLink({
  onSendMessage,
  onTyping,
  disabled = false,
  placeholder = "Type a message...",
  eventLink,
  eventInfo,
  onEventLinkRemove
}: MessageInputWithEventLinkProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_HEIGHT_MOBILE = 200; // Increased from 180
  const MAX_HEIGHT_DESKTOP = 250; // Increased from 150 (more reasonable for long messages)

  // Format date for display
  const formatEventDate = (dateString: string | null) => {
    if (!dateString) return 'Time TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Initialize with event link when drawer opens
  useEffect(() => {
    if (eventLink) {
      setMessage(eventLink);
      // Focus the textarea after a short delay to allow it to render
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          // Place cursor at the end
          const len = textareaRef.current.value.length;
          textareaRef.current.setSelectionRange(len, len);
        }
      }, 100);
    }
  }, [eventLink]);

  const handleSend = async () => {
    const finalMessage = message.trim();
    if (!finalMessage || isSending || disabled) return;

    setIsSending(true);
    try {
      // Check if message contains event link
      if (eventInfo && finalMessage.includes(eventLink)) {
        // Send as event message type with metadata
        await onSendMessage(
          finalMessage,
          'event',
          {
            shared_event_id: eventInfo.id,
            shared_event_title: eventInfo.title,
            shared_event_location: eventInfo.location,
            shared_event_start_time: eventInfo.start_time
          }
        );
      } else {
        // Send as regular text message
        await onSendMessage(finalMessage, 'text');
      }

      setMessage('');
      setIsExpanded(false);
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

    if (inputValue.length > 1000) {
      return;
    }

    setMessage(inputValue);

    const textarea = e.target;
    const isMobile = window.innerWidth < 768;
    const maxHeight = isMobile ? MAX_HEIGHT_MOBILE : MAX_HEIGHT_DESKTOP;

    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(scrollHeight, maxHeight);

    textarea.style.height = `${newHeight}px`;

    const shouldExpand = scrollHeight > 80;
    setIsExpanded(shouldExpand);

    // Enable scrolling if at max height - CRITICAL FIX
    if (scrollHeight > maxHeight) {
      textarea.style.overflowY = 'auto';
      // Auto-scroll to cursor position to keep it visible (enterprise pattern)
      requestAnimationFrame(() => {
        const cursorPosition = textarea.selectionStart;
        const textBeforeCursor = inputValue.substring(0, cursorPosition);
        const computedStyle = window.getComputedStyle(textarea);
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
      textarea.style.overflowY = 'hidden';
      textarea.scrollTop = 0; // Reset scroll when not needed
    }

    onTyping();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMessage = message.slice(0, start) + emoji + message.slice(end);

    setMessage(newMessage);

    const event = new Event('input', { bubbles: true });
    Object.defineProperty(event, 'target', { value: textarea, enumerable: true });
    textarea.dispatchEvent(event);

    setTimeout(() => {
      textarea.focus();
      const newCursorPosition = start + emoji.length;
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

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

  const borderRadiusClass = isExpanded
    ? 'rounded-2xl'
    : 'rounded-full';

  const containerAlignClass = isExpanded
    ? 'items-start'
    : 'items-center';

  return (
    <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4">
      {/* Event Link Preview */}
      {eventInfo && message.includes(eventLink) && (
        <div className="mb-3 p-3 bg-brand-primary/5 border border-brand-primary/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-brand-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {eventInfo.title}
                </p>
                <p className="text-xs text-gray-500">
                  {formatEventDate(eventInfo.start_time)}
                  {eventInfo.location && ` - ${eventInfo.location}`}
                </p>
              </div>
            </div>
            {onEventLinkRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (onEventLinkRemove) {
                    setMessage(message.replace(eventLink, '').trim());
                    onEventLinkRemove();
                  }
                }}
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className={`flex ${containerAlignClass} space-x-2`}>
        {/* Emoji Picker */}
        <div className="flex-shrink-0">
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
        </div>

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isSending}
            className={`w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none ${borderRadiusClass} transition-all duration-200 scrollbar-thin scrollbar-thumb-navy-400 scrollbar-track-transparent hover:scrollbar-thumb-navy-500 ${isExpanded ? 'min-h-[80px]' : 'min-h-[44px]'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{
              maxHeight: `${window.innerWidth < 768 ? MAX_HEIGHT_MOBILE : MAX_HEIGHT_DESKTOP}px`,
              // REMOVED: overflowY from inline style - let handleInput manage it dynamically
            }}
          />
          {/* Character counter - enterprise pattern for long messages */}
          {message.length > 800 && (
            <div className="absolute -bottom-5 right-0 text-xs text-gray-400">
              {message.length}/1000
            </div>
          )}
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={disabled || isSending || !message.trim()}
          className={`flex-shrink-0 ${borderRadiusClass} bg-brand-primary hover:bg-brand-primary-hover text-white h-[44px] w-[44px] p-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200`}
        >
          {isSending ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}

