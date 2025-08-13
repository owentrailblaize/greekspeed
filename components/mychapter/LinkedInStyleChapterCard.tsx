import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChapterMember, MutualConnection } from "./types";
import { MessageCircle, UserPlus, Check, Shield } from "lucide-react";

interface LinkedInStyleChapterCardProps {
  member: ChapterMember;
  onMessage?: (memberId: string) => void;
  onConnect?: (memberId: string) => void;
}

export function LinkedInStyleChapterCard({ 
  member, 
  onMessage, 
  onConnect 
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

  return (
    <Card className="bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-200 overflow-hidden group">
      <CardContent className="p-0">
        {/* Header Banner */}
        <div className="h-16 bg-gradient-to-r from-navy-100 to-blue-100 relative" />

        <div className="px-4 pb-4 -mt-8 relative">
          {/* Avatar */}
          <div className="flex justify-center mb-3">
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
          <div className="text-center mb-2">
            <h3 className="font-semibold text-gray-900 inline-flex items-center gap-1">
              {name}
              {verified && (
                <Badge className="bg-blue-500 text-white text-xs p-1">
                  <Shield className="h-3 w-3" />
                </Badge>
              )}
            </h3>
          </div>

          {/* Position and Description */}
          <div className="text-center mb-3">
            {position && (
              <p className="text-sm font-medium text-navy-600 mb-1">{position}</p>
            )}
            <p className="text-sm text-gray-600 leading-relaxed">{memberDescription}</p>
          </div>

          {/* Interests */}
          {interests.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1 mb-4">
              {interests.slice(0, 3).map((interest, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  {interest}
                </Badge>
              ))}
              {interests.length > 3 && (
                <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                  +{interests.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Mutual Connections */}
          <div className="flex items-center justify-center space-x-2 mb-4">
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
            <span className="text-sm text-gray-600">
              {connections.length > 0 
                ? `${connections[0]?.name || 'Unknown'} and ${connectionsCount - 1} other connections`
                : 'Chapter member'
              }
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button
              onClick={handleMessage}
              className="flex-1 bg-navy-600 hover:bg-navy-700 text-white rounded-full font-medium"
              size="sm"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>
            <Button
              onClick={handleConnect}
              className="flex-1 border border-navy-600 text-navy-600 bg-white hover:bg-navy-50 transition-colors duration-200 rounded-full font-medium"
              variant="outline"
              size="sm"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Connect
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 