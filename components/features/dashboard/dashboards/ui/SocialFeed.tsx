'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePosts } from '@/lib/hooks/usePosts';
import { useProfile } from '@/lib/hooks/useProfile';
import { CreatePostModal } from '@/components/features/social/CreatePostModal';
import { PostCard } from '@/components/features/social/PostCard';
import { Post, CreatePostRequest } from '@/types/posts';
import ImageWithFallback from "@/components/figma/ImageWithFallback";
import { logger } from "@/lib/utils/logger";

interface SocialFeedProps {
  chapterId: string;
}

export function SocialFeed({ chapterId }: SocialFeedProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { posts, loading, error, createPost, likePost, deletePost, refetch } = usePosts(chapterId);
  const { profile } = useProfile();

  const handleCreatePost = async (postData: CreatePostRequest) => {
    await createPost(postData);
  };

  const handleCommentAdded = () => {
    // Refetch posts to update comment counts
    refetch();
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
    } catch (error) {
      logger.error('Failed to delete post:', { context: [error] });
      // You could show a toast notification here
    }
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
    <>
      <div className="space-y-4">
        {/* Create Post Card - Desktop Only */}
        <Card className="bg-white hidden sm:block">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="w-12 h-12 sm:w-10 sm:h-10 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-sm font-semibold shrink-0 overflow-hidden">
                {profile?.avatar_url ? (
                  <ImageWithFallback 
                    src={profile.avatar_url} 
                    alt={profile.full_name || 'User'} 
                    width={48} 
                    height={48} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  profile?.first_name?.charAt(0) || 'U'
                )}
              </div>
              <div className="flex-1">
                <Button
                  variant="outline"
                  className="w-full justify-start text-gray-500 hover:text-gray-700 hover:bg-gray-50 h-12 sm:h-10 text-left px-4"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Start a post...
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-gray-500 text-lg sm:text-base">No posts yet</p>
            <p className="text-sm text-gray-400 mt-2">Be the first to share something!</p>
          </div>
        ) : (
          posts.map((post: Post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={likePost}
              onDelete={handleDeletePost}
              onCommentAdded={handleCommentAdded}
            />
          ))
        )}
      </div>

      {/* Mobile Floating Action Button */}
      <div
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 sm:hidden flex items-center justify-center cursor-pointer"
      >
        <Plus className="h-6 w-6 text-white" />
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePost}
        userAvatar={profile?.avatar_url || undefined}
        userName={profile?.full_name || undefined}
      />
    </>
  );
} 