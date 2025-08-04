import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ImageWithFallback from "./figma/ImageWithFallback";

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
}

export function LinkedInStyleAlumniCard({
  name,
  description,
  mutualConnections,
  mutualConnectionsCount,
  avatar,
  verified = false,
}: LinkedInStyleAlumniCardProps) {
  return (
    <Card className="bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-200 overflow-hidden group">
      <CardContent className="p-0">
        {/* Header */}
        <div className="h-16 bg-gradient-to-r from-navy-100 to-blue-100 relative" />

        <div className="px-4 pb-4 -mt-8 relative">
          {/* Avatar */}
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden">
              {avatar ? (
                <ImageWithFallback src={avatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-navy-500 to-navy-600 flex items-center justify-center">
                  <span className="text-white font-medium text-lg">
                    {name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
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
              {mutualConnections.slice(0, 3).map((c, i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-gray-200">
                  {c.avatar ? (
                    <ImageWithFallback src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                      <span className="text-white text-xs">
                        {c.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {mutualConnections[0]?.name} and {mutualConnectionsCount - 1} other mutual connections
            </span>
          </div>

          <Button
            className="w-full border border-navy-600 text-navy-600 bg-white hover:bg-navy-50 transition-colors duration-200 rounded-full font-medium"
            variant="outline"
          >
            + Connect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 