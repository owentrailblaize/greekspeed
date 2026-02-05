'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, X, Link2 } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import ImageWithFallback from '@/components/figma/ImageWithFallback';

interface MessageInputWithProfileLinkProps {
  onSendMessage: (content: string, messageType?: 'text' | 'profile', metadata?: Record<string, unknown>) => Promise<void>;
  onTyping: () => void;
  disabled?: boolean;
  placeholder?: string;
  profileLink: string;
  profileInfo?: {
    id: string;
    name: string;
    avatarUrl?: string;
    type: 'member' | 'alumni';
  };
  onProfileLinkRemove?: () => void;
}

export function MessageInputWithProfileLink({ 
  onSendMessage, 
  onTyping, 
  disabled = false, 
  placeholder = "Type a message...",
  profileLink,
  profileInfo,
  onProfileLinkRemove
}: MessageInputWithProfileLinkProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const MAX_HEIGHT_MOBILE = 180;
  const MAX_HEIGHT_DESKTOP = 150;

  // Initialize with profile link when drawer opens
  useEffect(() => {
    if (profileLink) {
      setMessage(profileLink);
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
  }, [profileLink]);

  const handleSend = async () => {
    const finalMessage = message.trim();
    if (!finalMessage || isSending || disabled) return;
    
    setIsSending(true);
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/9b79d5f7-95d0-4f63-a221-cc92278c376d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MessageInputWithProfileLink.tsx:58',message:'handleSend called',data:{finalMessage,finalMessageLength:finalMessage.length,hasProfileInfo:!!profileInfo,hasProfileLink:!!profileLink,messageContainsLink:profileInfo?finalMessage.includes(profileLink):false,profileInfo},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      // Check if message contains profile link
      if (profileInfo && finalMessage.includes(profileLink)) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/9b79d5f7-95d0-4f63-a221-cc92278c376d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MessageInputWithProfileLink.tsx:65',message:'Sending profile message',data:{messageType:'profile',metadata:{shared_profile_id:profileInfo.id,shared_profile_type:profileInfo.type},profileInfo},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        // Send as profile message type
        await onSendMessage(
          finalMessage,
          'profile',
          {
            shared_profile_id: profileInfo.id,
            shared_profile_type: profileInfo.type
          }
        );
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/9b79d5f7-95d0-4f63-a221-cc92278c376d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MessageInputWithProfileLink.tsx:76',message:'Sending text message',data:{messageType:'text'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        // Send as regular text message
        await onSendMessage(finalMessage, 'text');
      }
      
      setMessage('');
      setIsExpanded(false);
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
    
    if (scrollHeight > maxHeight) {
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.overflowY = 'hidden';
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
      {/* Profile Link Preview */}
      {profileInfo && message.includes(profileLink) && (
        <div className="mb-3 p-3 bg-accent-50 border border-accent-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {profileInfo.avatarUrl ? (
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  <ImageWithFallback
                    src={profileInfo.avatarUrl}
                    alt={profileInfo.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                  <Link2 className="w-5 h-5 text-gray-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profileInfo.name}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {profileInfo.type}
                </p>
              </div>
            </div>
            {onProfileLinkRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (onProfileLinkRemove) {
                    setMessage(message.replace(profileLink, '').trim());
                    onProfileLinkRemove();
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
            className={`w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none ${borderRadiusClass} transition-all duration-200 ${
              isExpanded ? 'min-h-[80px]' : 'min-h-[44px]'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{
              maxHeight: `${window.innerWidth < 768 ? MAX_HEIGHT_MOBILE : MAX_HEIGHT_DESKTOP}px`,
              overflowY: isExpanded ? 'auto' : 'hidden'
            }}
          />
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

