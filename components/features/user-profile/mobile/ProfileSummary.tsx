'use client';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  MessageSquare, 
  Building2, 
  Lock,
  Users,
  X,
  Star,
  Handshake,
  Calendar,
  ArrowLeft,
  MapPin
} from "lucide-react";
import { UnifiedUserProfile } from "@/types/user-profile";
import ImageWithFallback from "@/components/figma/ImageWithFallback";
import { useConnections } from "@/lib/contexts/ConnectionsContext";
import { useAuth } from "@/lib/supabase/auth-context";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";

interface ProfileSummaryProps {
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

export function ProfileSummary({ profile, onClose }: ProfileSummaryProps) {
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
  const userData = profile.user || {};
  const userId = profile.id;
  const isAlumni = profile.type === 'alumni';

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

  const canSendEmail = () => {
    if (!user || user.id === userId) return false;
    // Check if email exists and is public
    if (!profile.email) return false;
    // For alumni, check privacy settings
    if (isAlumni) {
      return isEmailPublic;
    }
    // For regular users, email is always available if it exists
    return true;
  };

  const handleEmailClick = () => {
    if (!profile.email || !canSendEmail()) return;
    // Open default email client with mailto link
    window.location.href = `mailto:${profile.email}?subject=Reaching out from Trailblaize`;
  };

  const renderConnectionButton = () => {
    if (!user || user.id === userId) return null;
    
    if (isAlumni && !alumni.hasProfile) {
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
      
      default:
        return null;
    }
  };

  const isEmailPublic = isAlumni ? (alumni.isEmailPublic !== false && alumni.is_email_public !== false) : true;
  const isPhonePublic = isAlumni ? (alumni.isPhonePublic !== false && alumni.is_phone_public !== false) : true;

  return (
    <div className="relative">
      {/* Banner Section - Larger for mobile */}
      <div className="h-32 bg-gradient-to-r from-navy-100 via-blue-100 to-blue-50 relative overflow-hidden">
        {/* Banner Image */}
        {profile.banner_url ? (
          <img 
            src={profile.banner_url} 
            alt="Profile banner" 
            className="w-full h-full object-cover"
          />
        ) : null}
        {/* Back Button - Positioned in top-left of banner */}
        <button
          onClick={onClose}
          className="absolute top-3 left-3 z-10 h-10 w-10 rounded-full flex items-center justify-center cursor-pointer group"
          style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 25%, #3b82f6 50%, #60a5fa 75%, #93c5fd 100%)',
            boxShadow: `
              0 6px 12px rgba(30, 64, 175, 0.4),
              0 2px 4px rgba(30, 64, 175, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.3),
              inset 0 -1px 0 rgba(0, 0, 0, 0.2)
            `,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
          title="Go back"
        >
          {/* Inner glow effect */}
          <div 
            className="absolute inset-0 rounded-full opacity-40"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), transparent 70%)',
            }}
          />
          {/* Icon */}
          <ArrowLeft 
            className="h-5 w-5 text-white relative z-10 drop-shadow-lg transition-transform duration-200 group-hover:scale-110"
            style={{
              filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4))',
            }}
          />
          {/* Hover shine effect */}
          <div 
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: 'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.3), transparent 60%)',
            }}
          />
        </button>
      </div>
      
      {/* Profile Content Overlapping Banner */}
      <div className="px-4 -mt-16 relative">
        {/* Avatar - Larger for mobile */}
        <div className="flex justify-center mb-3">
          <div className="w-20 h-20 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden relative">
            {profile.avatar_url ? (
              <ImageWithFallback 
                src={profile.avatar_url} 
                alt={profile.full_name} 
                width={80} 
                height={80} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-navy-500 to-navy-600 flex items-center justify-center">
                <span className="text-white font-medium text-2xl">
                  {profile.first_name?.[0] || ''}{profile.last_name?.[0] || ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-1 flex-wrap">
            <h2 className="text-2xl font-bold text-gray-900">{profile.full_name}</h2>
            {isAlumni && alumni.verified && (
              <Badge className="bg-blue-500 text-white text-xs">✓</Badge>
            )}
            {isAlumni && alumni.isActivelyHiring && (
              <Badge className="bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xs">
                Hiring
              </Badge>
            )}
            {!isAlumni && userData.member_status && (
              <Badge variant="outline" className="text-xs">
                {userData.member_status}
              </Badge>
            )}
          </div>
          
          {/* Job Title / Role */}
          {isAlumni && alumni.jobTitle && (
            <p className="text-lg text-gray-700 mb-1 font-medium">{alumni.jobTitle}</p>
          )}
          {!isAlumni && userData.chapter_role && (
            <p className="text-base text-gray-600 mb-1">{userData.chapter_role}</p>
          )}
          
          {/* Company (Alumni only) */}
          {isAlumni && alumni.company && (
            <div className="flex items-center justify-center space-x-2 text-gray-600 text-sm mb-2">
              <Building2 className="h-4 w-4" />
              <span>{alumni.company}</span>
            </div>
          )}
          
          {/* Bio / Description - Primary display */}
          {(isAlumni ? (alumni.description || profile.bio) : profile.bio) && (
            <p className="text-gray-700 text-center mb-2 text-sm leading-relaxed px-2">
              {isAlumni ? (alumni.description || profile.bio) : profile.bio}
            </p>
          )}
          
          {/* Location - Primary display */}
          {profile.location && profile.location !== "Not Specified" && (
            <div className="flex items-center justify-center space-x-1 text-gray-600 text-sm">
              <MapPin className="h-3 w-3" />
              <span>{profile.location}</span>
            </div>
          )}
        </div>

        {/* Connection Button */}
        <div className="mb-4">
          {renderConnectionButton()}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-3 border-t border-gray-200">
          <Button 
            className={cn(
              "flex-1 rounded-full",
              canSendEmail()
                ? "border-navy-600 text-navy-600 hover:bg-navy-50" 
                : "text-gray-400 border-gray-200"
            )}
            variant={canSendEmail() ? "outline" : "ghost"}
            size="sm" 
            onClick={handleEmailClick}
            disabled={!canSendEmail()}
          >
            <Mail className="h-4 w-4 mr-2" />
            <span>Email</span>
            {!canSendEmail() && <Lock className="h-3 w-3 ml-2 text-gray-400" />}
          </Button>
          
          <Button 
            className={cn(
              "flex-1 rounded-full",
              canSendMessage() 
                ? "border-navy-600 text-navy-600 hover:bg-navy-50" 
                : "text-gray-400 border-gray-200"
            )}
            variant={canSendMessage() ? "outline" : "ghost"}
            size="sm" 
            onClick={handleMessageClick}
            disabled={!canSendMessage()}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            <span>Message</span>
            {!canSendMessage() && <Lock className="h-3 w-3 ml-2 text-gray-400" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

