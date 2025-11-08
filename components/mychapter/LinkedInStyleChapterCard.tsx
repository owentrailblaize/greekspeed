import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChapterMember } from "@/types/chapter"; // Use the main types file
import { MessageCircle, UserPlus, Clock, Shield } from "lucide-react";
import { useConnections } from "@/lib/contexts/ConnectionsContext";
import { useAuth } from "@/lib/supabase/auth-context";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface LinkedInStyleChapterCardProps {
  member: ChapterMember;
}

export function LinkedInStyleChapterCard({ member }: LinkedInStyleChapterCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { 
    sendConnectionRequest, 
    updateConnectionStatus, 
    cancelConnectionRequest, 
    getConnectionStatus,
    getConnectionId
  } = useConnections();
  const [connectionLoading, setConnectionLoading] = useState(false);

  const {
    id,
    name,
    year,
    major,
    position,
    avatar,
    verified = false,
    description
  } = member;

  // Generate description if not provided
  const memberDescription = description || '';
  
  // Use mutual connections from member prop (already calculated by API)
  const mutualConnections = member.mutualConnections || [];
  const connectionsCount = member.mutualConnectionsCount || 0;
  const mutualLoading = false; // No longer loading since it comes from API

  const handleConnectionAction = async (action: 'connect' | 'accept' | 'decline' | 'cancel', e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user || user.id === id) return;
    
    setConnectionLoading(true);
    try {
      switch (action) {
        case 'connect':
          await sendConnectionRequest(id, 'Would love to connect with a fellow chapter member!');
          break;
        case 'accept':
          const connectionId = getConnectionId(id);
          if (connectionId) {
            await updateConnectionStatus(connectionId, 'accepted');
          }
          break;
        case 'decline':
          const declineConnectionId = getConnectionId(id);
          if (declineConnectionId) {
            await updateConnectionStatus(declineConnectionId, 'declined');
          }
          break;
        case 'cancel':
          const cancelConnectionId = getConnectionId(id);
          if (cancelConnectionId) {
            await cancelConnectionRequest(cancelConnectionId);
          }
          break;
      }
    } catch (error) {
      console.error('Connection action failed:', error);
    } finally {
      setConnectionLoading(false);
    }
  };

  const handleMessageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const connectionId = getConnectionId(id);
    if (connectionId) {
      router.push(`/dashboard/messages?connection=${connectionId}`);
    }
  };

  const renderConnectionButton = () => {
    if (!user || user.id === id) return null;
    
    const status = getConnectionStatus(id);
    const isLoading = connectionLoading;

    switch (status) {
      case 'none':
        return (
          <Button
            onClick={(e) => handleConnectionAction('connect', e)}
            disabled={isLoading}
            className="w-full border border-navy-600 text-navy-600 bg-white hover:bg-navy-50 transition-colors duration-200 rounded-full font-medium h-7 sm:h-10 text-xs sm:text-sm"
            variant="outline"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b border-navy-600 mr-1 sm:mr-2" />
            ) : (
              <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            )}
            Connect
          </Button>
        );
      
      case 'pending_sent':
        return (
          <Button
            onClick={(e) => handleConnectionAction('cancel', e)}
            disabled={isLoading}
            className="w-full border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 transition-colors duration-200 rounded-full font-medium h-7 sm:h-10 flex items-center justify-center text-xs sm:text-sm"
            variant="outline"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b border-gray-600 mr-1 sm:mr-2" />
            ) : (
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            )}
            Requested
          </Button>
        );
      
      case 'pending_received':
        return (
          <div className="flex space-x-2">
            <Button
              onClick={(e) => handleConnectionAction('accept', e)}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-full font-medium h-7 sm:h-10 text-xs sm:text-sm"
            >
              Accept
            </Button>
            <Button
              onClick={(e) => handleConnectionAction('decline', e)}
              disabled={isLoading}
              className="flex-1 border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 rounded-full font-medium h-7 sm:h-10 text-xs sm:text-sm"
              variant="outline"
            >
              Decline
            </Button>
          </div>
        );
      
      case 'accepted':
        return (
          <Button
            onClick={handleMessageClick}
            className="w-full text-white rounded-full font-medium h-7 sm:h-10 text-xs sm:text-sm flex items-center justify-center shadow-sm border border-blue-300/20"
            style={{
              background: 'linear-gradient(340deg, rgba(228, 236, 255, 1) 0%, rgba(130, 130, 255, 0.95) 34%, rgba(35, 70, 224, 0.93) 85%)'
            }}
          >
            <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
            Connected
          </Button>
        );
      
      default:
        return (
          <Button
            onClick={(e) => handleConnectionAction('connect', e)}
            className="w-full border border-navy-600 text-navy-600 bg-white hover:bg-navy-50 transition-colors duration-200 rounded-full font-medium h-7 sm:h-10 text-xs sm:text-sm"
            variant="outline"
          >
            <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Connect
          </Button>
        );
    }
  };

  return (
    <Card className="bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-200 overflow-hidden group h-full flex flex-col">
      <CardContent className="!p-0 flex flex-col h-full">
        {/* Header Banner */}
        <div className="h-8 sm:h-16 bg-gradient-to-r from-navy-100 to-blue-100" />

        <div className="px-1 sm:px-4 pb-1 sm:pb-4 -mt-4 sm:-mt-8 relative flex-1 flex flex-col">
          {/* Avatar */}
          <div className="flex justify-center mb-1 sm:mb-4">
            <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full border-2 sm:border-4 border-white bg-white shadow-sm overflow-hidden relative">
              {avatar ? (
                <img 
                  src={avatar} 
                  alt={name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-navy-500 to-navy-600 flex items-center justify-center">
                  <span className="text-white font-medium text-xs sm:text-lg">
                    {name
                      ?.split(" ")
                      ?.map((n) => n[0])
                      ?.join("") || "?"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="text-center mb-1 sm:mb-3">
            <h3 className="font-semibold text-gray-900 text-xs sm:text-lg leading-tight">
              <span className="break-words">{name}</span>
            </h3>
          </div>

          {/* Year Badge - Only show on desktop */}
          <div className="text-center mb-1 hidden sm:block">
            {year && (
              <Badge 
                variant="secondary" 
                className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 px-1 py-0.5 flex-shrink-0"
              >
                {year}
              </Badge>
            )}
          </div>

          {/* Position and Description */}
          <div className="text-center mb-1 sm:mb-4">
            {/* Position - Show on both mobile and desktop */}
            {position && position !== 'Member' && (
              <p className="text-xs sm:text-sm font-medium text-navy-600 mb-0.5 sm:mb-2 leading-tight truncate">{position}</p>
            )}
            {/* Bio - Show on desktop only */}
            <p className="hidden sm:block text-xs sm:text-sm text-gray-600 leading-relaxed">{memberDescription}</p>
          </div>

          {/* Mutual Connections */}
          <div className="flex flex-col items-center justify-center space-y-1 sm:space-y-2 mb-2 sm:mb-6">
            {mutualLoading ? (
              <div className="text-xs text-gray-400">Loading...</div>
            ) : (
              <>
                <div className="flex -space-x-1 justify-center">
                  {mutualConnections.slice(0, 3).map((c, i) => (
                    <div key={c.id || `mutual-${i}`} className="w-4 h-4 sm:w-6 sm:h-6 rounded-full border-2 border-white overflow-hidden bg-gray-200 relative">
                      {c.avatar ? (
                        <img 
                          src={c.avatar} 
                          alt={c.name || 'Unknown'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                          <span className="text-white text-xs">
                            {c.name
                              ?.split(" ")
                              ?.map((n) => n[0])
                              ?.join("") || "?"}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <span className="text-xs sm:text-sm text-gray-600 leading-tight text-center">
                  {connectionsCount > 0 
                    ? `${connectionsCount} mutual connection${connectionsCount !== 1 ? 's' : ''}`
                    : ''
                  }
                </span>
              </>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-auto pt-2">
            {renderConnectionButton()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 