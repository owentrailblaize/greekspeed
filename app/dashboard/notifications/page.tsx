'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useConnections } from '@/lib/contexts/ConnectionsContext';
import { useAuth } from '@/lib/supabase/auth-context';
import { ConnectionManagement } from '@/components/ui/ConnectionManagement';

export default function NotificationsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const connectionId = searchParams.get('connection');
  const { 
    connections, 
    loading, 
    updateConnectionStatus, 
    refreshConnections 
  } = useConnections();
  
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Add useEffect to scroll to or highlight specific connection
  useEffect(() => {
    if (connectionId && !loading) {
      // Small delay to ensure connections are loaded
      setTimeout(() => {
        const connectionElement = document.getElementById(`connection-${connectionId}`);
        if (connectionElement) {
          connectionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Optionally add a highlight class
          connectionElement.classList.add('ring-2', 'ring-brand-primary');
          setTimeout(() => {
            connectionElement.classList.remove('ring-2', 'ring-brand-primary');
          }, 3000);
        }
      }, 500);
    }
  }, [connectionId, loading]);

  // Filter connections by status
  const pendingRequests = connections.filter(conn => 
    conn.status === 'pending' && conn.recipient_id === user?.id
  );
  
  const sentRequests = connections.filter(conn => 
    conn.status === 'pending' && conn.requester_id === user?.id
  );
  
  const acceptedConnections = connections.filter(conn => 
    conn.status === 'accepted' && 
    (conn.requester_id === user?.id || conn.recipient_id === user?.id)
  );

  const declinedConnections = connections.filter(conn => 
    conn.status === 'declined' && 
    (conn.requester_id === user?.id || conn.recipient_id === user?.id)
  );

  const handleConnectionAction = async (connectionId: string, action: 'accept' | 'decline') => {
    setProcessingId(connectionId);
    try {
      // Convert action to the correct status format
      const status = action === 'accept' ? 'accepted' : 'declined';
      await updateConnectionStatus(connectionId, status);
      await refreshConnections();
    } catch (error) {
      console.error('Failed to update connection:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const getConnectionPartner = (connection: any) => {
    if (connection.requester_id === user?.id) {
      // Current user is the requester, so return recipient info
      return {
        id: connection.recipient_id,
        name: connection.recipient.full_name || 'Unknown User',
        avatar: connection.recipient.avatar_url,
        initials: connection.recipient.first_name && connection.recipient.last_name 
          ? `${connection.recipient.first_name[0]}${connection.recipient.last_name[0]}`.toUpperCase()
          : connection.recipient.full_name?.slice(0, 2).toUpperCase() || 'U'
      };
    } else {
      // Current user is the recipient, so return requester info
      return {
        id: connection.requester_id,
        name: connection.requester.full_name || 'Unknown User',
        avatar: connection.requester.avatar_url,
        initials: connection.requester.first_name && connection.requester.last_name 
          ? `${connection.requester.first_name[0]}${connection.requester.last_name[0]}`.toUpperCase()
          : connection.requester.full_name?.slice(0, 2).toUpperCase() || 'U'
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-primary-900">Notifications</h1>
          <p className="text-gray-600">Manage your connections and stay updated on important activities</p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Connection Management */}
        <ConnectionManagement variant={isMobile ? "mobile" : "desktop"} />
      </div>
    </div>
  );
} 