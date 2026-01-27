
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  MessageSquare,
  Star,
  Share2
} from "lucide-react";
import { Alumni } from "@/lib/alumniConstants";
import ImageWithFallback from "@/components/figma/ImageWithFallback";

interface AlumniDetailSheetProps {
  alumni: Alumni | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AlumniDetailSheet({ alumni, isOpen, onClose }: AlumniDetailSheetProps) {
  // Use mutual connections from alumni prop (already calculated by API)
  const mutualConnections = alumni?.mutualConnections || [];
  const mutualConnectionsCount = alumni?.mutualConnectionsCount || 0;
  const mutualLoading = false; // No longer loading since it comes from API
  
  if (!alumni) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <span>Alumni Profile</span>
            {alumni.verified && (
              <Badge className="bg-blue-500 text-white">✓ Verified</Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Profile Header */}
          <div className="flex items-start space-x-4">
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
                    {alumni.firstName[0]}{alumni.lastName[0]}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{alumni.fullName}</h2>
              <p className="text-gray-600">{alumni.jobTitle}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{alumni.company}</span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Contact Information</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {alumni.email || ((alumni.is_email_public === false) ? 'Hidden by user' : 'Not available')}
                </span>
                {alumni.email && (
                  <Button size="sm" variant="outline">
                    <Mail className="h-4 w-4 mr-1" />
                    Send Email
                  </Button>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {alumni.email || ((alumni.isEmailPublic === false || alumni.is_email_public === false) ? 'Hidden by user' : 'Not available')}
                </span>
                {alumni.email && (
                  <Button size="sm" variant="outline">
                    <Mail className="h-4 w-4 mr-1" />
                    Send Email
                  </Button>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {alumni.phone || ((alumni.isPhonePublic === false || alumni.is_phone_public === false) ? 'Hidden by user' : 'Not available')}
                </span>
                {alumni.phone && (
                  <Button size="sm" variant="outline">
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Professional Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Industry</label>
                <p className="text-sm text-gray-900">{alumni.industry}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Graduation Year</label>
                <p className="text-sm text-gray-900">{alumni.graduationYear}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Chapter</label>
                <p className="text-sm text-gray-900">{alumni.chapter}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Last Contact</label>
                <p className="text-sm text-gray-900">{alumni.lastContact}</p>
              </div>
            </div>
          </div>

          {/* Mutual Connections */}
          {mutualLoading ? (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Mutual Connections</h3>
              <div className="text-sm text-gray-400">Loading...</div>
            </div>
          ) : mutualConnections.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Mutual Connections</h3>
              <div className="flex flex-wrap gap-2">
                {mutualConnections.slice(0, 5).map((connection, i) => (
                  <Badge key={connection.id || `mutual-${i}`} variant="outline" className="text-xs">
                    {connection.name}
                  </Badge>
                ))}
                {mutualConnectionsCount > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{mutualConnectionsCount - 5} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2 pt-4 border-t border-gray-200">
            <Button className="flex-1">
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Message
            </Button>
            <Button variant="outline">
              <Star className="h-4 w-4 mr-2" />
              Follow
            </Button>
            <Button variant="outline">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 