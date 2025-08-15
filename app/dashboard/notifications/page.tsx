'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useConnections } from '@/lib/hooks/useConnections';
import { useAuth } from '@/lib/supabase/auth-context';
import { Check, X, UserPlus, Users, Clock, MessageCircle, UserX, Search, Bell, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { 
    connections, 
    loading, 
    updateConnectionStatus, 
    refreshConnections 
  } = useConnections();
  
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredConnections = (connections: any[]) => {
    if (!searchTerm) return connections;
    return connections.filter(conn => 
      getConnectionPartner(conn).name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
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
          <h1 className="text-2xl font-bold text-navy-900">Notifications</h1>
          <p className="text-gray-600">Manage your connections and stay updated on important activities</p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search connections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Main Content Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-navy-600" />
              <span>Connection Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="pending" className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Pending ({pendingRequests.length})</span>
                </TabsTrigger>
                <TabsTrigger value="sent" className="flex items-center space-x-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Sent ({sentRequests.length})</span>
                </TabsTrigger>
                <TabsTrigger value="connected" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Connected ({acceptedConnections.length})</span>
                </TabsTrigger>
                <TabsTrigger value="declined" className="flex items-center space-x-2">
                  <UserX className="h-4 w-4" />
                  <span>Declined ({declinedConnections.length})</span>
                </TabsTrigger>
              </TabsList>

              {/* Pending Requests Tab */}
              <TabsContent value="pending" className="mt-6">
                {filteredConnections(pendingRequests).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <UserPlus className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No pending connection requests</p>
                    <p className="text-sm">When someone sends you a connection request, it will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredConnections(pendingRequests).map((connection) => {
                      const partner = getConnectionPartner(connection);
                      return (
                        <div key={connection.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-sm font-semibold">
                              {partner.avatar ? (
                                <img 
                                  src={partner.avatar} 
                                  alt={partner.name}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                partner.initials
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                Connection Request from {partner.name}
                              </p>
                              {connection.message && (
                                <p className="text-sm text-gray-600 mt-1">{connection.message}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(connection.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleConnectionAction(connection.id, 'accept')}
                              disabled={processingId === connection.id}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {processingId === connection.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b border-white" />
                              ) : (
                                <Check className="h-4 w-4 mr-1" />
                              )}
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConnectionAction(connection.id, 'decline')}
                              disabled={processingId === connection.id}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              {processingId === connection.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b border-red-600" />
                              ) : (
                                <X className="h-4 w-4 mr-1" />
                              )}
                              Decline
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Sent Requests Tab */}
              <TabsContent value="sent" className="mt-6">
                {filteredConnections(sentRequests).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <UserPlus className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No sent connection requests</p>
                    <p className="text-sm">Your sent requests will appear here while waiting for a response</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredConnections(sentRequests).map((connection) => {
                      const partner = getConnectionPartner(connection);
                      return (
                        <div key={connection.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-sm font-semibold">
                              {partner.avatar ? (
                                <img 
                                  src={partner.avatar} 
                                  alt={partner.name}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                partner.initials
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                Request sent to {partner.name}
                              </p>
                              {connection.message && (
                                <p className="text-sm text-gray-600 mt-1">{connection.message}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                Sent {new Date(connection.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Connected Tab */}
              <TabsContent value="connected" className="mt-6">
                {filteredConnections(acceptedConnections).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No connections yet</p>
                    <p className="text-sm">Accepted connections will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredConnections(acceptedConnections).map((connection) => {
                      const partner = getConnectionPartner(connection);
                      return (
                        <div key={connection.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-semibold">
                              {partner.avatar ? (
                                <img 
                                  src={partner.avatar} 
                                  alt={partner.name}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                partner.initials
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                Connected with {partner.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Connected {new Date(connection.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Declined Tab */}
              <TabsContent value="declined" className="mt-6">
                {filteredConnections(declinedConnections).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <UserX className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No declined connections</p>
                    <p className="text-sm">Declined connection requests will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredConnections(declinedConnections).map((connection) => {
                      const partner = getConnectionPartner(connection);
                      return (
                        <div key={connection.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-sm font-semibold">
                              {partner.avatar ? (
                                <img 
                                  src={partner.avatar} 
                                  alt={partner.name}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                partner.initials
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                Declined connection with {partner.name}...
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Declined {new Date(connection.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-red-100 text-red-800">
                            <UserX className="h-3 w-3 mr-1" />
                            Declined
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Future Notification Types Placeholder */}
        <div className="mt-8">
          <Card className="bg-navy-50 border-navy-200">
            <CardHeader>
              <CardTitle className="text-navy-900 text-lg">Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-navy-700 mb-3">
                More notification types will be added here, including:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-navy-600">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Direct messages</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Chapter updates</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Event reminders</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Document updates</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 