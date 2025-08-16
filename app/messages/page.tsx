'use client';

import { useState, useEffect } from 'react';
import { useConnections } from '@/lib/hooks/useConnections';
import { useAuth } from '@/lib/supabase/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserAvatar } from '@/components/UserAvatar';
import { MessageCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ConnectionChat } from '@/components/messaging/ConnectionChat';

export default function MessagesPage() {
  const { user } = useAuth();
  const { connections, loading } = useConnections();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);

  const acceptedConnections = connections.filter(conn => conn.status === 'accepted');

  // Check for connection query parameter on mount
  useEffect(() => {
    const connectionParam = searchParams.get('connection');
    if (connectionParam) {
      setSelectedConnection(connectionParam);
    }
  }, [searchParams]);

  const handleConnectionClick = (connectionId: string) => {
    setSelectedConnection(connectionId);
  };

  const handleBack = () => {
    setSelectedConnection(null);
  };

  if (selectedConnection) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto h-screen">
          <ConnectionChat
            connectionId={selectedConnection}
            onBack={handleBack}
            className="h-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-500 mt-1">
              Connect with your network through direct messaging
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600"></div>
            </div>
          ) : acceptedConnections.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No connections yet</h3>
              <p className="text-gray-500 mb-4">
                You need to have accepted connections to start messaging.
              </p>
              <Button
                onClick={() => router.push('/dashboard/alumni')}
                className="bg-navy-600 hover:bg-navy-700 text-white"
              >
                Browse Alumni
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Your Connections ({acceptedConnections.length})
              </h2>
              
              <div className="grid gap-4">
                {acceptedConnections.map((connection) => {
                  const otherUser = connection.requester_id === user?.id 
                    ? connection.recipient 
                    : connection.requester;
                  
                  return (
                    <Card
                      key={connection.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleConnectionClick(connection.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <UserAvatar
                            user={{
                              id: otherUser.id,
                              full_name: otherUser.full_name,
                              avatar_url: otherUser.avatar_url
                            }}
                            size="md"
                          />
                          
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {otherUser.full_name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {otherUser.chapter ? `${otherUser.chapter} Chapter` : 'Alumni'}
                            </p>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-navy-600 border-navy-200 hover:bg-navy-50"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 