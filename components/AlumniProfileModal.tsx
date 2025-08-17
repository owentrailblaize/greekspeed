import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  MessageSquare,
  Star,
  Share2,
  GraduationCap,
  Calendar,
  Users,
  Lock
} from "lucide-react";
import { Alumni } from "@/lib/mockAlumni";
import ImageWithFallback from "./figma/ImageWithFallback";
import { useConnections } from "@/lib/hooks/useConnections";
import { useAuth } from "@/lib/supabase/auth-context";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";

interface AlumniProfileModalProps {
  alumni: Alumni | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AlumniProfileModal({ alumni, isOpen, onClose }: AlumniProfileModalProps) {
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

  if (!alumni) return null;

  const handleConnectionAction = async (action: 'connect' | 'accept' | 'decline' | 'cancel') => {
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

  const handleMessageClick = () => {
    const connectionId = getConnectionId(alumni.id);
    if (connectionId) {
      // Navigate to messages page with the connection pre-selected
      router.push(`/dashboard/messages?connection=${connectionId}`);
      // Close the modal after navigation
      onClose();
    }
  };

  const canSendMessage = () => {
    if (!user || user.id === alumni.id) return false;
    
    const status = getConnectionStatus(alumni.id);
    return status === 'accepted'; // Only allow messaging if connected
  };

  const renderConnectionButton = () => {
    if (!user || user.id === alumni.id) return null;
    
    if (!alumni.hasProfile) {
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
    
    const status = getConnectionStatus(alumni.id);
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
              <Users className="h-4 w-4 mr-2" />
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
              <Calendar className="h-4 w-4 mr-2" />
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
                <Star className="h-4 w-4 mr-2" />
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
            <MessageSquare className="h-4 w-4 mr-2" />
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
            Declined
          </Button>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? 'block' : 'hidden'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Card - Compact Design */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4">
        {/* Profile Header with Integrated Close Button */}
        <div className="relative">
          {/* Background Banner */}
          <div className="h-20 bg-gradient-to-r from-navy-100 to-blue-100 rounded-t-xl" />
          
          {/* Close Button - Positioned in top-right corner */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-3 right-3 h-8 w-8 p-0 bg-white/80 hover:bg-white rounded-full shadow-sm"
          >
            <X className="h-4 w-4" />
          </Button>
          
          {/* Profile Content Overlapping Banner */}
          <div className="px-6 -mt-10 relative">
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

            {/* Profile Info - Compact */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <h2 className="text-xl font-semibold text-gray-900">{alumni.fullName}</h2>
                {alumni.verified && (
                  <Badge className="bg-blue-500 text-white text-xs">✓</Badge>
                )}
                {alumni.isActivelyHiring && (
                  <Badge className="bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xs">
                    Hiring
                  </Badge>
                )}
              </div>
              <p className="text-base text-gray-600 mb-1">{alumni.jobTitle}</p>
              <div className="flex items-center justify-center space-x-2 text-gray-500 text-sm">
                <Building2 className="h-3 w-3" />
                <span>{alumni.company}</span>
              </div>
            </div>

            {/* Compact Description */}
            <p className="text-gray-600 text-center mb-4 text-sm leading-relaxed">
              {alumni.description}
            </p>
          </div>
        </div>

        {/* Compact Information Grid */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Contact Information - Compact */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 text-sm flex items-center">
                <Mail className="h-3 w-3 mr-2 text-gray-400" />
                Contact
              </h3>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="text-gray-900 truncate">{alumni.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Phone</span>
                  <span className="text-gray-900">{alumni.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Location</span>
                  <span className="text-gray-900">{alumni.location}</span>
                </div>
              </div>
            </div>

            {/* Professional Information - Compact */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 text-sm flex items-center">
                <Building2 className="h-3 w-3 mr-2 text-gray-400" />
                Professional
              </h3>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Industry</span>
                  <Badge variant="outline" className="text-xs">{alumni.industry}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Grad Year</span>
                  <span className="text-gray-900">{alumni.graduationYear}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Chapter</span>
                  <span className="text-gray-900">{alumni.chapter}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Last Contact</span>
                  <span className="text-gray-900 text-xs">
                    {alumni.lastContact ? new Date(alumni.lastContact).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Connection Button - Compact */}
          <div className="mb-4">
            {renderConnectionButton()}
          </div>

          {/* Action Buttons - Updated with messaging functionality */}
          <div className="flex space-x-2 pt-3 border-t border-gray-200">
            <Button className="flex-1" variant="outline" size="sm" disabled>
              <Mail className="h-3 w-3 mr-2" />
              Send Email
              <Lock className="h-3 w-3 ml-2 text-gray-400" />
            </Button>
            
            {/* ✅ Updated Send Message Button */}
            <Button 
              className={cn(
                "flex-1",
                canSendMessage() 
                  ? "border-navy-600 text-navy-600 hover:bg-navy-50" 
                  : "text-gray-400 border-gray-200"
              )}
              variant="outline" 
              size="sm" 
              onClick={handleMessageClick}
              disabled={!canSendMessage()}
            >
              <MessageSquare className="h-3 w-3 mr-2" />
              Send Message
              {!canSendMessage() && <Lock className="h-3 w-3 ml-2 text-gray-400" />}
            </Button>
            
            <Button variant="outline" size="sm" className="w-10 h-10 p-0" disabled>
              <Share2 className="h-3 w-3" />
              <Lock className="h-3 w-3 text-gray-400" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 