'use client';
export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConnections } from '@/lib/contexts/ConnectionsContext';
import { MessagesSidebar } from '@/components/features/messaging/MessagesSidebar';
import { MessagesMainChat } from '@/components/features/messaging/MessagesMainChat';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MobileBottomNavigation } from '@/components/features/dashboard/dashboards/ui/MobileBottomNavigation'; // Add this import

// ✅ Create a separate component that uses useSearchParams
function MessagesPageContent() {
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
      
      // On mobile, sidebar state is managed by selectedConnectionId
      // On desktop, don't force sidebar open - let user control it
      if (mobile) {
        setSidebarCollapsed(true); // Start collapsed on mobile
      }
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
        {/* Collapsible Sidebar */}
        <div className="flex">
          {/* Main Sidebar */}
          <AnimatePresence>
            {(showListViewOnMobile || (!isMobile && sidebarOpen)) && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ 
                  width: sidebarCollapsed && !isMobile ? 64 : (isMobile ? '100vw' : 320), 
                  opacity: 1 
                }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="bg-gray-50 border-r border-gray-200 shadow-sm overflow-hidden flex-shrink-0"
              >
                <MessagesSidebar
                  connections={connections}
                  loading={loading}
                  selectedConnectionId={selectedConnectionId}
                  onConnectionSelect={handleConnectionSelect}
                  onMobileMenuToggle={toggleSidebar}
                  isMobile={isMobile}
                  isMainView={showListViewOnMobile}
                  sidebarCollapsed={sidebarCollapsed && !isMobile}
                  onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                  onClose={() => !isMobile && setSidebarOpen(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sidebar Toggle Button (when sidebar is completely closed) */}
          {!isMobile && !sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="h-12 w-8 bg-white border-r border-gray-200 shadow-sm rounded-r-lg hover:bg-gray-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </div>

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