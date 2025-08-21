'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Mail, MapPin, Building, Shield, FileText, Phone, MessageCircle, Users, Calendar, Settings, Edit, UserCheck, UserPlus, Clock, Lock, Upload } from 'lucide-react';
import { useProfile } from '@/lib/hooks/useProfile';
import { useConnections } from '@/lib/hooks/useConnections';
import { useAuth } from '@/lib/supabase/auth-context';
import { UserAvatar } from '@/components/UserAvatar';
import { ProfileService } from '@/lib/services/profileService';
import Link from 'next/link';
import { useChapterMembers } from '@/lib/hooks/useChapterMembers';
import { useRouter } from 'next/navigation';
import { EditProfileModal } from '@/components/EditProfileModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AvatarService } from '@/lib/services/avatarService';
import { BannerService } from '@/lib/services/bannerService';

export default function ProfilePage() {
  const { profile, loading, refreshProfile } = useProfile();
  const { connections, loading: connectionsLoading, sendConnectionRequest } = useConnections();
  const [activeTab, setActiveTab] = useState('connections');
  const [connectionLoading, setConnectionLoading] = useState<string | null>(null);
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Calculate completion percentage
  const completion = profile ? ProfileService.calculateCompletion(profile) : null;

  // Fetch chapter members for suggestions
  const { members: chapterMembers, loading: membersLoading } = useChapterMembers(profile?.chapter_id || undefined);

  // Filter connections based on status and user role
  const acceptedConnections = connections.filter(conn => 
    conn.status === 'accepted' && 
    (conn.requester_id === profile?.id || conn.recipient_id === profile?.id)
  );

  const pendingRequests = connections.filter(conn => 
    conn.status === 'pending' && conn.requester_id === profile?.id
  );

  // Helper function to get the other user in a connection
  const getConnectionPartner = (connection: any) => {
    if (!profile) return null;
    return connection.requester_id === profile.id ? connection.recipient : connection.requester;
  };

  // Get suggested users from same chapter (excluding current user and already connected users)
  const getSuggestedUsers = () => {
    if (!chapterMembers || !profile) return [];
    
    // Get IDs of users the current user is already connected with (accepted or pending)
    const connectedUserIds = new Set([
      ...acceptedConnections.map(conn => getConnectionPartner(conn)?.id).filter(Boolean),
      ...pendingRequests.map(conn => getConnectionPartner(conn)?.id).filter(Boolean)
    ]);
    
    // Filter out current user and already connected users
    const availableUsers = chapterMembers.filter(member => 
      member.id !== profile.id && 
      !connectedUserIds.has(member.id)
    );
    
    // Randomly shuffle and return up to 3 users
    return availableUsers
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
  };

  const suggestedUsers = getSuggestedUsers();

  // Handle message button click
  const handleMessageClick = (connectionId: string) => {
    router.push(`/dashboard/messages?connection=${connectionId}`);
  };

  // Handle profile update
  const handleProfileUpdate = async (updatedProfile: any) => {
    try {
      // Update profile data
      const result = await ProfileService.updateProfile(updatedProfile);
      
      if (result) {
        // Refresh profile data
        // You might want to add a refresh function to your useProfile hook
        window.location.reload(); // Simple refresh for now
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  // Debug: Log the profile data to see what's available
  useEffect(() => {
    if (profile) {
      console.log('Full profile object:', profile);
      console.log('Available keys:', Object.keys(profile));
      console.log('Chapter value:', profile.chapter);
      console.log('Role value:', profile.role);
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Profile</h1>
            <p className="text-gray-600">Profile not found.</p>
          </div>
        </div>
      </div>
    );
  }

  const profileFields = [
    { label: 'Full Name', value: profile.full_name, icon: User, required: true },
    { label: 'Email', value: profile.email, icon: Mail, required: true },
    { label: 'Chapter', value: profile.chapter, icon: Building, required: true },
    { label: 'Role', value: profile.role, icon: Shield, required: true },
    { label: 'Bio', value: profile.bio, icon: FileText, required: false },
    { label: 'Phone', value: profile.phone, icon: Phone, required: false },
    { label: 'Location', value: profile.location, icon: MapPin, required: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      <div className="max-w-full mx-auto px-6 py-10">
        {/* Profile Completion Banner - Moved above banner for maximum visibility */}
        {completion && completion.percentage < 100 && (
          <div className="mb-8 p-4 bg-navy-50 rounded-lg border border-navy-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-navy-900">
                    Profile Completion: {completion.percentage}%
                  </p>
                  <p className="text-xs text-navy-600 mt-1">
                    Complete your profile to unlock full features and improve your visibility in the network
                  </p>
                </div>
                <Badge className="bg-navy-600 text-white">
                  {completion.percentage}% Complete
                </Badge>
              </div>
            </div>
          )}

        {/* Banner Header Section */}
        <div className="relative mb-8 rounded-xl overflow-hidden">
                     {/* Banner Image - Placeholder for now */}
           <div className="w-full h-48 bg-gradient-to-r from-navy-600 via-blue-600 to-navy-700 flex items-center justify-center overflow-hidden">
             {profile?.banner_url ? (
               <img 
                 src={profile.banner_url} 
                 alt="Profile banner" 
                 className="w-full h-full object-cover"
               />
             ) : (
               <div className="text-white text-center">
                 <p className="text-lg font-medium">Banner Image</p>
                 <p className="text-sm opacity-80">Users will be able to update this later</p>
               </div>
             )}
           </div>

          {/* Profile Picture and User Info Container */}
          <div className="absolute left-8 bottom-4 flex items-center space-x-4">
                  <UserAvatar
                    user={{
                      user_metadata: {
                        avatar_url: profile?.avatar_url, // Use profile avatar_url
                        full_name: profile?.full_name
                      }
                    }}
                    completionPercent={completion?.percentage || 0}
                    hasUnread={false}
                    size="lg"
              className="shadow-lg rounded-full ring-4"
            />
            
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-1">{profile.full_name || 'User Name'}</h1>
              <p className="text-lg opacity-90">{profile.chapter || 'Chapter'}</p>
            </div>
          </div>

                     {/* Action Buttons */}
           <div className="absolute right-8 bottom-4 flex items-center space-x-3">
            <Link href="/dashboard/messages">
              <Button size="sm" className="w-10 h-10 rounded-full bg-navy-600 hover:bg-navy-700">
                <MessageCircle className="w-4 h-4" />
              </Button>
            </Link>
            <Button 
              size="sm" 
              className="bg-navy-600/60 hover:bg-navy-600/60 text-white/80 cursor-not-allowed backdrop-blur-sm border border-navy-400/30" 
              disabled
            >
              Follow
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-white/60 text-navy-600/60 border-navy-400/40 hover:bg-white/60 cursor-not-allowed backdrop-blur-sm" 
              disabled
            >
              Schedule Meeting
            </Button>
                </div>
          </div>

        {/* Main Content Area - Three Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - About Section */}
          <div className="lg:col-span-4">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg text-navy-600">About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileFields.map((field) => (
                  <div key={field.label} className="flex items-start space-x-3">
                                         <div className="w-5 h-5 mt-1 text-navy-500">
                      <field.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">{field.label}</p>
                      <p className="text-sm font-medium text-gray-900">
                        {field.value || 'Not provided'}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Content Tabs */}
          <div className="lg:col-span-6">
            <Card className="bg-white">
              <CardHeader>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="connections" className="text-sm">Connections</TabsTrigger>
                    <TabsTrigger value="connected" className="text-sm">Connected</TabsTrigger>
                    <TabsTrigger 
                      value="posts" 
                      className="text-sm opacity-50 cursor-not-allowed" 
                      disabled
                    >
                      <Lock className="w-3 h-3 mr-1" />
                      Posts
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="connections" className="mt-4">
                    {connectionsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading connections...</p>
                      </div>
                    ) : acceptedConnections.length > 0 ? (
                      <div className="space-y-3">
                        {acceptedConnections.map((connection) => {
                          const partner = getConnectionPartner(connection);
                          if (!partner) return null;
                          
                          return (
                            <div key={connection.id} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-navy-300 transition-colors">
                              <UserAvatar
                                user={{
                                  user_metadata: {
                                    avatar_url: partner?.avatar_url, // Use partner's avatar_url
                                    full_name: partner?.full_name
                                  }
                                }}
                                completionPercent={0}
                                hasUnread={false}
                                size="md"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{partner?.full_name || 'Unknown User'}</p>
                                <p className="text-sm text-gray-500">{partner?.email || 'No email provided'}</p>
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-navy-600 border-navy-300 hover:bg-navy-50"
                                onClick={() => handleMessageClick(connection.id)}
                              >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Message
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <UserCheck className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No connections yet</p>
                        <p className="text-sm mt-1">Start connecting with other members!</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="connected" className="mt-4">
                    {connectionsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading requests...</p>
                      </div>
                    ) : pendingRequests.length > 0 ? (
                      <div className="space-y-3">
                        {pendingRequests.map((connection) => {
                          const partner = getConnectionPartner(connection);
                          if (!partner) return null;
                          
                          return (
                            <div key={connection.id} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 bg-[#FBFCFD]">
                              <UserAvatar
                                user={{
                                  user_metadata: {
                                    avatar_url: partner?.avatar_url, // Use partner's avatar_url
                                    full_name: partner?.full_name
                                  }
                                }}
                                completionPercent={0}
                                hasUnread={false}
                                size="md"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{partner?.full_name || 'Unknown User'}</p>
                                <p className="text-sm text-gray-500">{partner?.email || 'No email provided'}</p>
                                <div className="flex items-center mt-1">
                                  <Clock className="w-3 h-3 text-red-400 mr-1" />
                                  <span className="text-xs text-red-400">Request sent</span>
                                </div>
                              </div>
                              <Button size="sm" variant="outline" className="text-gray-500 border-gray-200 hover:bg-gray-100">
                                <UserPlus className="w-4 h-4 mr-2" />
                                Pending
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No pending requests</p>
                        <p className="text-sm mt-1">All your connection requests have been processed</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="posts" className="mt-4">
                    <div className="text-center py-8 text-gray-500">
                      <Lock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-lg font-medium">Posts Feature</p>
                      <p className="text-sm mt-1">Coming soon! Users will be able to share updates and content.</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardHeader>
            </Card>
        </div>

          {/* Right Column - Tools and Suggestions */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Profile Tools */}
              <Card className="bg-white">
                <CardHeader className="pb-1">
                  <CardTitle className="text-lg text-navy-600">Profile Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
            Edit Profile
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start opacity-50 cursor-not-allowed" 
                    disabled
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                    <Lock className="w-3 h-3 ml-auto text-gray-400" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start opacity-50 cursor-not-allowed" 
                    disabled
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Activity
                    <Lock className="w-3 h-3 ml-auto text-gray-400" />
                  </Button>
                </CardContent>
              </Card>

              {/* Suggestions */}
              <Card className="bg-white">
                <CardHeader className="pb-1">
                  <CardTitle className="text-lg text-navy-600 text-center">You might know</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 px-3">
                  {membersLoading ? (
                    <div className="text-center py-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-navy-600 mx-auto mb-2"></div>
                      <p className="text-xs text-gray-500">Loading suggestions...</p>
                    </div>
                  ) : suggestedUsers.length > 0 ? (
                    suggestedUsers.map((member) => (
                      <div key={member.id} className="p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                        {/* Top Row - Avatar and Name */}
                        <div className="flex items-center space-x-3 mb-3">
                          <UserAvatar
                            user={{
                              user_metadata: {
                                avatar_url: member.avatar_url, // Use member's avatar_url
                                full_name: member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim()
                              }
                            }}
                            completionPercent={0}
                            hasUnread={false}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Chapter Member'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {member.chapter_role && member.chapter_role !== 'member' ? 
                                member.chapter_role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
                                'Member'
                              }
                            </p>
                          </div>
                        </div>
                        
                        {/* Bottom Row - Connect Button */}
                        <div className="flex justify-center">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-navy-600 border-navy-300 hover:bg-navy-50 text-xs px-4 py-1 w-full"
                            onClick={() => {
                              // TODO: Implement connection request
                              console.log('Send connection request to:', member.id);
                            }}
                          >
                            <UserPlus className="w-3 h-3 mr-2" />
                            Connect
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-3 text-gray-500">
                      <Users className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                      <p className="text-xs">No suggestions available</p>
                      <p className="text-xs mt-1">You may already be connected with everyone!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
        </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profile={profile}
          onUpdate={handleProfileUpdate}
        />
      </div>
    </div>
  );
} 