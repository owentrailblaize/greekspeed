'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePosts } from '@/lib/hooks/usePosts';
import { useProfile } from '@/lib/hooks/useProfile';
import { CreatePostModal } from '@/components/social/CreatePostModal';
import { PostCard } from '@/components/social/PostCard';
import { Post, CreatePostRequest } from '@/types/posts';

interface SocialFeedProps {
  chapterId: string;
}

export function SocialFeed({ chapterId }: SocialFeedProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { posts, loading, error, createPost, likePost } = usePosts(chapterId);
  const { profile } = useProfile();

  const handleCreatePost = async (postData: CreatePostRequest) => {
    await createPost(postData);
  };

  const handleDeletePost = async (postId: string) => {
    // TODO: Implement delete functionality
    console.log('Delete post:', postId);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading posts: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create Post Card */}
      <Card className="bg-white">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-sm font-semibold shrink-0">
              {profile?.avatar_url || profile?.first_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <Button 
                variant="outline" 
                className="w-full justify-start text-gray-500 hover:text-gray-700 border-gray-300"
                onClick={() => setIsCreateModalOpen(true)}
              >
                Start a post...
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Feed Posts */}
      {posts.length === 0 ? (
        <Card className="bg-white">
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No posts yet. Be the first to share something!</p>
          </CardContent>
        </Card>
      ) : (
        posts.map((post: Post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={likePost}
            onDelete={handleDeletePost}
          />
        ))
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePost}
        userAvatar={profile?.avatar_url || undefined}
        userName={profile?.full_name || undefined}
      />
    </div>
  );
} 