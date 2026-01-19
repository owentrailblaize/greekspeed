'use client';

import { useUserPosts } from '@/lib/hooks/useUserPosts';
import { PostCard } from '@/components/features/social/PostCard';
import { useState } from 'react';

interface PostsTabProps {
  userId: string;
  isOwnProfile?: boolean;
  onDeletePost?: (postId: string) => void;
}

export function PostsTab({ userId, isOwnProfile = false, onDeletePost }: PostsTabProps) {
  const { posts, loading, error, likePost, deletePost, refetch } = useUserPosts(userId);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  const handleLike = async (postId: string) => {
    await likePost(postId);
  };

  const handleDelete = async (postId: string) => {
    const success = await deletePost(postId);
    if (success && onDeletePost) {
      onDeletePost(postId);
    }
  };

  const handleCommentAdded = () => {
    // Refresh posts to get updated comment counts
    refetch();
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
    <div className="divide-y divide-gray-100 sm:divide-y-0">
      {posts.map((post) => (
        <div key={post.id} className="sm:pb-3 sm:mb-3">
          <PostCard
            post={post}
            onLike={handleLike}
            onDelete={isOwnProfile ? handleDelete : undefined}
            onCommentAdded={handleCommentAdded}
            isExpanded={expandedPostId === post.id}
            onToggleExpand={() => {
              setExpandedPostId((prev) => (prev === post.id ? null : post.id));
            }}
          />
        </div>
      ))}
    </div>
  );
}

