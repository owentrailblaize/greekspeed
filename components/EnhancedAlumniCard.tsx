import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alumni } from "@/lib/mockAlumni";
import { MessageCircle, UserPlus, Shield, Building2, MapPin, GraduationCap, Clock } from "lucide-react";
import ImageWithFallback from "./figma/ImageWithFallback";
import { useConnections } from "@/lib/contexts/ConnectionsContext";
import { useAuth } from "@/lib/supabase/auth-context";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClickableField } from './ClickableField';
import { ActivityIndicator } from './ActivityIndicator';

// Add this function at the top of the file, outside the component
const getChapterName = (chapterId: string, isMobile: boolean = false): string => {
  // This maps the UUIDs from your database to readable chapter names
  const chapterMap: Record<string, string> = {
    "404e65ab-1123-44a0-81c7-e8e75118e741": "Sigma Chi Eta (Ole Miss)",
    "8ede10e8-b848-427d-8f4a-aacf74cea2c2": "Phi Gamma Delta Omega Chi (Chapman)",
    "b25a4acf-59f0-46d4-bb5c-d41fda5b3252": "Phi Delta Theta Mississippi Alpha (Ole Miss)",
    "ff740e3f-c45c-4728-a5d5-22088c19d847": "Kappa Sigma Delta-Xi (Ole Miss)"
  };
  
  const fullName = chapterMap[chapterId] || chapterId;
  
  // For mobile, remove parenthetical information to save space
  if (isMobile) {
    return fullName.replace(/\s*\([^)]*\)/g, '');
  }
  
  return fullName;
};

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
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> // Add Clock icon for pending state
            )}
            Requested
          </Button>
        );
      
      case 'accepted':
        return (
          <Button
            onClick={(e) => handleMessageClick(e)}
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full font-medium h-8 sm:h-10 text-xs sm:text-sm"
          >
            <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
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
        <div className="h-8 sm:h-16 bg-gradient-to-r from-navy-100 to-blue-100" />

        <div className="px-1 sm:px-4 pb-1 sm:pb-4 -mt-4 sm:-mt-8 relative flex-1 flex flex-col">
          {/* Avatar */}
          <div className="flex justify-center mb-1 sm:mb-3">
            <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full border-2 sm:border-4 border-white bg-white shadow-sm overflow-hidden relative">
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
                  <span className="text-white font-medium text-xs sm:text-lg">
                    {alumni.firstName?.[0] || ''}{alumni.lastName?.[0] || ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Name and Verification - Stack badges below name in row */}
          <div className="text-center mb-1 sm:mb-2">
            <div className="flex items-center justify-center space-x-2 mb-0.5 sm:mb-2">
              <h3 className="font-semibold text-gray-900 text-xs sm:text-lg leading-tight truncate">
                {alumni.fullName}
              </h3>
              <ActivityIndicator 
                lastActiveAt={alumni.lastActiveAt} 
                size="sm"
              />
            </div>
            
            {/* Badges in row below name */}
            <div className="flex flex-row items-center justify-center gap-0.5 sm:gap-1">
              {/* Verification Badge removed */}
              {alumni.isActivelyHiring && (
                <Badge className="bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xs p-0.5 sm:p-1 flex-shrink-0">
                  Hiring
                </Badge>
              )}
            </div>
          </div>

          {/* Job Title and Company - Always reserve space for consistent layout */}
          <div className="text-center mb-1 sm:mb-3 min-h-[2rem] sm:min-h-[3rem] flex flex-col justify-center">
            {isValidField(alumni.jobTitle) && (
              <p className="text-xs sm:text-sm font-medium text-navy-600 mb-0.5 sm:mb-1 leading-tight truncate">{alumni.jobTitle}</p>
            )}
            {isValidField(alumni.company) && (
              <div className="flex items-center justify-center space-x-2 text-gray-500 text-xs sm:text-sm">
                <Building2 className="h-3 w-3" />
                <ClickableField 
                  value={alumni.company} 
                  entityType="company" 
                  className="text-gray-500 hover:text-blue-600"
                />
              </div>
            )}
            {/* Show placeholder when no data to maintain consistent spacing */}
            {!isValidField(alumni.jobTitle) && !isValidField(alumni.company) && (
              <div className="text-xs sm:text-sm text-gray-400">
                Professional info not available
              </div>
            )}
          </div>

          {/* Professional Tags - Always reserve space for consistent layout */}
          <div className="flex flex-wrap justify-center gap-0.5 sm:gap-2 mb-1 sm:mb-3 min-h-[1.5rem] sm:min-h-[2rem] items-center">
            {/* Industry - Hidden on mobile */}
            {isValidField(alumni.industry) && (
              <Badge 
                variant="secondary" 
                className="hidden sm:block text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 px-1 sm:px-2 py-0.5 sm:py-1 flex-shrink-0"
              >
                {alumni.industry}
              </Badge>
            )}
            {isValidField(alumni.graduationYear) && (
              <Badge 
                variant="secondary" 
                className="hidden sm:block text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 px-1 sm:px-2 py-0.5 sm:py-1 flex-shrink-0"
              >
                {alumni.graduationYear}
              </Badge>
            )}
            {/* Show placeholder when no tags to maintain consistent spacing */}
            {!isValidField(alumni.industry) && !isValidField(alumni.graduationYear) && (
              <div className="hidden sm:block text-xs text-gray-400">
                No tags available
              </div>
            )}
          </div>

          {/* Mutual Connections - Only show if there are actual connections */}
          {Array.isArray(alumni.mutualConnections) && alumni.mutualConnections.length > 0 && (
            <div className="flex items-center justify-center space-x-2 mb-1 sm:mb-4 min-h-[2rem] sm:min-h-[3rem]">
              <div className="flex -space-x-1">
                {alumni.mutualConnections.slice(0, 3).map((c, i) => (
                  <div key={i} className="w-4 h-4 sm:w-6 sm:h-6 rounded-full border-2 border-white overflow-hidden bg-gray-200 relative z-10" style={{ zIndex: 10 - i }}>
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
              {/* Connection count text */}
              <span className="text-xs sm:text-sm text-gray-600 leading-tight">
                {alumni.mutualConnections.length > 1 
                  ? `+${alumni.mutualConnections.length - 1} other connections`
                  : '1 connection'
                }
              </span>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-auto pt-2">
            {renderConnectionButton()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 