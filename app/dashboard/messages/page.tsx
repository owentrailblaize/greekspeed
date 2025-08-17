'use client';
export const dynamic = "force-dynamic";

import { useState, useEffect } from 'react';
import { useConnections } from '@/lib/hooks/useConnections';
import { ConnectionChat } from '@/components/messaging/ConnectionChat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';
import { MessageSquare } from 'lucide-react';

export default function MessagesPage() {
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const { connections, loading } = useConnections();

  const handleConnectionClick = (connectionId: string) => {
    setSelectedConnectionId(connectionId);
  };

  const handleBack = () => {
    setSelectedConnectionId(null);
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

  if (selectedConnectionId) {
    return (
      <div className="h-full flex flex-col">
        <ConnectionChat 
          connectionId={selectedConnectionId} 
          onBack={handleBack}
          className="flex-1"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600 mt-2">
          Connect with your network through direct messaging
        </p>
      </div>

      {/* Connections List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <span>Your Connections ({connections.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading connections...</p>
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No connections yet</h3>
              <p className="text-gray-600 mb-4">
                Connect with alumni to start messaging
              </p>
              <Button onClick={() => window.location.href = '/dashboard/alumni'}>
                Browse Alumni
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {connections.map((connection) => {
                const otherUser = connection.requester.id === 'current-user-id' 
                  ? connection.recipient 
                  : connection.requester;
                
                return (
                  <div
                    key={connection.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleConnectionClick(connection.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <UserAvatar
                        user={{ 
                          email: null, 
                          user_metadata: { 
                            avatar_url: otherUser.avatar_url, 
                            full_name: otherUser.full_name 
                          } 
                        }}
                        completionPercent={100}
                        hasUnread={false}
                        size="md"
                      />
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {otherUser.full_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {otherUser.chapter || 'Chapter not specified'}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="flex items-center space-x-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnectionClick(connection.id);
                      }}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Message</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}