'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { supabase } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ProfileMessageMetadata {
  shared_profile_id: string;
  shared_profile_name: string;
  shared_profile_avatar?: string;
  shared_profile_type: 'member' | 'alumni';
  [key: string]: unknown;
}

export interface Message {
  id: string;
  connection_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'link' | 'profile' | 'event';
  metadata?: Record<string, unknown> | ProfileMessageMetadata | EventMessageMetadata;
  created_at: string;
  updated_at: string;
  sender: {
    id: string;
    full_name: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

export interface MessageResponse {
  messages: Message[];
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface EventMessageMetadata {
  shared_event_id: string;
  shared_event_title: string;
  shared_event_location?: string;
  shared_event_start_time: string;
  [key: string]: unknown;
}

export function useMessages(connectionId: string | null) {
  const { user, session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  const realtimeChannel = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = useCallback(async (pageNum: number = 1, before?: string) => {
    if (!connectionId || !user) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        connectionId,
        page: pageNum.toString(),
        limit: '50'
      });

      if (before) {
        params.append('before', before);
      }

      // Add authentication header
      const response = await fetch(`/api/messages?${params}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data: MessageResponse = await response.json();

      if (pageNum === 1) {
        // First page: set messages directly (they're already in ascending order)
        setMessages(data.messages || []);
      } else {
        // Load more: append older messages to the end (since API now returns ascending)
        // The 'before' parameter gets messages after the oldest message we have
        setMessages(prev => [...prev, ...(data.messages || [])]);
      }

      setPage(data.page);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, [connectionId, user, session]);

  const sendMessage = async (content: string, messageType: 'text' | 'image' | 'file' | 'link' | 'profile' | 'event' = 'text', metadata?: Record<string, unknown> | ProfileMessageMetadata | EventMessageMetadata) => {
    if (!connectionId || !user || !content.trim()) return;

    // #region agent log
    const sendMessageId = `sendMsg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:110', message: 'sendMessage function called', data: { sendMessageId, connectionId, userId: user.id, contentLength: content.trim().length, contentPreview: content.trim().substring(0, 30), messageType, hasMetadata: !!metadata }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
    // #endregion

    try {
      // Optimistic update
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        connection_id: connectionId,
        sender_id: user.id,
        content: content.trim(),
        message_type: messageType,
        metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender: {
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'You',
          first_name: user.user_metadata?.first_name || null,
          last_name: user.user_metadata?.last_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
        }
      };

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:133', message: 'Adding optimistic message to state', data: { sendMessageId, optimisticMessageId: optimisticMessage.id, currentMessagesCount: messages.length }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' }) }).catch(() => { });
      // #endregion

      setMessages(prev => {
        const newMessages = [...prev, optimisticMessage];
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:136', message: 'Optimistic message added to state', data: { sendMessageId, optimisticMessageId: optimisticMessage.id, newMessagesCount: newMessages.length, prevCount: prev.length }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' }) }).catch(() => { });
        // #endregion
        return newMessages;
      });

      // Add authentication header to POST request
      const requestPayload = {
        connectionId,
        content: content.trim(),
        messageType,
        metadata
      };

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:147', message: 'Sending API request', data: { sendMessageId, connectionId, content: content.trim().substring(0, 50), messageType, metadata, hasMetadata: !!metadata, metadataKeys: metadata ? Object.keys(metadata) : [], hasSession: !!session, hasAccessToken: !!session?.access_token, requestPayload }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
      // #endregion

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(requestPayload)
      });

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:160', message: 'API response received', data: { sendMessageId, status: response.status, statusText: response.statusText, ok: response.ok }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
      // #endregion

      if (!response.ok) {
        // Try to get the error message from the response
        let errorMessage = 'Failed to send message';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('API error response:', errorData);
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        console.error('Message send failed:', {
          status: response.status,
          statusText: response.statusText,
          errorMessage
        });
        throw new Error(errorMessage);
      }

      const { message } = await response.json();

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:178', message: 'Received message from API', data: { sendMessageId, messageId: message?.id, optimisticMessageId: optimisticMessage.id, messageContentPreview: message?.content?.substring(0, 30) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
      // #endregion

      // Replace optimistic message with real message
      setMessages(prev => {
        const updatedMessages = prev.map(msg =>
          msg.id === optimisticMessage.id ? message : msg
        );
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:183', message: 'Replacing optimistic message with real message', data: { sendMessageId, messageId: message?.id, optimisticMessageId: optimisticMessage.id, prevCount: prev.length, updatedCount: updatedMessages.length, hasOptimisticInPrev: prev.some(m => m.id === optimisticMessage.id) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
        // #endregion
        return updatedMessages;
      });

      return message;
    } catch (err) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    }
  };

  const editMessage = async (messageId: string, newContent: string) => {
    if (!user || !newContent.trim()) return;

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to edit message');
      }

      const { message } = await response.json();

      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? message : msg
      ));

      return message;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit message');
      throw err;
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
      throw err;
    }
  };

  const loadMore = useCallback(() => {
    if (hasMore && !loading && messages.length > 0) {
      // Get the oldest message (first in array since ascending order)
      const oldestMessage = messages[0];
      fetchMessages(page + 1, oldestMessage.created_at);
    }
  }, [hasMore, loading, messages, page, fetchMessages]);

  const markAsRead = useCallback(async (messageId: string) => {
    if (!user) return;

    try {
      await fetch(`/api/messages/${messageId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user.id })
      });
    } catch (err) {
      console.error('Failed to mark message as read:', err);
    }
  }, [user]);

  // Add function to mark all unread messages in a connection as read
  const markAllAsRead = useCallback(async () => {
    if (!user || !connectionId) return;

    try {
      await fetch('/api/messages/mark-all-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          connectionId,
          userId: user.id
        })
      });
    } catch (err) {
      console.error('Failed to mark all messages as read:', err);
    }
  }, [user, connectionId, session]);

  const sendTypingIndicator = useCallback(() => {
    if (!connectionId || !user) return;

    setIsTyping(true);

    // Send typing indicator via realtime
    if (realtimeChannel.current) {
      realtimeChannel.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user.id, connectionId, isTyping: true }
      });
    }

    // Clear typing indicator after delay
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (realtimeChannel.current) {
        realtimeChannel.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: user.id, connectionId, isTyping: false }
        });
      }
    }, 3000);
  }, [connectionId, user]);

  // Setup realtime subscription
  useEffect(() => {
    if (!connectionId || !user) return;

    // Subscribe to messages for this connection
    realtimeChannel.current = supabase
      .channel(`messages:${connectionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `connection_id=eq.${connectionId}`
      }, (payload) => {
        const newMessage = payload.new as Message;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:328', message: 'Realtime INSERT event received', data: { messageId: newMessage.id, senderId: newMessage.sender_id, currentUserId: user.id, isOwnMessage: newMessage.sender_id === user.id, connectionId: newMessage.connection_id, contentPreview: newMessage.content?.substring(0, 30) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
        // #endregion
        
        if (newMessage.sender_id !== user.id) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:331', message: 'Adding message from realtime (not own)', data: { messageId: newMessage.id, currentMessagesCount: messages.length }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
          // #endregion
          
          setMessages(prev => {
            const newMessages = [...prev, newMessage];
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:335', message: 'Message added from realtime', data: { messageId: newMessage.id, prevCount: prev.length, newMessagesCount: newMessages.length }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
            // #endregion
            return newMessages;
          });
          // Mark as read if we're actively viewing
          markAsRead(newMessage.id);
        } else {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:343', message: 'Realtime INSERT ignored (own message)', data: { messageId: newMessage.id, senderId: newMessage.sender_id, currentUserId: user.id }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
          // #endregion
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `connection_id=eq.${connectionId}`
      }, (payload) => {
        const updatedMessage = payload.new as Message;
        setMessages(prev => prev.map(msg =>
          msg.id === updatedMessage.id ? updatedMessage : msg
        ));
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `connection_id=eq.${connectionId}`
      }, (payload) => {
        const deletedMessage = payload.old as Message;
        setMessages(prev => prev.filter(msg => msg.id !== deletedMessage.id));
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, isTyping: typing } = payload.payload;
        if (userId !== user.id) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            if (typing) {
              newSet.add(userId);
            } else {
              newSet.delete(userId);
            }
            return newSet;
          });
        }
      })
      .subscribe();

    return () => {
      if (realtimeChannel.current) {
        supabase.removeChannel(realtimeChannel.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [connectionId, user, markAsRead]);

  // Initial fetch
  useEffect(() => {
    if (connectionId && user) {
      fetchMessages(1);
    }
  }, [connectionId, user, fetchMessages]);

  // Mark all unread messages as read when messages are loaded
  useEffect(() => {
    if (connectionId && user && messages.length > 0) {
      // Small delay to ensure messages are fully loaded
      const timer = setTimeout(() => {
        markAllAsRead();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [connectionId, user, messages.length, markAllAsRead]);

  return {
    messages,
    loading,
    error,
    hasMore,
    isTyping,
    typingUsers: Array.from(typingUsers),
    sendMessage,
    editMessage,
    deleteMessage,
    loadMore,
    markAsRead,
    markAllAsRead, // Add this
    sendTypingIndicator,
    refreshMessages: () => fetchMessages(1)
  };
} 