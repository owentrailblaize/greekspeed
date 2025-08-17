'use client';
export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from 'react';
import { useConnections } from '@/lib/hooks/useConnections';
import { MessagesSidebar } from '@/components/messaging/MessagesSidebar';
import { MessagesMainChat } from '@/components/messaging/MessagesMainChat';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

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
    // On mobile, close sidebar when selecting a connection
    if (isMobile) { // ✅ Use state instead of window.innerWidth
      setSidebarOpen(false);
    }
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
      
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Set initial state
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar */}
        <div className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          absolute md:relative
          z-30 md:z-auto
          transition-transform duration-200 ease-in-out
          md:transition-none
          w-80 md:w-80
          bg-gray-50 border-r border-gray-200
          flex-shrink-0
        `}>
          <MessagesSidebar
            connections={connections}
            loading={loading}
            selectedConnectionId={selectedConnectionId}
            onConnectionSelect={handleConnectionSelect}
            onMobileMenuToggle={toggleSidebar}
            isMobile={isMobile} // ✅ Use state instead of window.innerWidth
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <MessagesMainChat
            selectedConnectionId={selectedConnectionId}
            connections={connections}
            onBack={handleBack}
            onConnectionSelect={handleConnectionSelect}
          />
        </div>
      </div>
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