'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useConnections } from '@/lib/contexts/ConnectionsContext';
import { useAuth } from '@/lib/supabase/auth-context';
import { ConnectionManagement } from '@/components/ui/ConnectionManagement';
import { NotificationsFeed } from '@/components/features/notifications/NotificationsFeed';

export default function NotificationsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const connectionId = searchParams.get('connection');
  const { 
    connections, 
    loading
  } = useConnections();
  
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
      {isMobile ? (
        // Mobile: Full width, no padding wrapper with header
        <div className="pb-20">
          {/* Mobile Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
            <h1 className="text-lg font-semibold text-gray-900">Notifications</h1>
          </div>
          <NotificationsFeed variant="mobile" hideCard />
        </div>
      ) : (
        // Desktop: Sidebar + Main Layout
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex gap-6 items-start">
            {/* Connection Management - Sidebar on Desktop */}
            <div className="w-96 flex-shrink-0">
              <ConnectionManagement variant="desktop" />
            </div>
            
            {/* Notifications Feed - Main Content on Desktop */}
            <div className="flex-1 min-w-0">
              <NotificationsFeed variant="desktop" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 