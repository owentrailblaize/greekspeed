'use client';

import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  Building2, 
  Shield, 
  BookOpen,
  MessageSquare,
  Lock,
  UserPlus,
  Clock,
  CheckCircle
} from 'lucide-react';
import { getRoleDisplayName } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { useConnections } from '@/lib/contexts/ConnectionsContext';
import { useAuth } from '@/lib/supabase/auth-context';
import { useRouter } from 'next/navigation';
import ImageWithFallback from '@/components/figma/ImageWithFallback';

interface User {
  id: string;
  email: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  chapter: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
  bio: string | null;
  phone: string | null;
  location: string | null;
  avatar_url: string | null;
  chapter_role: string | null;
  member_status: string | null;
  pledge_class: string | null;
  grad_year: number | null;
  major: string | null;
  minor: string | null;
  hometown: string | null;
  gpa: number | null;
  chapter_id: string | null;
  is_developer: boolean;
  developer_permissions: string[];
  access_level: string | null;
}

interface ViewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export function ViewUserModal({ isOpen, onClose, user }: ViewUserModalProps) {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { 
    sendConnectionRequest, 
    updateConnectionStatus, 
    cancelConnectionRequest, 
    getConnectionStatus,
    getConnectionId
  } = useConnections();
  const [connectionLoading, setConnectionLoading] = useState(false);

  // Ensure component is mounted (for SSR)
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!user || !isOpen || !mounted) return null;

  const handleConnectionAction = async (action: 'connect' | 'accept' | 'decline' | 'cancel') => {
    if (!currentUser || currentUser.id === user.id) return;
    
    setConnectionLoading(true);
    try {
      switch (action) {
        case 'connect':
          await sendConnectionRequest(user.id, 'Would love to connect!');
          break;
        case 'accept':
          const connectionId = getConnectionId(user.id);
          if (connectionId) {
            await updateConnectionStatus(connectionId, 'accepted');
          }
          break;
        case 'decline':
          const declineConnectionId = getConnectionId(user.id);
          if (declineConnectionId) {
            await updateConnectionStatus(declineConnectionId, 'declined');
          }
          break;
        case 'cancel':
          const cancelConnectionId = getConnectionId(user.id);
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
    const connectionId = getConnectionId(user.id);
    if (connectionId) {
      router.push(`/dashboard/messages?connection=${connectionId}`);
      onClose();
    }
  };

  const canSendMessage = () => {
    if (!currentUser || currentUser.id === user.id) return false;
    const status = getConnectionStatus(user.id);
    return status === 'accepted';
  };

  const renderConnectionButton = () => {
    if (!currentUser || currentUser.id === user.id) return null;
    
    const status = getConnectionStatus(user.id);
    const isLoading = connectionLoading;

    switch (status) {
      case 'none':
        return (
          <Button
            onClick={() => handleConnectionAction('connect')}
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
            onClick={() => handleConnectionAction('cancel')}
            disabled={isLoading}
            className="w-full border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 transition-colors duration-200 rounded-full font-medium h-10 flex items-center justify-center"
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
              className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-full font-medium h-10"
            >
              Accept
            </Button>
            <Button
              onClick={() => handleConnectionAction('decline')}
              disabled={isLoading}
              className="flex-1 border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 rounded-full font-medium h-10"
              variant="outline"
            >
              Decline
            </Button>
          </div>
        );
      
      case 'accepted':
        return (
          <Button
            onClick={handleMessageClick}
            className="w-full text-white rounded-full font-medium h-10 flex items-center justify-center"
            style={{
              background: 'linear-gradient(340deg, rgba(228, 236, 255, 1) 0%, rgba(130, 130, 255, 0.95) 34%, rgba(35, 70, 224, 0.93) 85%)'
            }}
          >
            <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            Connected
          </Button>
        );
      
      default:
        return null;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Card - Compact Design with Fixed Height */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[85vh] flex flex-col">
        {/* Profile Header with Integrated Close Button */}
        <div className="relative flex-shrink-0">
          {/* Background Banner */}
          <div className="h-20 bg-gradient-to-r from-navy-100 to-blue-100 rounded-t-xl" />
          
          {/* Close Button - Positioned in top-right corner */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-3 right-3 h-8 w-8 p-0 bg-white/80 hover:bg-white rounded-full shadow-sm z-10"
          >
            <X className="h-4 w-4" />
          </Button>
          
          {/* Profile Content Overlapping Banner */}
          <div className="px-6 -mt-10 relative">
            {/* Avatar */}
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden relative">
                {user.avatar_url ? (
                  <ImageWithFallback 
                    src={user.avatar_url} 
                    alt={user.full_name} 
                    width={64} 
                    height={64} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-navy-500 to-navy-600 flex items-center justify-center">
                    <span className="text-white font-medium text-lg">
                      {user.first_name?.[0] || ''}{user.last_name?.[0] || ''}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info - Compact */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <h2 className="text-xl font-semibold text-gray-900">{user.full_name}</h2>
                {user.role === 'admin' && (
                  <Badge className="bg-blue-500 text-white text-xs">✓</Badge>
                )}
              </div>
              {user.chapter_role && (
                <p className="text-base text-gray-600 mb-1">
                  {getRoleDisplayName(user.chapter_role as any)}
                </p>
              )}
              {user.chapter && (
                <div className="flex items-center justify-center space-x-2 text-gray-500 text-sm">
                  <Building2 className="h-3 w-3" />
                  <span>{user.chapter}</span>
                </div>
              )}
            </div>

            {/* Compact Description/Bio */}
            {user.bio && (
              <p className="text-gray-600 text-center mb-4 text-sm leading-relaxed">
                {user.bio}
              </p>
            )}
          </div>
        </div>

        {/* Compact Information Grid - Scrollable if needed */}
        <div className="px-6 pb-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Contact Information - Compact */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 text-sm flex items-center">
                <Mail className="h-3 w-3 mr-2 text-gray-400" />
                Contact
              </h3>
              <div className="space-y-1 text-xs">
                {/* Email - Always shown */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="text-gray-900 truncate">
                    {user.email}
                  </span>
                </div>
                {/* Phone - Only shown if provided */}
                {user.phone && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-gray-500">Phone</span>
                    <span className="text-gray-900">
                      <a href={`tel:${user.phone.replace(/\D/g, '')}`} className="hover:text-navy-700 transition-colors">
                        {user.phone}
                      </a>
                    </span>
                  </div>
                )}
                {/* Location - Only shown if provided */}
                {user.location && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-gray-500">Location</span>
                    <span className="text-gray-900">{user.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information - Compact */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 text-sm flex items-center">
                <User className="h-3 w-3 mr-2 text-gray-400" />
                Information
              </h3>
              <div className="space-y-1 text-xs">
                {/* Graduation Year - Only shown if provided */}
                {user.grad_year && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-gray-500">Grad Year</span>
                    <span className="text-gray-900">{user.grad_year}</span>
                  </div>
                )}
                {/* Major(s) - Only shown if provided */}
                {user.major && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-gray-500">Major</span>
                    <span className="text-gray-900">{user.major}</span>
                  </div>
                )}
                {/* Chapter - Only shown if provided */}
                {user.chapter && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-gray-500">Chapter</span>
                    <span className="text-gray-900">{user.chapter}</span>
                  </div>
                )}
                {/* Status - Only shown if provided */}
                {user.member_status && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-gray-500">Status</span>
                    <Badge 
                      variant={user.member_status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {user.member_status}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Connection Button - Compact */}
          <div className="mb-4">
            {renderConnectionButton()}
          </div>

          {/* Action Buttons - Send Email and Send Message */}
          <div className="flex space-x-2 pt-3 border-t border-gray-200">
            <Button className="flex-1" variant="ghost" size="sm" disabled>
              <Mail className="h-3 w-3 mr-2" />
              <span className="hidden sm:inline">Send Email</span>
              <span className="sm:hidden">Email</span>
              <Lock className="h-3 w-3 ml-2 text-gray-400" />
            </Button>
            
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
      </div>
    </div>,
    document.body
  );
}
