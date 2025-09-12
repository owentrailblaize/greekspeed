'use client';

import { Connection } from '@/lib/contexts/ConnectionsContext';
import { ConnectionChat } from './ConnectionChat';
import { MessageSquare, Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessagesMainChatProps {
  selectedConnectionId: string | null;
  connections: Connection[];
  onBack: () => void;
  onConnectionSelect: (connectionId: string) => void;
}

export function MessagesMainChat({
  selectedConnectionId,
  connections,
  onBack,
  onConnectionSelect
}: MessagesMainChatProps) {
  // If no connection is selected, show welcome state
  if (!selectedConnectionId) {
    return (
      <div className="flex-1 bg-white flex flex-col items-center justify-center p-8 h-full min-h-0">
        <div className="text-center max-w-md">
          {/* Welcome Icon */}
          <div className="w-20 h-20 bg-navy-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="h-10 w-10 text-navy-600" />
          </div>
          
          {/* Welcome Text */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Welcome to Messages
          </h2>
          <p className="text-gray-600 mb-6">
            Select a connection from the sidebar to start chatting, or browse alumni to make new connections.
          </p>
          
          {/* Quick Actions */}
          <div className="space-y-3">
            {connections.length > 0 ? (
              <p className="text-sm text-gray-500">
                You have {connections.length} connection{connections.length !== 1 ? 's' : ''} ready to chat with.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 mb-4">
                  No connections yet. Start building your network!
                </p>
                <Button 
                  onClick={() => window.location.href = '/dashboard/alumni'}
                  className="bg-navy-600 hover:bg-navy-700 text-white"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Browse Alumni
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If a connection is selected, show the chat
  return (
    <div className="flex-1 bg-white flex flex-col h-full min-h-0">
      <ConnectionChat 
        connectionId={selectedConnectionId} 
        onBack={onBack}
        className="flex-1"
      />
    </div>
  );
} 