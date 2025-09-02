import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChapterMember } from "@/types/chapter"; // Use the main types file
import { MessageCircle, UserPlus, Clock, Shield } from "lucide-react";
import { useConnections } from "@/lib/hooks/useConnections";
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
  const memberDescription = description || 'Chapter Member';
  
  // Generate mutual connections data if not provided
  const connections = [
    { name: "Chapter Member", avatar: undefined },
    { name: "Alumni", avatar: undefined }
  ];
  const connectionsCount = 5;

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
            className="w-full border border-navy-600 text-navy-600 bg-white hover:bg-navy-50 transition-colors duration-200 rounded-full font-medium h-8 sm:h-10 text-xs sm:text-sm"
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
            className="w-full border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 transition-colors duration-200 rounded-full font-medium h-8 sm:h-10 flex items-center justify-center text-xs sm:text-sm"
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
              className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-full font-medium h-8 sm:h-10 text-xs sm:text-sm"
            >
              Accept
            </Button>
            <Button
              onClick={(e) => handleConnectionAction('decline', e)}
              disabled={isLoading}
              className="flex-1 border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 rounded-full font-medium h-8 sm:h-10 text-xs sm:text-sm"
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
            className="w-full bg-navy-600 hover:bg-navy-700 text-white rounded-full font-medium h-8 sm:h-10 text-xs sm:text-sm"
          >
            <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Message
          </Button>
        );
      
      default:
        return (
          <Button
            onClick={(e) => handleConnectionAction('connect', e)}
            className="w-full border border-navy-600 text-navy-600 bg-white hover:bg-navy-50 transition-colors duration-200 rounded-full font-medium h-8 sm:h-10 text-xs sm:text-sm"
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
        <div className="h-16 bg-gradient-to-r from-navy-100 to-blue-100" />

        <div className="px-4 pb-4 -mt-8 relative flex-1 flex flex-col">
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden relative">
              {avatar ? (
                <img 
                  src={avatar} 
                  alt={name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-navy-500 to-navy-600 flex items-center justify-center">
                  <span className="text-white font-medium text-lg">
                    {name
                      ?.split(" ")
                      ?.map((n) => n[0])
                      ?.join("") || "?"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Name and Verification */}
          <div className="text-center mb-3">
            <h3 className="font-semibold text-gray-900 inline-flex items-center gap-1 text-lg leading-tight">
              {name}
              {verified && (
                <Badge className="bg-blue-500 text-white text-xs p-1 ml-1 flex-shrink-0">
                  <Shield className="h-3 w-4" />
                </Badge>
              )}
            </h3>
          </div>

          {/* Position and Description */}
          <div className="text-center mb-4">
            {position && position !== 'Member' && (
              <p className="text-sm font-medium text-navy-600 mb-2 leading-tight">{position}</p>
            )}
            <p className="text-sm text-gray-600 leading-relaxed">{memberDescription}</p>
          </div>

          {/* Mutual Connections */}
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="flex -space-x-1">
              {connections.slice(0, 3).map((c, i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-gray-200 relative">
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
            <span className="text-sm text-gray-600 leading-tight">
              {connections.length > 0 
                ? `${connections[0]?.name || 'Unknown'} and ${connectionsCount - 1} other connections`
                : 'Chapter member'
              }
            </span>
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