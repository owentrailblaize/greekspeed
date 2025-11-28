'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Mail, MapPin, Building, Shield, FileText, Phone, MessageCircle, Users, Calendar, Settings, Edit, UserCheck, UserPlus, Lock, Upload, Heart, Trash2, X } from 'lucide-react';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { useConnections } from '@/lib/contexts/ConnectionsContext';
import { useAuth } from '@/lib/supabase/auth-context';
import { UserAvatar } from '@/components/features/profile/UserAvatar';
import { ProfileService } from '@/lib/services/profileService';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useChapterMembers } from '@/lib/hooks/useChapterMembers';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AvatarService } from '@/lib/services/avatarService';
import { BannerService } from '@/lib/services/bannerService';
import { useUserPosts } from '@/lib/hooks/useUserPosts';
import { formatDistanceToNow } from 'date-fns';
import { DeletePostModal } from '@/components/features/social/DeletePostModal';
import { EmailService } from '@/lib/services/emailService';
import { useModal } from '@/lib/contexts/ModalContext';
import { Save, AlertTriangle } from 'lucide-react';
import ImageWithFallback from '@/components/figma/ImageWithFallback';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MobileBottomNavigation } from '@/components/features/dashboard/dashboards/ui/MobileBottomNavigation';
import { ProfileHeaderSection } from '@/components/features/profile/mobile/ProfileHeaderSection';
import { ContentNavigationTabs } from '@/components/features/profile/mobile/ContentNavigationTabs';
import { ContentFeedSection } from '@/components/features/profile/mobile/ContentFeedSection';

// Add a helper function to format system roles for display (add this near the top of the component, after other helper functions)
const formatSystemRole = (role: string | null | undefined): string => {
  if (!role) return 'Not provided';
  
  const roleMap: Record<string, string> = {
    'admin': 'Admin',
    'active_member': 'Member',
    'alumni': 'Alumni',
  };
  
  // Return mapped value if exists, otherwise capitalize first letter and replace underscores
  return roleMap[role.toLowerCase()] || role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function ProfilePage() {
  const { profile, loading, refreshProfile } = useProfile();
  const { connections, loading: connectionsLoading, sendConnectionRequest } = useConnections();
  const [activeTab, setActiveTab] = useState('posts');
  const [connectionLoading, setConnectionLoading] = useState<string | null>(null);
  const router = useRouter();
  const { openEditProfileModal } = useModal();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState(false);
  
  // Calculate completion percentage
  const completion = profile ? ProfileService.calculateCompletion(profile) : null;

  // Add state for dismissing the completion toast
  const [isCompletionDismissed, setIsCompletionDismissed] = useState(false);

  // Handle dismissing the toast
  const handleDismissCompletion = () => {
    setIsCompletionDismissed(true);
  };

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
  const MAX_VISIBLE_CONNECTIONS = 6;
  const sortedConnections = useMemo(() => {
    return [...acceptedConnections].sort((a, b) => {
      const aDate = new Date(a.updated_at || a.created_at || 0).getTime();
      const bDate = new Date(b.updated_at || b.created_at || 0).getTime();
      return bDate - aDate;
    });
  }, [acceptedConnections]);
  const visibleConnections = sortedConnections.slice(0, MAX_VISIBLE_CONNECTIONS);
  const hasMoreConnections = sortedConnections.length > MAX_VISIBLE_CONNECTIONS;

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
        // Refresh profile data using context refresh method
        await refreshProfile();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  // Debug: Log the profile data to see what's available
  useEffect(() => {
    if (profile) {
      // Full profile object loaded
    }
  }, [profile]);

  // Move useUserPosts BEFORE the early returns
  const { posts: userPosts, loading: postsLoading, deletePost } = useUserPosts(profile?.id || '');

  // Get recent connections for avatar display (up to 3) - Move this BEFORE early returns too
  const recentConnectionsForAvatars = useMemo(() => {
    if (!profile) return [];
    return sortedConnections.slice(0, 3).map((connection) => {
      const partner = connection.requester_id === profile.id 
        ? connection.recipient 
        : connection.requester;
      return partner ? {
        id: partner.id || connection.id,
        avatar_url: partner.avatar_url,
        full_name: partner.full_name,
        first_name: partner.first_name,
        last_name: partner.last_name,
      } : null;
    }).filter(Boolean) as Array<{
      id: string;
      avatar_url?: string | null;
      full_name?: string;
      first_name?: string;
      last_name?: string;
    }>;
  }, [sortedConnections, profile]);

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
    { label: 'Role', value: formatSystemRole(profile.role), icon: Shield, required: true }, // Apply formatting here
    { label: 'Bio', value: profile.bio, icon: FileText, required: false },
    { label: 'Phone', value: profile.phone, icon: Phone, required: false },
    { label: 'Location', value: profile.location, icon: MapPin, required: false },
  ];

  // Mobile Layout - Threads-style
  const mobileTabs = [
    { id: 'posts', label: 'Posts' },
    { id: 'connections', label: 'Connections' },
  ];

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  const handleDeleteClick = (postId: string) => {
    setPostToDelete(postId);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;
    
    setIsDeleting(true);
    try {
      await deletePost(postToDelete);
      setDeleteModalOpen(false);
      setPostToDelete(null);
    } catch (error) {
      console.error('Failed to delete post:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setPostToDelete(null);
  };

  const renderConnectionRow = (connection: any) => {
    const partner = getConnectionPartner(connection);
    if (!partner) return null;

    return (
      <div
        key={connection.id}
        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-navy-300 transition-colors"
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <UserAvatar
            user={{
              user_metadata: {
                avatar_url: partner?.avatar_url,
                full_name: partner?.full_name,
              },
            }}
            completionPercent={0}
            hasUnread={false}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">
              {partner?.full_name || 'Unknown User'}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {partner?.email || 'No email provided'}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 ml-2">
          <Button
            size="sm"
            variant="outline"
            className="text-navy-600 border-navy-300 hover:bg-navy-50 px-2 sm:px-3"
            onClick={() => handleMessageClick(connection.id)}
          >
            <MessageCircle className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Message</span>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Layout */}
      <div className="min-h-screen bg-white sm:hidden pb-20">
        {/* Profile Header Section */}
        <ProfileHeaderSection
          profile={profile}
          connectionsCount={acceptedConnections.length}
          onEditClick={openEditProfileModal}
          completion={completion}
          recentConnections={recentConnectionsForAvatars}
        />

        {/* Content Navigation Tabs */}
        <ContentNavigationTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={mobileTabs}
        />

        {/* Content Feed Section */}
        <ContentFeedSection
          activeTab={activeTab}
          posts={userPosts}
          connections={sortedConnections}
          postsLoading={postsLoading}
          connectionsLoading={connectionsLoading}
          onMessageClick={handleMessageClick}
          onDeletePost={handleDeleteClick}
          getConnectionPartner={getConnectionPartner}
        />

        {/* Mobile Bottom Navigation */}
        <MobileBottomNavigation />
      </div>

      {/* Desktop Layout - Keep Existing */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 hidden sm:block pb-20 sm:pb-0">
      <div className="max-w-full mx-auto px-6 py-6">
        {/* Profile Completion Toast - Dismissible */}
        {completion && completion.percentage < 100 && !isCompletionDismissed && (
          <div className="mb-6 relative">
            <div className="p-4 bg-white rounded-lg border border-navy-200 shadow-md flex items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Badge className="bg-navy-600 text-white">
                      {completion.percentage}% Complete
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy-900">
                      Profile Completion: {completion.percentage}%
                    </p>
                    <p className="text-xs text-navy-600 mt-0.5 truncate">
                      Complete your profile to unlock full features and improve your visibility in the network
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleDismissCompletion}
                className="flex-shrink-0 p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                aria-label="Dismiss profile completion notice"
              >
                <X className="w-4 h-4" />
              </button>
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
                {/* Removed the placeholder text - banner is now clean */}
              </div>
            )}
          </div>

          {/* Profile Name and Chapter - Mobile Top Position (Centered) */}
          <div className="absolute top-4 left-0 right-0 sm:hidden">
            <div className="text-white text-center">
              <h1 className="text-xl font-bold mb-1">{profile.full_name || 'User Name'}</h1>
              <p className="text-sm opacity-90">{profile.chapter || 'Chapter'}</p>
            </div>
          </div>

          {/* Profile Picture and User Info Container - Desktop Bottom Position */}
          <div className="absolute left-8 bottom-4 hidden sm:flex items-center space-x-4">
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

          {/* Profile Picture - Mobile Bottom Position */}
          <div className="absolute left-4 bottom-4 sm:hidden">
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
          </div>

          {/* Action Buttons - Add Edit Profile Button */}
          <div className="absolute right-4 sm:right-8 bottom-4 flex items-center space-x-3">
            <Button 
              size="sm" 
              className="w-10 h-10 rounded-full bg-navy-600 hover:bg-navy-700"
              onClick={openEditProfileModal}
              title="Edit Profile"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Link href="/dashboard/messages">
              <Button size="sm" className="w-10 h-10 rounded-full bg-navy-600 hover:bg-navy-700">
                <MessageCircle className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content Area - Dynamic 1/3 and 2/3 Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - About Section (1/3 width) */}
          <div className="lg:col-span-1">
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-slate-600">About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {profileFields
                  .filter(field => field.required || field.value) // Only show required fields or fields with values
                  .map((field) => (
                    <div key={field.label} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="w-5 h-5 mt-0.5 text-navy-500 flex-shrink-0">
                        <field.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          {field.label}
                        </p>
                        <p className="text-sm font-medium text-gray-900 break-words">
                          {field.value || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Content Tabs (2/3 width) */}
          <div className="lg:col-span-2">
            <Card className="bg-white">
              <CardHeader>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  {/* Mobile: Horizontal scrollable tabs */}
                  <div className="sm:hidden">
                    <div className="flex overflow-x-auto scrollbar-hide pb-2 mb-4">
                      <div className="flex space-x-1 min-w-max">
                        <button
                          onClick={() => setActiveTab('connections')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                            activeTab === 'connections'
                              ? 'bg-navy-600 text-white'
                              : ' text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Connections
                        </button>
                        <button
                          onClick={() => setActiveTab('posts')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                            activeTab === 'posts'
                              ? 'bg-navy-600 text-white'
                              : ' text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Posts
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Desktop: Standard grid tabs */}
                  <TabsList className="hidden sm:grid w-full grid-cols-2">
                    <TabsTrigger value="connections" className="text-sm">Connections</TabsTrigger>
                    <TabsTrigger value="posts" className="text-sm">Posts</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="connections" className="mt-4 space-y-4">
                    {connectionsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading connections...</p>
                      </div>
                    ) : sortedConnections.length > 0 ? (
                      <>
                        <div className="space-y-3">
                          {visibleConnections.map((connection) => renderConnectionRow(connection))}
                        </div>
                        {hasMoreConnections && (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setIsConnectionsModalOpen(true)}
                          >
                            View all connections
                          </Button>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <UserCheck className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No connections yet</p>
                        <p className="text-sm mt-1">Start connecting with other members!</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="posts" className="mt-4">
                    {postsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading your posts...</p>
                      </div>
                    ) : userPosts.length > 0 ? (
                      <div className="space-y-4">
                        {userPosts.map((post) => (
                          <Card key={post.id} className="bg-white">
                            <CardContent className="p-4 sm:p-6">
                              {/* Post Header */}
                              <div className="flex items-start space-x-3 sm:space-x-4 mb-4 sm:mb-3">
                              <div className="w-12 h-12 sm:w-10 sm:h-10 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-sm font-semibold shrink-0 overflow-hidden ring-2 ring-white shadow-sm">
                                {post.author?.avatar_url ? (
                                  <ImageWithFallback
                                    src={post.author.avatar_url}
                                    alt={post.author.full_name || 'User'}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  post.author?.first_name?.charAt(0) || 'U'
                                )}
                              </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h4 className="font-medium text-gray-900 text-base sm:text-sm break-words">
                                      {post.author?.full_name || 'Unknown User'}
                                    </h4>
                                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                                      {post.post_type.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    {post.author?.chapter_role && (
                                      <span className="text-xs text-gray-600 break-words">
                                        {post.author.chapter_role}
                                      </span>
                                    )}
                                    {post.author?.member_status && (
                                      <span className="text-xs text-gray-600 break-words">
                                        {post.author.member_status}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {formatTimestamp(post.created_at)}
                                  </p>
                                </div>
                                
                                <div className="flex items-center space-x-1">
                                  {post.is_author && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleDeleteClick(post.id)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 sm:p-1"
                                      title="Delete post"
                                    >
                                      <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Post Content */}
                              <div className="mb-4 sm:mb-4">
                                {post.content && (
                                  <p className="text-gray-900 text-base sm:text-sm leading-relaxed mb-3 break-words">{post.content}</p>
                                )}
                                {post.image_url && (
                                  <img 
                                    src={post.image_url} 
                                    alt="Post content" 
                                    className="w-full max-h-96 object-cover rounded-lg"
                                  />
                                )}
                              </div>

                              {/* Post Stats */}
                              <div className="flex items-center justify-between pt-4 sm:pt-3 border-t border-gray-100">
                                <div className="flex items-center space-x-4 sm:space-x-6">
                                  <div className="flex items-center space-x-1 text-gray-500">
                                    <Heart className="h-5 w-5 sm:h-4 sm:w-4" />
                                    <span className="text-sm sm:text-xs">{post.likes_count}</span>
                                  </div>
                                  <div className="flex items-center space-x-1 text-gray-500">
                                    <MessageCircle className="h-5 w-5 sm:h-4 sm:w-4" />
                                    <span className="text-sm sm:text-xs">{post.comments_count}</span>
                                  </div>
                                  <div className="flex items-center space-x-1 text-gray-500">
                                    <Calendar className="h-5 w-5 sm:h-4 sm:w-4" />
                                    <span className="text-sm sm:text-xs">{new Date(post.created_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-lg font-medium">No posts yet</p>
                        <p className="text-sm mt-1">You haven't shared any posts yet. Start sharing updates with your chapter!</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <DeletePostModal
          isOpen={deleteModalOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          post={userPosts.find(p => p.id === postToDelete) || null}
          isDeleting={isDeleting}
        />

        <Dialog open={isConnectionsModalOpen} onOpenChange={setIsConnectionsModalOpen}>
          <DialogContent className="max-w-lg w-full">
            <DialogHeader>
              <DialogTitle>All Connections</DialogTitle>
            </DialogHeader>
            <div className="mt-4 max-h-[70vh] overflow-y-auto space-y-3 pr-1">
              {sortedConnections.length > 0 ? (
                sortedConnections.map((connection) => renderConnectionRow(connection))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <UserCheck className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No connections yet</p>
                  <p className="text-sm mt-1">Start connecting with other members!</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mobile Bottom Navigation - Desktop */}
      <MobileBottomNavigation />
      </div>
    </>
  );
} 