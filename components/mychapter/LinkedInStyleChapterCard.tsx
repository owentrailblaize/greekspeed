import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChapterMember, MutualConnection } from "./types";
import { MessageCircle, UserPlus, Check, Shield } from "lucide-react";

interface LinkedInStyleChapterCardProps {
  member: ChapterMember;
  onMessage?: (memberId: string) => void;
  onConnect?: (memberId: string) => void;
  isConnected?: boolean; // New prop to determine connection status
}

export function LinkedInStyleChapterCard({ 
  member, 
  onMessage, 
  onConnect,
  isConnected = false
}: LinkedInStyleChapterCardProps) {
  const {
    id,
    name,
    year,
    major,
    position,
    interests,
    avatar,
    verified = false,
    mutualConnections = [],
    mutualConnectionsCount = 0,
    description
  } = member;

  // Generate description if not provided
  const memberDescription = description || `${year} • ${major}`;
  
  // Generate mutual connections data if not provided
  const connections = mutualConnections.length > 0 ? mutualConnections : [
    { name: "Chapter Member", avatar: undefined },
    { name: "Alumni", avatar: undefined }
  ];
  const connectionsCount = mutualConnectionsCount || 5;

  const handleMessage = () => {
    if (onMessage) {
      onMessage(id);
    } else {
      console.log(`Message ${name}`);
    }
  };

  const handleConnect = () => {
    if (onConnect) {
      onConnect(id);
    } else {
      console.log(`Connect with ${name}`);
    }
  };

  // Dynamic button rendering based on connection status
  const renderActionButton = () => {
    if (isConnected) {
      // Show message button for connected members
      return (
        <Button
          onClick={handleMessage}
          className="w-full bg-navy-600 hover:bg-navy-700 text-white rounded-full font-medium h-10"
          size="default"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Message
        </Button>
      );
    } else {
      // Show connect button for non-connected members
      return (
        <Button
          onClick={handleConnect}
          className="w-full border border-navy-600 text-navy-600 bg-white hover:bg-navy-50 transition-colors duration-200 rounded-full font-medium h-10"
          variant="outline"
          size="default"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Connect
        </Button>
      );
    }
  };

  return (
    <Card className="bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-200 overflow-hidden group h-full flex flex-col">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Header Banner */}
        <div className="h-16 bg-gradient-to-r from-navy-100 to-blue-100 relative" />

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
                  <Shield className="h-3 w-3" />
                </Badge>
              )}
            </h3>
          </div>

          {/* Position and Description */}
          <div className="text-center mb-4">
            {position && (
              <p className="text-sm font-medium text-navy-600 mb-2 leading-tight">{position}</p>
            )}
            <p className="text-sm text-gray-600 leading-relaxed">{memberDescription}</p>
          </div>

          {/* Interests */}
          {interests.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-5">
              {interests.slice(0, 3).map((interest, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 px-2 py-1 flex-shrink-0"
                >
                  {interest}
                </Badge>
              ))}
              {interests.length > 3 && (
                <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 px-2 py-1 flex-shrink-0">
                  +{interests.length - 3}
                </Badge>
              )}
            </div>
          )}

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

          {/* Action Button - Dynamic based on connection status */}
          <div className="mt-auto pt-2">
            {renderActionButton()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 