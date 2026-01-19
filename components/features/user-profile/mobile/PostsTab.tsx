'use client';

import { useUserPosts } from '@/lib/hooks/useUserPosts';
import { Post } from '@/types/posts';
import ImageWithFallback from '@/components/figma/ImageWithFallback';
import { Button } from '@/components/ui/button';
import { Trash2, Heart, MessageCircle, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

interface PostsTabProps {
  userId: string;
  isOwnProfile?: boolean;
  onDeletePost?: (postId: string) => void;
}

export function PostsTab({ userId, isOwnProfile = false, onDeletePost }: PostsTabProps) {
  const { posts, loading, error, deletePost } = useUserPosts(userId);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    setDeletingId(postId);
    try {
      const success = await deletePost(postId);
      if (success && onDeletePost) {
        onDeletePost(postId);
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return timestamp;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading posts</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-2">No posts yet</p>
          <p className="text-gray-400 text-sm">Posts will appear here when they're shared</p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {posts.map((post: Post) => (
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

            {isOwnProfile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(post.id)}
                disabled={deletingId === post.id}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                title="Delete post"
              >
                {deletingId === post.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          {/* Post Content */}
          {post.content && (
            <p className="text-gray-900 text-sm leading-relaxed mb-3 break-words">
              {post.content}
            </p>
          )}

          {/* Post Image */}
          {post.image_url && (
            <div className="mb-3 rounded-lg overflow-hidden">
              <img
                src={post.image_url}
                alt="Post content"
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Post Actions */}
          <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
            <button
              className={`flex items-center gap-2 text-sm ${
                post.is_liked ? 'text-red-600' : 'text-gray-500'
              }`}
            >
              <Heart className={`h-4 w-4 ${post.is_liked ? 'fill-current' : ''}`} />
              <span>{post.likes_count || 0}</span>
            </button>
            <button className="flex items-center gap-2 text-sm text-gray-500">
              <MessageCircle className="h-4 w-4" />
              <span>{post.comments_count || 0}</span>
            </button>
            <button className="flex items-center gap-2 text-sm text-gray-500">
              <Share2 className="h-4 w-4" />
              <span>{post.shares_count || 0}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

