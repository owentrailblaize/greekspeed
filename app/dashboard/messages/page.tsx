'use client';
export const dynamic = "force-dynamic";

import { useState, useEffect } from 'react';
import { useConnections } from '@/lib/hooks/useConnections';
import { MessagesSidebar } from '@/components/messaging/MessagesSidebar';
import { MessagesMainChat } from '@/components/messaging/MessagesMainChat';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

export default function MessagesPage() {
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { connections, loading } = useConnections();

  const handleConnectionSelect = (connectionId: string) => {
    setSelectedConnectionId(connectionId);
    // On mobile, close sidebar when selecting a connection
    if (window.innerWidth < 768) {
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

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize(); // Set initial state
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
          h-full
        `}>
          <MessagesSidebar
            connections={connections}
            loading={loading}
            selectedConnectionId={selectedConnectionId}
            onConnectionSelect={handleConnectionSelect}
            onMobileMenuToggle={toggleSidebar}
            isMobile={!sidebarOpen}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <MessagesMainChat
            selectedConnectionId={selectedConnectionId}
            connections={connections}
            onBack={handleBack}
            onConnectionSelect={handleConnectionSelect}
          />
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={toggleSidebar}
          />
        )}
      </div>
    </div>
  );
}