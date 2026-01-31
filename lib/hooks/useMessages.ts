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
  const sendingRef = useRef<boolean>(false);
  const sentMessageIdsRef = useRef<Set<string>>(new Set());
  const optimisticMessageIdsRef = useRef<Set<string>>(new Set());
  const pendingSendsRef = useRef<Set<string>>(new Set());

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

    // CRITICAL: Create a unique content key for deduplication
    const contentKey = `${content.trim()}_${messageType}_${JSON.stringify(metadata || {})}`;

    // CRITICAL: Atomic check-and-set using content key (prevents StrictMode duplicates)
    if (pendingSendsRef.current.has(contentKey)) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:118', message: 'sendMessage blocked - duplicate content key', data: { contentKey, connectionId, pendingKeys: Array.from(pendingSendsRef.current) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }) }).catch(() => { });
      // #endregion
      return;
    }

    // Atomically add to pending sends BEFORE any async operations
    pendingSendsRef.current.add(contentKey);

    // Also set the general sending flag for backward compatibility
    sendingRef.current = true;

    // #region agent log
    const sendMessageId = `sendMsg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:127', message: 'sendMessage function called', data: { sendMessageId, connectionId, userId: user.id, contentLength: content.trim().length, contentPreview: content.trim().substring(0, 30), messageType, hasMetadata: !!metadata, contentKey }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
    // #endregion

    // Generate optimistic message ID with content key to ensure uniqueness (declare outside try for catch access)
    const optimisticId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let optimisticMessage: Message;

    try {
      optimisticMessage = {
        id: optimisticId,
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

      // Track optimistic message ID
      optimisticMessageIdsRef.current.add(optimisticMessage.id);

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:156', message: 'Adding optimistic message to state', data: { sendMessageId, optimisticMessageId: optimisticMessage.id, currentMessagesCount: messages.length, optimisticIds: Array.from(optimisticMessageIdsRef.current), contentKey }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' }) }).catch(() => { });
      // #endregion

      setMessages(prev => {
        // CRITICAL: Check ref FIRST - this persists across React StrictMode double-calls
        if (optimisticMessageIdsRef.current.has(optimisticMessage.id)) {
          // Check if it's already in state
          const optimisticExists = prev.some(m => m.id === optimisticMessage.id);
          if (optimisticExists) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:162', message: 'Optimistic message already tracked and in state, skipping (StrictMode protection)', data: { sendMessageId, optimisticMessageId: optimisticMessage.id, prevCount: prev.length, contentKey }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' }) }).catch(() => { });
            // #endregion
            return prev;
          }
        }

        // Also check if it exists in prev (defensive)
        const optimisticExists = prev.some(m => m.id === optimisticMessage.id);
        if (optimisticExists) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:170', message: 'Optimistic message already exists in state, skipping', data: { sendMessageId, optimisticMessageId: optimisticMessage.id, prevCount: prev.length, contentKey }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' }) }).catch(() => { });
          // #endregion
          return prev;
        }

        const newMessages = [...prev, optimisticMessage];
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:177', message: 'Optimistic message added to state', data: { sendMessageId, optimisticMessageId: optimisticMessage.id, newMessagesCount: newMessages.length, prevCount: prev.length, contentKey }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' }) }).catch(() => { });
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

      // CRITICAL: Track sent message ID to prevent duplicates
      if (message?.id) {
        sentMessageIdsRef.current.add(message.id);
        // Clean up old IDs after 5 minutes to prevent memory leak
        setTimeout(() => {
          sentMessageIdsRef.current.delete(message.id);
        }, 5 * 60 * 1000);
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:196', message: 'Received message from API', data: { sendMessageId, messageId: message?.id, optimisticMessageId: optimisticMessage.id, messageContentPreview: message?.content?.substring(0, 30), trackedMessageIds: Array.from(sentMessageIdsRef.current) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
      // #endregion

      // Replace optimistic message with real message
      setMessages(prev => {
        const hasOptimistic = prev.some(m => m.id === optimisticMessage.id);
        const hasRealMessage = prev.some(m => m.id === message.id);
        const messageIds = prev.map(m => m.id);

        // CRITICAL: Check if we've already processed this replacement (StrictMode protection)
        // If the real message already exists and optimistic is still tracked, we're in a duplicate call
        if (hasRealMessage && optimisticMessageIdsRef.current.has(optimisticMessage.id)) {
          // Already replaced in a previous StrictMode call - just clean up
          optimisticMessageIdsRef.current.delete(optimisticMessage.id);
          const finalMessages = prev.filter(msg => msg.id !== optimisticMessage.id);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:236', message: 'Replacement already processed (StrictMode protection)', data: { sendMessageId, messageId: message?.id, optimisticMessageId: optimisticMessage.id, prevCount: prev.length }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
          // #endregion
          return finalMessages;
        }

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:241', message: 'Before replacing optimistic message', data: { sendMessageId, messageId: message?.id, optimisticMessageId: optimisticMessage.id, prevCount: prev.length, hasOptimistic, hasRealMessage, messageIds }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
        // #endregion

        // If real message already exists (e.g., from realtime), just remove the optimistic one
        if (hasRealMessage) {
          // Remove from tracking
          optimisticMessageIdsRef.current.delete(optimisticMessage.id);
          const finalMessages = prev.filter(msg => msg.id !== optimisticMessage.id);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:250', message: 'Real message already exists, removing optimistic only', data: { sendMessageId, messageId: message?.id, optimisticMessageId: optimisticMessage.id, prevCount: prev.length, finalCount: finalMessages.length }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
          // #endregion
          return finalMessages;
        }

        // If optimistic doesn't exist, don't replace (already handled)
        if (!hasOptimistic) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:260', message: 'Optimistic message not found, skipping replacement', data: { sendMessageId, messageId: message?.id, optimisticMessageId: optimisticMessage.id, prevCount: prev.length }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
          // #endregion
          return prev;
        }

        // Otherwise, replace optimistic with real message
        const updatedMessages = prev.map(msg =>
          msg.id === optimisticMessage.id ? message : msg
        );

        // CRITICAL: Ensure no duplicates by ID (defensive check)
        const seenIds = new Set<string>();
        const finalMessages = updatedMessages.filter(msg => {
          if (seenIds.has(msg.id)) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:275', message: 'Duplicate message filtered out during replacement', data: { sendMessageId, duplicateMessageId: msg.id }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
            // #endregion
            return false;
          }
          seenIds.add(msg.id);
          return true;
        });

        // Remove optimistic message from tracking AFTER successful replacement
        optimisticMessageIdsRef.current.delete(optimisticMessage.id);

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:288', message: 'After replacing optimistic message', data: { sendMessageId, messageId: message?.id, optimisticMessageId: optimisticMessage.id, prevCount: prev.length, updatedCount: updatedMessages.length, finalCount: finalMessages.length, finalMessageIds: finalMessages.map(m => m.id) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
        // #endregion

        return finalMessages;
      });

      // Remove from pending sends and reset flags
      pendingSendsRef.current.delete(contentKey);
      sendingRef.current = false;
      return message;
    } catch (err) {
      // Remove from pending sends on error
      pendingSendsRef.current.delete(contentKey);
      sendingRef.current = false;
      // Remove optimistic message on error using the optimisticId we tracked
      const optimisticIdToRemove = optimisticId;
      setMessages(prev => {
        const filtered = prev.filter(msg => {
          if (msg.id === optimisticIdToRemove) {
            optimisticMessageIdsRef.current.delete(msg.id);
            return false;
          }
          return true;
        });
        return filtered;
      });
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
        fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:388', message: 'Realtime INSERT event received', data: { messageId: newMessage.id, senderId: newMessage.sender_id, currentUserId: user.id, senderIdType: typeof newMessage.sender_id, userIdType: typeof user.id, senderIdsMatch: String(newMessage.sender_id) === String(user.id), connectionId: newMessage.connection_id, contentPreview: newMessage.content?.substring(0, 30) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
        // #endregion

        // CRITICAL FIX: Use strict string comparison to ensure proper matching
        const isOwnMessage = String(newMessage.sender_id) === String(user.id);

        // CRITICAL: Always check for duplicates FIRST, regardless of sender
        setMessages(prev => {
          // Check if message already exists in state
          const messageExists = prev.some(m => m.id === newMessage.id);
          // Check if this is a message we just sent (tracked in ref)
          const isTrackedMessage = sentMessageIdsRef.current.has(newMessage.id);

          if (messageExists || isTrackedMessage) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:399', message: 'Duplicate message prevented from realtime', data: { messageId: newMessage.id, isOwnMessage, messageExists, isTrackedMessage, prevCount: prev.length, trackedIds: Array.from(sentMessageIdsRef.current) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
            // #endregion
            return prev; // Message already exists or was just sent, don't add it
          }

          // Only add if it's not our own message (we already have it from API response)
          if (isOwnMessage) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:408', message: 'Realtime INSERT ignored (own message)', data: { messageId: newMessage.id, senderId: newMessage.sender_id, currentUserId: user.id, senderIdType: typeof newMessage.sender_id, userIdType: typeof user.id }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
            // #endregion
            return prev; // Don't add own messages from realtime
          }

          // It's not our message and doesn't exist - add it
          const newMessages = [...prev, newMessage];
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a79c9eaa-4005-4d63-b8d0-3434e5dce3f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useMessages.ts:416', message: 'Message added from realtime', data: { messageId: newMessage.id, prevCount: prev.length, newMessagesCount: newMessages.length }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
          // #endregion
          return newMessages;
        });

        // Mark as read if we're actively viewing (only for non-own messages)
        if (!isOwnMessage) {
          markAsRead(newMessage.id);
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