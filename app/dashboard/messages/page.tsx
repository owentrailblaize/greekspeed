'use client';
export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from 'react';
import { useConnections } from '@/lib/contexts/ConnectionsContext';
import { MessagesSidebar } from '@/components/features/messaging/MessagesSidebar';
import { MessagesMainChat } from '@/components/features/messaging/MessagesMainChat';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MobileBottomNavigation } from '@/components/features/dashboard/dashboards/ui/MobileBottomNavigation'; // Add this import

// ✅ Create a separate component that uses useSearchParams
function MessagesPageContent() {
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false); // ✅ Add state for mobile detection
  const { connections, loading } = useConnections();
  const searchParams = useSearchParams();
  const router = useRouter();

  // ✅ Add effect to handle URL parameters
  useEffect(() => {
    const connectionParam = searchParams.get('connection');
    if (connectionParam) {
      // Check if this connection exists and is valid
      const connectionExists = connections.some(conn => conn.id === connectionParam);
      if (connectionExists) {
        setSelectedConnectionId(connectionParam);
        // Clear the URL parameter after setting the connection
        router.replace('/dashboard/messages');
      }
    }
  }, [searchParams, connections, router]);

  const handleConnectionSelect = (connectionId: string) => {
    setSelectedConnectionId(connectionId);
    // On mobile, we don't need to manage sidebar state since we're showing list/chat views
  };

  const handleBack = () => {
    setSelectedConnectionId(null);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      if (selectedConnectionId) {
        setSelectedConnectionId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedConnectionId]);

  // ✅ Handle responsive behavior and mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // On desktop, always show sidebar
      if (!mobile) {
        setSidebarOpen(true);
      }
      // On mobile, sidebar state is managed by selectedConnectionId
    };

    // Set initial state
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine what to show on mobile
  const showListViewOnMobile = isMobile && !selectedConnectionId;
  const showChatViewOnMobile = isMobile && selectedConnectionId;

  return (
    // Adjust height to account for mobile footer (pb-20 = 80px for footer)
    <div className="h-[calc(100vh-4rem)] sm:h-[calc(100vh-4rem)] flex flex-col pb-14 sm:pb-0">
      {/* Mobile Header - Only show when in list view */}
      {showListViewOnMobile && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
        </div>
      )}

      {/* Main Layout - FIXED: Use flex-1 to fill remaining space */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop: Always show sidebar */}
        {/* Mobile: Show sidebar when no connection is selected (list view) */}
        {(showListViewOnMobile || !isMobile) && (
          <div className={`
            ${isMobile ? 'w-full' : (sidebarOpen ? 'translate-x-0' : '-translate-x-full')}
            ${!isMobile ? 'md:translate-x-0' : ''}
            ${!isMobile ? 'absolute md:relative' : 'relative'}
            ${!isMobile ? 'z-30 md:z-auto' : 'z-auto'}
            ${!isMobile ? 'transition-transform duration-200 ease-in-out' : ''}
            ${!isMobile ? 'md:transition-none' : ''}
            w-full md:w-80
            flex-shrink-0
            h-full
          `}>
            <MessagesSidebar
              connections={connections}
              loading={loading}
              selectedConnectionId={selectedConnectionId}
              onConnectionSelect={handleConnectionSelect}
              onMobileMenuToggle={toggleSidebar}
              isMobile={isMobile}
              isMainView={showListViewOnMobile}
            />
          </div>
        )}

        {/* Desktop: Always show main chat area */}
        {/* Mobile: Only show chat area when connection is selected */}
        {(!isMobile || showChatViewOnMobile) && (
          <div className="flex-1 flex flex-col h-full">
            <MessagesMainChat
              selectedConnectionId={selectedConnectionId}
              connections={connections}
              onBack={handleBack}
              onConnectionSelect={handleConnectionSelect}
              isMobile={isMobile}
            />
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNavigation />
    </div>
  );
}

// ✅ Main component with Suspense boundary
export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    }>
      <MessagesPageContent />
    </Suspense>
  );
}