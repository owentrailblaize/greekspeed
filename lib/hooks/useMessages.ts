'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { supabase } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { logger } from "@/lib/utils/logger";

export interface Message {
  id: string;
  connection_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'link';
  metadata?: Record<string, unknown>;
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
        setMessages(data.messages || []);
      } else {
        setMessages(prev => [...(data.messages || []), ...prev]);
      }
      
      setPage(data.page);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, [connectionId, user, session]);

  const sendMessage = async (content: string, messageType: 'text' | 'image' | 'file' | 'link' = 'text', metadata?: Record<string, unknown>) => {
    if (!connectionId || !user || !content.trim()) return;
    
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
      
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Add authentication header to POST request
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          connectionId,
          content: content.trim(),
          messageType,
          metadata
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const { message } = await response.json();
      
      // Replace optimistic message with real message
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id ? message : msg
      ));
      
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
      const oldestMessage = messages[0];
      fetchMessages(page + 1, oldestMessage.created_at);
    }
  }, [hasMore, loading, messages, page, fetchMessages]);

  const markAsRead = useCallback(async (messageId: string) => {
    if (!user) return;
    
    try {
      await fetch(`/api/messages/${messageId}/read`, {
        method: 'POST'
      });
    } catch (err) {
      logger.error('Failed to mark message as read:', { context: [err] });
    }
  }, [user]);

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
        if (newMessage.sender_id !== user.id) {
          setMessages(prev => [...prev, newMessage]);
          // Mark as read if we're actively viewing
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
    sendTypingIndicator,
    refreshMessages: () => fetchMessages(1)
  };
} 