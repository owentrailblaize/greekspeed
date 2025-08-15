'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';

export interface Connection {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  message?: string;
  created_at: string;
  updated_at: string;
  // Add profile information
  requester: {
    id: string;
    full_name: string;
    first_name: string | null;
    last_name: string | null;
    chapter: string | null;
    avatar_url: string | null;
  };
  recipient: {
    id: string;
    full_name: string;
    first_name: string | null;
    last_name: string | null;
    chapter: string | null;
    avatar_url: string | null;
  };
}

export function useConnections() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/connections?userId=${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch connections');
      }
      
      const data = await response.json();
      setConnections(data.connections || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch connections');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const sendConnectionRequest = async (recipientId: string, message?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: user.id,
          recipientId,
          message
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send connection request');
      }
      
      const data = await response.json();
      await fetchConnections(); // Refresh connections
      return data.connection;
    } catch (err) {
      throw err;
    }
  };

  const updateConnectionStatus = async (connectionId: string, status: 'accepted' | 'declined' | 'blocked') => {
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update connection');
      }
      
      const data = await response.json();
      await fetchConnections(); // Refresh connections
      return data.connection;
    } catch (err) {
      throw err;
    }
  };

  const cancelConnectionRequest = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel connection request');
      }
      
      await fetchConnections(); // Refresh connections
    } catch (err) {
      throw err;
    }
  };

  const getConnectionStatus = (otherUserId: string): 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'declined' | 'blocked' => {
    if (!user || !connections.length) return 'none';
    
    const connection = connections.find(conn => 
      (conn.requester_id === user.id && conn.recipient_id === otherUserId) ||
      (conn.requester_id === otherUserId && conn.recipient_id === user.id)
    );
    
    if (!connection) return 'none';
    
    if (connection.status === 'pending') {
      return connection.requester_id === user.id ? 'pending_sent' : 'pending_received';
    }
    
    return connection.status as 'accepted' | 'declined' | 'blocked';
  };

  const getConnectionId = (otherUserId: string): string | null => {
    if (!user || !connections.length) return null;
    
    const connection = connections.find(conn => 
      (conn.requester_id === user.id && conn.recipient_id === otherUserId) ||
      (conn.requester_id === otherUserId && conn.recipient_id === user.id)
    );
    
    return connection?.id || null;
  };

  useEffect(() => {
    if (user) {
      fetchConnections();
    }
  }, [user, fetchConnections]);

  return {
    connections,
    loading,
    error,
    sendConnectionRequest,
    updateConnectionStatus,
    cancelConnectionRequest,
    getConnectionStatus,
    getConnectionId,
    refreshConnections: fetchConnections
  };
} 