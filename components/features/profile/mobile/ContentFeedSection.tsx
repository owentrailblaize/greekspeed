'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Heart, Calendar, Trash2, UserCheck } from 'lucide-react';
import { UserAvatar } from '@/components/features/profile/UserAvatar';
import ImageWithFallback from '@/components/figma/ImageWithFallback';
import { formatDistanceToNow } from 'date-fns';

interface ContentFeedSectionProps {
  activeTab: string;
  posts: any[];
  connections: any[];
  postsLoading: boolean;
  connectionsLoading: boolean;
  onMessageClick: (connectionId: string) => void;
  onDeletePost: (postId: string) => void;
  getConnectionPartner: (connection: any) => any;
}

export function ContentFeedSection({
  activeTab,
  posts,
  connections,
  postsLoading,
  connectionsLoading,
  onMessageClick,
  onDeletePost,
  getConnectionPartner,
}: ContentFeedSectionProps) {
  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  // Posts Tab Content
  if (activeTab === 'posts') {
    if (postsLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600"></div>
        </div>
      );
    }

    if (posts.length === 0) {
      return (
        <div className="text-center py-12 px-4">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium text-gray-900 mb-1">No posts yet</p>
          <p className="text-sm text-gray-500">
            You haven't shared any posts yet. Start sharing updates with your chapter!
          </p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-gray-100">
        {posts.map((post) => (
          <div key={post.id} className="p-4 bg-white">
            {/* Post Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-sm font-semibold shrink-0 overflow-hidden ring-2 ring-white shadow-sm">
                {post.author?.avatar_url ? (
                  <ImageWithFallback
                    src={post.author.avatar_url}
                    alt={post.author.full_name || 'User'}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  post.author?.first_name?.charAt(0) || 'U'
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-sm mb-1">
                  {post.author?.full_name || 'Unknown User'}
                </h4>
                <p className="text-xs text-gray-500">
                  {formatTimestamp(post.created_at)}
                </p>
              </div>

              {post.is_author && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeletePost(post.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                  title="Delete post"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Post Content */}
            {post.content && (
              <p className="text-gray-900 text-sm leading-relaxed mb-3 break-words">
                {post.content}
              </p>
            )}

            {post.image_url && (
              <img
                src={post.image_url}
                alt="Post content"
                className="w-full max-h-96 object-cover rounded-lg mb-3"
              />
            )}

            {/* Post Stats */}
            <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1 text-gray-500">
                <Heart className="h-4 w-4" />
                <span className="text-xs">{post.likes_count || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">{post.comments_count || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Connections Tab Content
  if (activeTab === 'connections') {
    if (connectionsLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600"></div>
        </div>
      );
    }

    if (connections.length === 0) {
      return (
        <div className="text-center py-12 px-4">
          <UserCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium text-gray-900 mb-1">No connections yet</p>
          <p className="text-sm text-gray-500">
            Start connecting with other members!
          </p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-gray-100">
        {connections.map((connection) => {
          const partner = getConnectionPartner(connection);
          if (!partner) return null;

          return (
            <div
              key={connection.id}
              className="p-4 bg-white flex items-center justify-between"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
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
              <Button
                size="sm"
                variant="outline"
                className="text-navy-600 border-navy-300 hover:bg-navy-50 shrink-0"
                onClick={() => onMessageClick(connection.id)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </Button>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}

