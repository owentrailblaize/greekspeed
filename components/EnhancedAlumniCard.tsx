import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alumni } from "@/lib/mockAlumni";
import { MessageCircle, UserPlus, Shield, Building2, MapPin, GraduationCap, Clock } from "lucide-react";
import ImageWithFallback from "./figma/ImageWithFallback";
import { useConnections } from "@/lib/hooks/useConnections";
import { useAuth } from "@/lib/supabase/auth-context";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClickableField } from './ClickableField';

interface EnhancedAlumniCardProps {
  alumni: Alumni;
  onClick?: (alumni: Alumni) => void;
}

export function EnhancedAlumniCard({ alumni, onClick }: EnhancedAlumniCardProps) {
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

  const handleConnectionAction = async (action: 'connect' | 'accept' | 'decline' | 'cancel', e: React.MouseEvent) => {
    // Stop event propagation to prevent card click from triggering
    e.stopPropagation();
    
    if (!user || user.id === alumni.id) return;
    
    setConnectionLoading(true);
    try {
      switch (action) {
        case 'connect':
          await sendConnectionRequest(alumni.id, 'Would love to connect!');
          break;
        case 'accept':
          const connectionId = getConnectionId(alumni.id);
          if (connectionId) {
            await updateConnectionStatus(connectionId, 'accepted');
          }
          break;
        case 'decline':
          const declineConnectionId = getConnectionId(alumni.id);
          if (declineConnectionId) {
            await updateConnectionStatus(declineConnectionId, 'declined');
          }
          break;
        case 'cancel':
          const cancelConnectionId = getConnectionId(alumni.id);
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
    const connectionId = getConnectionId(alumni.id);
    if (connectionId) {
      router.push(`/dashboard/messages?connection=${connectionId}`);
    }
  };

  const renderConnectionButton = () => {
    if (!user || user.id === alumni.id) return null;
    
    if (!alumni.hasProfile) {
      return (
        <Button
          className="w-full text-gray-400 border-gray-200 rounded-full font-medium h-10"
          variant="outline"
          disabled
          onClick={(e) => e.stopPropagation()} // Prevent card click even for disabled button
        >
          No Profile
        </Button>
      );
    }
    
    const status = getConnectionStatus(alumni.id);
    const isLoading = connectionLoading;

    switch (status) {
      case 'none':
        return (
          <Button
            onClick={(e) => handleConnectionAction('connect', e)}
            disabled={isLoading}
            className="w-full border border-navy-600 text-navy-600 bg-white hover:bg-navy-50 transition-colors duration-200 rounded-full font-medium h-10"
            variant="outline"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b border-navy-600 mr-2" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            Connect
          </Button>
        );
      
      case 'pending_sent':
        return (
          <Button
            onClick={(e) => handleConnectionAction('cancel', e)}
            disabled={isLoading}
            className="w-full border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 transition-colors duration-200 rounded-full font-medium h-10 flex items-center justify-center"
            variant="outline"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b border-gray-600 mr-2" />
            ) : (
              <Clock className="h-4 w-4 mr-2" /> // Add Clock icon for pending state
            )}
            Requested
          </Button>
        );
      
      case 'accepted':
        return (
          <Button
            onClick={(e) => handleMessageClick(e)}
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full font-medium h-10"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Connected
          </Button>
        );
      
      default:
        return null;
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(alumni);
    }
  };

  const isValidField = (value: any): boolean => {
    if (!value) return false;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed !== "" && 
             trimmed !== "Not specified" && 
             trimmed !== "N/A" && 
             trimmed !== "Unknown";
    }
    return true;
  };

  return (
    <Card className="bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-200 overflow-hidden group h-full flex flex-col cursor-pointer" onClick={handleCardClick}>
      <CardContent className="!p-0 flex flex-col h-full">
        {/* Header Banner - Remove any margins/padding to touch edges */}
        <div className="h-16 bg-gradient-to-r from-navy-100 to-blue-100" />

        <div className="px-4 pb-4 -mt-8 relative flex-1 flex flex-col">
          {/* Avatar */}
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden relative">
              {alumni.avatar ? (
                <ImageWithFallback 
                  src={alumni.avatar} 
                  alt={alumni.fullName} 
                  width={64} 
                  height={64} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-navy-500 to-navy-600 flex items-center justify-center">
                  <span className="text-white font-medium text-lg">
                    {alumni.firstName?.[0] || ''}{alumni.lastName?.[0] || ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Name and Verification - Stack badges below name in row */}
          <div className="text-center mb-2">
            <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-2">
              {alumni.fullName}
            </h3>
            
            {/* Badges in row below name */}
            <div className="flex flex-row items-center justify-center gap-1">
              {alumni.verified && (
                <Badge className="bg-blue-500 text-white text-xs p-1 flex-shrink-0">
                  <Shield className="h-3 w-3" />
                </Badge>
              )}
              {alumni.isActivelyHiring && (
                <Badge className="bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xs p-1 flex-shrink-0">
                  Hiring
                </Badge>
              )}
            </div>
          </div>

          {/* Job Title and Company - Only show if data exists and is not "Not specified" */}
          {((alumni.jobTitle && alumni.jobTitle !== "Not specified") || 
            (alumni.company && alumni.company !== "Not specified")) && (
            <div className="text-center mb-3">
              {isValidField(alumni.jobTitle) && (
                <p className="text-sm font-medium text-navy-600 mb-1 leading-tight">{alumni.jobTitle}</p>
              )}
              {isValidField(alumni.company) && (
                <div className="flex items-center justify-center space-x-2 text-gray-500 text-sm">
                  <Building2 className="h-3 w-3" />
                  <ClickableField 
                    value={alumni.company} 
                    entityType="company" 
                    className="text-gray-500 hover:text-blue-600"
                  />
                </div>
              )}
            </div>
          )}

          {/* Professional Tags - Only show tags that have valid data */}
          <div className="flex flex-wrap justify-center gap-2 mb-3">
            {isValidField(alumni.industry) && (
              <Badge 
                variant="secondary" 
                className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 px-2 py-1 flex-shrink-0"
              >
                {alumni.industry}
              </Badge>
            )}
            {isValidField(alumni.graduationYear) && (
              <Badge 
                variant="secondary" 
                className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 px-2 py-1 flex-shrink-0"
              >
                {alumni.graduationYear}
              </Badge>
            )}
          </div>

          {/* Chapter - Separate section with distinct styling */}
          {isValidField(alumni.chapter) && (
            <div className="text-center mb-4">
              <ClickableField 
                value={alumni.chapter} 
                entityType="chapter"
                textAlign="center"
                className="text-sm font-medium text-navy-600 hover:text-blue-600 px-3 py-1 rounded-full border border-navy-200 hover:border-blue-300 transition-all duration-200"
              />
            </div>
          )}

          {/* Mutual Connections - Ensure perfect centering */}
          <div className="flex flex-col items-center justify-center space-y-2 mb-4">
            <div className="flex -space-x-1">
              {alumni.mutualConnections && alumni.mutualConnections.slice(0, 3).map((c, i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-gray-200 relative">
                  {c.avatar ? (
                    <ImageWithFallback 
                      src={c.avatar} 
                      alt={c.name || 'Unknown'} 
                      width={24} 
                      height={24} 
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
            <span className="text-sm text-gray-600 leading-tight text-center">
              {alumni.mutualConnections && alumni.mutualConnections.length > 0 
                ? `${alumni.mutualConnections[0]?.name || 'Unknown'} and ${alumni.mutualConnectionsCount - 1} other connections`
                : 'No mutual connections'
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