'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePosts } from '@/lib/hooks/usePosts';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { CreatePostModal } from '@/components/features/social/CreatePostModal';
import { PostCard } from '@/components/features/social/PostCard';
import type { Post, CreatePostRequest, PostsResponse } from '@/types/posts';
import ImageWithFallback from '@/components/figma/ImageWithFallback';

export interface SocialFeedInitialData {
  posts: Post[];
  pagination: PostsResponse['pagination'];
  chapterId: string;
}

interface SocialFeedProps {
  chapterId: string;
  initialData?: SocialFeedInitialData;
}

export function SocialFeed({ chapterId, initialData }: SocialFeedProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const {
    posts,
    error,
    isInitialLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isRefetching,
    refresh,
    createPost,
    likePost,
    deletePost,
  } = usePosts(chapterId, { initialData });
  const { profile } = useProfile();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px 0px' },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleCreatePost = async (postData: CreatePostRequest) => {
    try {
      await createPost(postData);
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      await likePost(postId);
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleCommentAdded = () => {
    refresh();
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  if (isInitialLoading && posts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg" />
        </div>
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading posts: {error}</p>
        <Button onClick={() => refresh()} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
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

        {isRefetching && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="h-3 w-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
            <span>Refreshing feed…</span>
          </div>
        )}

        {posts.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-gray-500 text-lg sm:text-base">No posts yet</p>
            <p className="text-sm text-gray-400 mt-2">Be the first to share something!</p>
          </div>
        ) : (
          <>
            {posts.map((post: Post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLikePost}
                onDelete={handleDeletePost}
                onCommentAdded={handleCommentAdded}
              />
            ))}
            <div ref={loadMoreRef} />
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-navy-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!hasNextPage && posts.length > 0 && (
              <div className="text-center py-4 text-sm text-gray-400">You’re all caught up.</div>
            )}
          </>
        )}
      </div>

      <div
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 sm:hidden flex items-center justify-center cursor-pointer"
      >
        <Plus className="h-6 w-6 text-white" />
      </div>

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