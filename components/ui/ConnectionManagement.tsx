'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useConnections } from '@/lib/contexts/ConnectionsContext';
import { useAuth } from '@/lib/supabase/auth-context';
import { Check, X, UserPlus, Users, Clock, UserX } from 'lucide-react';
import { ClickableAvatar } from '@/components/features/user-profile/ClickableAvatar';
import { ClickableUserName } from '@/components/features/user-profile/ClickableUserName';

interface ConnectionManagementProps {
  variant?: 'desktop' | 'mobile';
  className?: string;
}

export function ConnectionManagement({ variant = 'desktop', className = '' }: ConnectionManagementProps) {
  const { user } = useAuth();
  const { 
    connections, 
    loading, 
    updateConnectionStatus, 
    refreshConnections 
  } = useConnections();
  
  const [processingId, setProcessingId] = useState<string | null>(null);

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
    if (!user) return { name: 'Unknown', initials: 'U', avatar: null, id: null, firstName: null, lastName: null };
    const partner = connection.requester_id === user.id ? connection.recipient : connection.requester;
    return {
      name: partner.full_name || 'Unknown User',
      initials: partner.full_name?.charAt(0) || 'U',
      avatar: partner.avatar_url,
      id: partner.id || null,
      firstName: partner.first_name || null,
      lastName: partner.last_name || null
    };
  };

  // Mobile-specific styling
  const isMobile = variant === 'mobile';
  const cardPadding = isMobile ? 'p-3' : 'p-4';
  const avatarSize = isMobile ? 'w-10 h-10' : 'w-12 h-12';
  const buttonSize = isMobile ? 'h-7 px-2' : 'h-8 px-3';
  const textSize = isMobile ? 'text-sm' : 'text-base';
  const iconSize = isMobile ? 'h-3 w-3' : 'h-4 w-4';
  const tabTextSize = isMobile ? 'text-xs' : 'text-sm';

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy-600" />
            <span className="ml-2 text-gray-600">Loading connections...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className={isMobile ? 'pb-3' : 'pb-4'}>
        <CardTitle className={`${textSize} flex items-center space-x-2`}>
          <Users className={`${iconSize} text-navy-600`} />
          <span>Connection Management</span>
        </CardTitle>
      </CardHeader>
      <CardContent className={isMobile ? 'pt-0' : 'pt-2'}>
        <Tabs defaultValue="pending" className="w-full">
          {isMobile ? (
            // Mobile: Wrap TabsList in overflow container
            <div className="mb-4 overflow-x-auto">
              <TabsList className="flex w-max min-w-full">
                <TabsTrigger value="pending" className={`flex items-center space-x-1 ${tabTextSize} flex-shrink-0`}>
                  <Clock className={iconSize} />
                  <span>Pending ({pendingRequests.length})</span>
                </TabsTrigger>
                <TabsTrigger value="sent" className={`flex items-center space-x-1 ${tabTextSize} flex-shrink-0`}>
                  <UserPlus className={iconSize} />
                  <span>Sent ({sentRequests.length})</span>
                </TabsTrigger>
                <TabsTrigger value="connected" className={`flex items-center space-x-1 ${tabTextSize} flex-shrink-0`}>
                  <Users className={iconSize} />
                  <span>Connected ({acceptedConnections.length})</span>
                </TabsTrigger>
                <TabsTrigger value="declined" className={`flex items-center space-x-1 ${tabTextSize} flex-shrink-0`}>
                  <UserX className={iconSize} />
                  <span>Declined ({declinedConnections.length})</span>
                </TabsTrigger>
              </TabsList>
            </div>
          ) : (
            // Desktop: Original grid layout
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="pending" className={`flex items-center space-x-1 ${tabTextSize}`}>
                <Clock className={iconSize} />
                <span>Pending ({pendingRequests.length})</span>
              </TabsTrigger>
              <TabsTrigger value="sent" className={`flex items-center space-x-1 ${tabTextSize}`}>
                <UserPlus className={iconSize} />
                <span>Sent ({sentRequests.length})</span>
              </TabsTrigger>
              <TabsTrigger value="connected" className={`flex items-center space-x-1 ${tabTextSize}`}>
                <Users className={iconSize} />
                <span>Connected ({acceptedConnections.length})</span>
              </TabsTrigger>
              <TabsTrigger value="declined" className={`flex items-center space-x-1 ${tabTextSize}`}>
                <UserX className={iconSize} />
                <span>Declined ({declinedConnections.length})</span>
              </TabsTrigger>
            </TabsList>
          )}

          {/* Pending Requests Tab */}
          <TabsContent value="pending" className={isMobile ? 'mt-4' : 'mt-6'}>
            {pendingRequests.length === 0 ? (
              <div className={`text-center ${isMobile ? 'py-6' : 'py-8'} text-gray-500`}>
                <UserPlus className={`${isMobile ? 'h-8 w-8' : 'h-12 w-12'} mx-auto mb-2 text-gray-300`} />
                <p className={textSize}>No pending requests</p>
                {!isMobile && (
                  <p className="text-sm mt-1">When someone sends you a connection request, it will appear here</p>
                )}
              </div>
            ) : (
              <div className={`space-y-${isMobile ? '3' : '4'}`}>
                {pendingRequests.map((connection) => {
                  const partner = getConnectionPartner(connection);
                  return (
                    <div key={connection.id} className={`flex items-center justify-between ${cardPadding} border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors`}>
                      <div className="flex items-center space-x-3">
                        {partner.id ? (
                          <ClickableAvatar
                            userId={partner.id}
                            avatarUrl={partner.avatar}
                            fullName={partner.name}
                            firstName={partner.firstName}
                            lastName={partner.lastName}
                            size={isMobile ? 'sm' : 'md'}
                            className={avatarSize}
                          />
                        ) : (
                          <div className={`${avatarSize} bg-navy-100 rounded-full flex items-center justify-center text-navy-600 ${textSize} font-semibold`}>
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
                        )}
                        <div>
                          {partner.id ? (
                            <ClickableUserName
                              userId={partner.id}
                              fullName={isMobile ? partner.name : `Connection Request from ${partner.name}`}
                              className={`font-medium text-gray-900 ${textSize}`}
                            />
                          ) : (
                            <p className={`font-medium text-gray-900 ${textSize}`}>
                              {isMobile ? partner.name : `Connection Request from ${partner.name}`}
                            </p>
                          )}
                          {connection.message && (
                            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mt-1`}>{connection.message}</p>
                          )}
                          {!isMobile && (
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(connection.created_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className={`flex space-x-${isMobile ? '1' : '2'}`}>
                        <Button
                          size="sm"
                          onClick={() => handleConnectionAction(connection.id, 'accept')}
                          disabled={processingId === connection.id}
                          className={`bg-green-600 hover:bg-green-700 text-white ${buttonSize}`}
                        >
                          {processingId === connection.id ? (
                            <div className={`animate-spin rounded-full ${iconSize} border-b border-white`} />
                          ) : (
                            <>
                              <Check className={`${iconSize} ${!isMobile ? 'mr-1' : ''}`} />
                              {!isMobile && 'Accept'}
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConnectionAction(connection.id, 'decline')}
                          disabled={processingId === connection.id}
                          className={`text-red-600 border-red-300 hover:bg-red-50 ${buttonSize}`}
                        >
                          {processingId === connection.id ? (
                            <div className={`animate-spin rounded-full ${iconSize} border-b border-red-600`} />
                          ) : (
                            <>
                              <X className={`${iconSize} ${!isMobile ? 'mr-1' : ''}`} />
                              {!isMobile && 'Decline'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Sent Requests Tab */}
          <TabsContent value="sent" className={isMobile ? 'mt-4' : 'mt-6'}>
            {sentRequests.length === 0 ? (
              <div className={`text-center ${isMobile ? 'py-6' : 'py-8'} text-gray-500`}>
                <UserPlus className={`${isMobile ? 'h-8 w-8' : 'h-12 w-12'} mx-auto mb-2 text-gray-300`} />
                <p className={textSize}>No sent requests</p>
                {!isMobile && (
                  <p className="text-sm mt-1">Your outgoing connection requests will appear here</p>
                )}
              </div>
            ) : (
              <div className={`space-y-${isMobile ? '3' : '4'}`}>
                {sentRequests.map((connection) => {
                  const partner = getConnectionPartner(connection);
                  return (
                    <div key={connection.id} className={`flex items-center justify-between ${cardPadding} border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors`}>
                      <div className="flex items-center space-x-3">
                        {partner.id ? (
                          <ClickableAvatar
                            userId={partner.id}
                            avatarUrl={partner.avatar}
                            fullName={partner.name}
                            firstName={partner.firstName}
                            lastName={partner.lastName}
                            size={isMobile ? 'sm' : 'md'}
                            className={avatarSize}
                          />
                        ) : (
                          <div className={`${avatarSize} bg-navy-100 rounded-full flex items-center justify-center text-navy-600 ${textSize} font-semibold`}>
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
                        )}
                        <div>
                          {partner.id ? (
                            <ClickableUserName
                              userId={partner.id}
                              fullName={isMobile ? `Request sent to ${partner.name}` : `Request sent to ${partner.name}`}
                              className={`font-medium text-gray-900 ${textSize}`}
                            />
                          ) : (
                            <p className={`font-medium text-gray-900 ${textSize}`}>
                              {isMobile ? `Request sent to ${partner.name}` : `Request sent to ${partner.name}`}
                            </p>
                          )}
                          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mt-1`}>
                            {new Date(connection.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={tabTextSize}>
                        Pending
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Connected Tab */}
          <TabsContent value="connected" className={isMobile ? 'mt-4' : 'mt-6'}>
            {acceptedConnections.length === 0 ? (
              <div className={`text-center ${isMobile ? 'py-6' : 'py-8'} text-gray-500`}>
                <Users className={`${isMobile ? 'h-8 w-8' : 'h-12 w-12'} mx-auto mb-2 text-gray-300`} />
                <p className={textSize}>No connections yet</p>
                {!isMobile && (
                  <p className="text-sm mt-1">Your accepted connections will appear here</p>
                )}
              </div>
            ) : (
              <div className={`space-y-${isMobile ? '3' : '4'}`}>
                {acceptedConnections.map((connection) => {
                  const partner = getConnectionPartner(connection);
                  return (
                    <div key={connection.id} className={`flex items-center justify-between ${cardPadding} border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors`}>
                      <div className="flex items-center space-x-3">
                        {partner.id ? (
                          <ClickableAvatar
                            userId={partner.id}
                            avatarUrl={partner.avatar}
                            fullName={partner.name}
                            firstName={partner.firstName}
                            lastName={partner.lastName}
                            size={isMobile ? 'sm' : 'md'}
                            className={avatarSize}
                          />
                        ) : (
                          <div className={`${avatarSize} bg-navy-100 rounded-full flex items-center justify-center text-navy-600 ${textSize} font-semibold`}>
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
                        )}
                        <div>
                          {partner.id ? (
                            <ClickableUserName
                              userId={partner.id}
                              fullName={partner.name}
                              className={`font-medium text-gray-900 ${textSize}`}
                            />
                          ) : (
                            <p className={`font-medium text-gray-900 ${textSize}`}>
                              {partner.name}
                            </p>
                          )}
                          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mt-1`}>
                            Connected {new Date(connection.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge className={`bg-green-100 text-green-800 ${tabTextSize}`}>
                        Connected
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Declined Tab */}
          <TabsContent value="declined" className={isMobile ? 'mt-4' : 'mt-6'}>
            {declinedConnections.length === 0 ? (
              <div className={`text-center ${isMobile ? 'py-6' : 'py-8'} text-gray-500`}>
                <UserX className={`${isMobile ? 'h-8 w-8' : 'h-12 w-12'} mx-auto mb-2 text-gray-300`} />
                <p className={textSize}>No declined requests</p>
                {!isMobile && (
                  <p className="text-sm mt-1">Declined connection requests will appear here</p>
                )}
              </div>
            ) : (
              <div className={`space-y-${isMobile ? '3' : '4'}`}>
                {declinedConnections.map((connection) => {
                  const partner = getConnectionPartner(connection);
                  return (
                    <div key={connection.id} className={`flex items-center justify-between ${cardPadding} border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors`}>
                      <div className="flex items-center space-x-3">
                        {partner.id ? (
                          <ClickableAvatar
                            userId={partner.id}
                            avatarUrl={partner.avatar}
                            fullName={partner.name}
                            firstName={partner.firstName}
                            lastName={partner.lastName}
                            size={isMobile ? 'sm' : 'md'}
                            className={avatarSize}
                          />
                        ) : (
                          <div className={`${avatarSize} bg-navy-100 rounded-full flex items-center justify-center text-navy-600 ${textSize} font-semibold`}>
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
                        )}
                        <div>
                          {partner.id ? (
                            <ClickableUserName
                              userId={partner.id}
                              fullName={partner.name}
                              className={`font-medium text-gray-900 ${textSize}`}
                            />
                          ) : (
                            <p className={`font-medium text-gray-900 ${textSize}`}>
                              {partner.name}
                            </p>
                          )}
                          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mt-1`}>
                            Declined {new Date(connection.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-red-600 border-red-300 ${tabTextSize}`}>
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
  );
}
