'use client';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Mail, 
  Phone, 
  MessageSquare, 
  Building2, 
  Star,
  Handshake,
  Calendar,
  Users,
  Lock
} from "lucide-react";
import { UnifiedUserProfile } from "@/types/user-profile";
import ImageWithFallback from "@/components/figma/ImageWithFallback";
import { useConnections } from "@/lib/contexts/ConnectionsContext";
import { useAuth } from "@/lib/supabase/auth-context";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";

interface AlumniProfileViewProps {
  profile: UnifiedUserProfile;
  onClose: () => void;
}

const getChapterName = (chapterId: string | null | undefined): string => {
  if (!chapterId) return '';
  
  const chapterMap: Record<string, string> = {
    "404e65ab-1123-44a0-81c7-e8e75118e741": "Sigma Chi Eta (Ole Miss)",
    "8ede10e8-b848-427d-8f4a-aacf74cea2c2": "Phi Gamma Delta Omega Chi (Chapman)",
    "b25a4acf-59f0-46d4-bb5c-d41fda5b3252": "Phi Delta Theta Mississippi Alpha (Ole Miss)",
    "ff740e3f-c45c-4728-a5d5-22088c19d847": "Kappa Sigma Delta-Xi (Ole Miss)"
  };
  
  return chapterMap[chapterId] || chapterId;
};

export function AlumniProfileView({ profile, onClose }: AlumniProfileViewProps) {
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

  const alumni = profile.alumni || {};
  const userId = profile.id;

  const handleConnectionAction = async (action: 'connect' | 'accept' | 'decline' | 'cancel') => {
    if (!user || user.id === userId) return;
    
    setConnectionLoading(true);
    try {
      switch (action) {
        case 'connect':
          await sendConnectionRequest(userId, 'Would love to connect!');
          break;
        case 'accept':
          const connectionId = getConnectionId(userId);
          if (connectionId) {
            await updateConnectionStatus(connectionId, 'accepted');
          }
          break;
        case 'decline':
          const declineConnectionId = getConnectionId(userId);
          if (declineConnectionId) {
            await updateConnectionStatus(declineConnectionId, 'declined');
          }
          break;
        case 'cancel':
          const cancelConnectionId = getConnectionId(userId);
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
    const connectionId = getConnectionId(userId);
    if (connectionId) {
      router.push(`/dashboard/messages?connection=${connectionId}`);
      onClose();
    }
  };

  const canSendMessage = () => {
    if (!user || user.id === userId) return false;
    const status = getConnectionStatus(userId);
    return status === 'accepted';
  };

  const renderConnectionButton = () => {
    if (!user || user.id === userId) return null;
    
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
    
    const status = getConnectionStatus(userId);
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
            <Handshake className="h-4 w-4 mr-2" />
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

  const isEmailPublic = alumni.isEmailPublic !== false && alumni.is_email_public !== false;
  const isPhonePublic = alumni.isPhonePublic !== false && alumni.is_phone_public !== false;

  return (
    <>
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
              {profile.avatar_url ? (
                <ImageWithFallback 
                  src={profile.avatar_url} 
                  alt={profile.full_name} 
                  width={64} 
                  height={64} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-navy-500 to-navy-600 flex items-center justify-center">
                  <span className="text-white font-medium text-lg">
                    {profile.first_name?.[0] || ''}{profile.last_name?.[0] || ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Profile Info - Compact */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h2 className="text-xl font-semibold text-gray-900">{profile.full_name}</h2>
              {alumni.verified && (
                <Badge className="bg-blue-500 text-white text-xs">✓</Badge>
              )}
              {alumni.isActivelyHiring && (
                <Badge className="bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xs">
                  Hiring
                </Badge>
              )}
            </div>
            {alumni.jobTitle && (
              <p className="text-base text-gray-600 mb-1">{alumni.jobTitle}</p>
            )}
            {alumni.company && (
              <div className="flex items-center justify-center space-x-2 text-gray-500 text-sm">
                <Building2 className="h-3 w-3" />
                <span>{alumni.company}</span>
              </div>
            )}
          </div>

          {/* Compact Description */}
          {(alumni.description || profile.bio) && (
            <p className="text-gray-600 text-center mb-4 text-sm leading-relaxed">
              {alumni.description || profile.bio}
            </p>
          )}
        </div>
      </div>

      {/* Compact Information Grid */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Contact Information - Compact */}
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 text-sm flex items-center">
              <Mail className="h-3 w-3 mr-2 text-gray-400" />
              Contact
            </h3>
            <div className="space-y-1 text-xs">
              {/* Email and Phone in same row on mobile */}
              <div className="flex flex-row items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-gray-500">Email</span>
                  <span className="text-gray-900 truncate">
                    {profile.email || (!isEmailPublic ? 'Hidden by user' : 'Not available')}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500">Phone</span>
                  <span className="text-gray-900">
                    {profile.phone || (!isPhonePublic ? 'Hidden by user' : 'Not available')}
                  </span>
                </div>
              </div>
              {/* Location in column */}
              {profile.location && profile.location !== "Not Specified" && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-gray-500">Location</span>
                  <span className="text-gray-900">{profile.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Professional Information - Compact */}
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 text-sm flex items-center">
              <Building2 className="h-3 w-3 mr-2 text-gray-400" />
              Professional
            </h3>
            <div className="space-y-1 text-xs">
              {alumni.industry && alumni.industry !== "Not Specified" && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-gray-500">Industry</span>
                  <Badge variant="outline" className="text-xs">{alumni.industry}</Badge>
                </div>
              )}
              {alumni.graduationYear && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-gray-500">Grad Year</span>
                  <span className="text-gray-900">{alumni.graduationYear}</span>
                </div>
              )}
              {profile.chapter && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-gray-500">Chapter</span>
                  <span className="text-gray-900">{getChapterName(profile.chapter_id)}</span>
                </div>
              )}
              {alumni.lastContact && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-gray-500">Last Contact</span>
                  <span className="text-gray-900 text-xs">
                    {alumni.lastContact ? new Date(alumni.lastContact).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Connection Button - Compact */}
        <div className="mb-4">
          {renderConnectionButton()}
        </div>

        {/* Action Buttons - Updated with messaging functionality */}
        <div className="flex space-x-2 pt-3 border-t border-gray-200">
          <Button className="flex-1" variant="ghost" size="sm" disabled>
            <Mail className="h-3 w-3 mr-2" />
            <span className="hidden sm:inline">Send Email</span>
            <span className="sm:hidden">Email</span>
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
            variant={canSendMessage() ? "outline" : "ghost"}
            size="sm" 
            onClick={handleMessageClick}
            disabled={!canSendMessage()}
          >
            <MessageSquare className="h-3 w-3 mr-2" />
            <span className="hidden sm:inline">Send Message</span>
            <span className="sm:hidden">Message</span>
            {!canSendMessage() && <Lock className="h-3 w-3 ml-2 text-gray-400" />}
          </Button>
        </div>
      </div>
    </>
  );
}

