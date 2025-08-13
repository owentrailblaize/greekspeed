import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ImageWithFallback from "./figma/ImageWithFallback";
import { useConnections } from "@/lib/hooks/useConnections";
import { useAuth } from "@/lib/supabase/auth-context";
import { useState } from "react";
import { 
  UserPlus, 
  Clock, 
  UserX, 
  MessageCircle,
  Check,
  X
} from "lucide-react";

interface MutualConnection {
  name: string;
  avatar?: string;
}

interface LinkedInStyleAlumniCardProps {
  name: string;
  description: string;
  mutualConnections: MutualConnection[];
  mutualConnectionsCount: number;
  avatar?: string;
  verified?: boolean;
  alumniId?: string; // Add alumni ID for connection management
  hasProfile?: boolean; // Indicates if this alumni has a linked profile
}

export function LinkedInStyleAlumniCard({
  name,
  description,
  mutualConnections,
  mutualConnectionsCount,
  avatar,
  verified = false,
  alumniId,
  hasProfile,
}: LinkedInStyleAlumniCardProps) {
  const { user } = useAuth();
  const { 
    sendConnectionRequest, 
    updateConnectionStatus, 
    cancelConnectionRequest, 
    getConnectionStatus,
    getConnectionId
  } = useConnections();
  const [connectionLoading, setConnectionLoading] = useState(false);

  const handleConnectionAction = async (action: 'connect' | 'accept' | 'decline' | 'cancel') => {
    if (!user || !alumniId) return;
    
    setConnectionLoading(true);
    try {
      switch (action) {
        case 'connect':
          await sendConnectionRequest(alumniId, 'Would love to connect!');
          break;
        case 'accept':
          const connectionId = getConnectionId(alumniId);
          if (connectionId) {
            await updateConnectionStatus(connectionId, 'accepted');
          }
          break;
        case 'decline':
          const declineConnectionId = getConnectionId(alumniId);
          if (declineConnectionId) {
            await updateConnectionStatus(declineConnectionId, 'declined');
          }
          break;
        case 'cancel':
          const cancelConnectionId = getConnectionId(alumniId);
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

  const renderConnectionButton = () => {
    if (!user || !alumniId || user.id === alumniId) return null;
    
    // Don't show connection button if alumni doesn't have a linked profile
    if (!hasProfile) {
      return (
        <Button
          className="w-full text-gray-400 border-gray-200 rounded-full font-medium"
          variant="outline"
          disabled
        >
          No Profile
        </Button>
      );
    }
    
    const status = getConnectionStatus(alumniId);
    const isLoading = connectionLoading;

    switch (status) {
      case 'none':
        return (
          <Button
            onClick={() => handleConnectionAction('connect')}
            disabled={isLoading}
            className="w-full border border-navy-600 text-navy-600 bg-white hover:bg-navy-50 transition-colors duration-200 rounded-full font-medium"
            variant="outline"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b border-navy-600 mr-2" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            + Connect
          </Button>
        );
      
      case 'pending_sent':
        return (
          <Button
            onClick={() => handleConnectionAction('cancel')}
            disabled={isLoading}
            className="w-full border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 transition-colors duration-200 rounded-full font-medium"
            variant="outline"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b border-gray-600 mr-2" />
            ) : (
              <Clock className="h-4 w-4 mr-2" />
            )}
            Requested
          </Button>
        );
      
      case 'pending_received':
        return (
          <div className="flex space-x-2">
            <Button
              onClick={() => handleConnectionAction('accept')}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-full font-medium"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b border-white mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Accept
            </Button>
            <Button
              onClick={() => handleConnectionAction('decline')}
              disabled={isLoading}
              className="flex-1 border border-red-300 text-red-600 bg-white hover:bg-red-50 rounded-full font-medium"
              variant="outline"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b border-red-600 mr-2" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Decline
            </Button>
          </div>
        );
      
      case 'accepted':
        return (
          <Button
            className="w-full bg-green-50 text-green-700 border-green-300 rounded-full font-medium"
            variant="outline"
            disabled
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Connected
          </Button>
        );
      
      case 'declined':
        return (
          <Button
            className="w-full text-gray-400 border-gray-200 rounded-full font-medium"
            variant="outline"
            disabled
          >
            <UserX className="h-4 w-4 mr-2" />
            Declined
          </Button>
        );
      
      default:
        return null;
    }
  };
  return (
    <Card className="bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-200 overflow-hidden group">
      <CardContent className="p-0">
        {/* Header */}
        <div className="h-16 bg-gradient-to-r from-navy-100 to-blue-100 relative" />

        <div className="px-4 pb-4 -mt-8 relative">
          {/* Avatar */}
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden relative">
              {avatar ? (
                <ImageWithFallback src={avatar} alt={name} width={64} height={64}className="w-full h-full object-cover" />
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

          <div className="text-center mb-2">
            <h3 className="font-semibold text-gray-900 inline-flex items-center gap-1">
              {name}
              {verified && <Badge className="bg-blue-500 text-white">✔</Badge>}
            </h3>
          </div>

          <p className="text-sm text-gray-600 text-center mb-4 leading-relaxed">{description}</p>

          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="flex -space-x-1">
              {Array.isArray(mutualConnections) && mutualConnections.slice(0, 3).map((c, i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-gray-200 relative">
                  {c.avatar ? (
                    <ImageWithFallback src={c.avatar} alt={c.name || 'Unknown'} width={64} height={64} className="w-full h-full object-cover" />
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
            <span className="text-sm text-gray-600">
              {Array.isArray(mutualConnections) && mutualConnections.length > 0 
                ? `${mutualConnections[0]?.name || 'Unknown'} and ${mutualConnectionsCount - 1} other mutual connections`
                : 'No mutual connections'
              }
            </span>
          </div>

          {renderConnectionButton()}
        </div>
      </CardContent>
    </Card>
  );
}