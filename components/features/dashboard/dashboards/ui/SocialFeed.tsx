'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Image as ImageIcon, Paperclip, Calendar, Smile } from 'lucide-react';
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
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);

  // CRITICAL: Store initialData posts immediately in a ref that persists
  // This ensures we can show posts even before React Query hydrates
  // Following industry standards (Facebook/Instagram/TikTok) - always show initial content immediately
  const initialPostsRef = useRef<Post[]>(initialData?.posts ?? []);
  
  // Update ref if initialData changes
  // If chapterId changes, clear old posts to prevent showing wrong chapter's posts
  useEffect(() => {
    // If chapterId changed and doesn't match initialData, clear the ref
    if (initialData?.chapterId && initialData.chapterId !== chapterId) {
      initialPostsRef.current = [];
      if (typeof window !== 'undefined') {
        console.log('[SocialFeed] Cleared initialPostsRef due to chapterId mismatch', {
          initialDataChapterId: initialData.chapterId,
          currentChapterId: chapterId,
        });
      }
    }
    
    // Update ref with new initialData if it has posts and matches current chapter
    if (initialData?.posts && initialData.posts.length > 0 && initialData.chapterId === chapterId) {
      initialPostsRef.current = initialData.posts;
      if (typeof window !== 'undefined') {
        console.log('[SocialFeed] Updated initialPostsRef with new initialData', {
          postsCount: initialData.posts.length,
          chapterId: initialData.chapterId,
        });
      }
    }
  }, [initialData, chapterId]);

  // Debug: Log initial props on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('[SocialFeed] Component mounted with props:', {
        chapterId,
        hasInitialData: !!initialData,
        initialDataPostsCount: initialData?.posts?.length ?? 0,
        initialDataChapterId: initialData?.chapterId,
        initialPostsRefCount: initialPostsRef.current.length,
        timestamp: new Date().toISOString(),
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only on mount

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
  
  // CRITICAL: Use initialData posts immediately if React Query hasn't loaded yet
  // This ensures instant rendering on first paint (industry standard approach)
  // Priority: React Query posts > initialData posts from ref > empty array
  const mergedPosts = useMemo(() => {
    // Priority 1: If we have posts from React Query, use those (most up-to-date)
    if (posts.length > 0) {
      return posts;
    }
    // Priority 2: Use initialData posts from ref (instant fallback for first paint)
    // This is the key to showing content immediately like Facebook/Instagram/TikTok
    if (initialPostsRef.current.length > 0) {
      if (typeof window !== 'undefined') {
        console.log('[SocialFeed] Using initialData posts from ref (instant fallback)', {
          postsCount: initialPostsRef.current.length,
          reactQueryPostsCount: posts.length,
        });
      }
      return initialPostsRef.current;
    }
    // Priority 3: Empty array (will show "No posts yet")
    return posts;
  }, [posts]);
  
  const prevPostCountRef = useRef(mergedPosts.length);

  useEffect(() => {
    const handleScroll = () => setHasScrolled(true);
    window.addEventListener('scroll', handleScroll, { once: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!expandedPostId) return;
    const stillExists = mergedPosts.some((post) => post.id === expandedPostId);
    if (!stillExists) {
      setExpandedPostId(null);
    }
  }, [expandedPostId, mergedPosts]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasNextPage || !hasScrolled) return; // ← Added !hasScrolled

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '400px 0px' },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, hasScrolled]); // ← Added hasScrolled

  const rowVirtualizer = useWindowVirtualizer({
    count: mergedPosts.length,
    estimateSize: () => 420,
    measureElement: (el) => el?.getBoundingClientRect().height ?? 420,
    overscan: 8,
  });

  // Preserve scroll position when new posts are added
  useEffect(() => {
    // Only preserve scroll if we're adding posts (not initial load)
    if (prevPostCountRef.current > 0 && mergedPosts.length > prevPostCountRef.current) {
      const scrollOffset = window.scrollY;
      
      // Wait for next frame to allow virtualizer to update
      requestAnimationFrame(() => {
        // Remeasure to ensure accurate positioning
        rowVirtualizer.measure();
        
        // Restore scroll position
        if (scrollOffset !== undefined && scrollOffset !== null) {
          rowVirtualizer.scrollToOffset(scrollOffset, {
            align: 'start',
            behavior: 'auto', // Instant, not smooth
          });
        }
      });
    }
    
    // Update ref for next comparison
    prevPostCountRef.current = mergedPosts.length;
  }, [mergedPosts.length, rowVirtualizer]);

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

  // REMOVED: Skeleton loader - never show skeleton, always render feed
  // The feed will show "No posts yet" if empty, or cached/initial posts immediately
  // Debug logging to track loading state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('[SocialFeed] Render state:', {
        mergedPostsCount: mergedPosts.length,
        reactQueryPostsCount: posts.length,
        initialPostsRefCount: initialPostsRef.current.length,
        isInitialLoading,
        hasInitialData: !!initialData,
        initialDataPostsCount: initialData?.posts?.length ?? 0,
        chapterId,
        dataSource: posts.length > 0 ? 'react-query' : initialPostsRef.current.length > 0 ? 'initial-data-ref' : 'empty',
      });
    }
  }, [mergedPosts.length, posts.length, isInitialLoading, initialData, chapterId]);

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
      <div 
        className="space-y-6 sm:space-y-5 max-w-2xl mx-auto"
        style={{
          // Use mergedPosts for minHeight calculation to ensure proper layout
          minHeight: mergedPosts.length > 0
            ? `${Math.min(mergedPosts.length * 400, 2000)}px` // Cap at 2000px
            : '600px'
        }}
      >
        <Card className="hidden sm:block rounded-2xl border border-gray-100 bg-white/80 shadow-sm transition hover:shadow-md">
          <CardContent className="p-0">
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="h-12 w-12 rounded-full bg-primary-100/80 flex items-center justify-center text-brand-primary-hover text-sm font-semibold shrink-0 overflow-hidden ring-2 ring-white shadow-sm">
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
                  className="flex w-full items-center justify-start rounded-full border border-dashed border-gray-200 bg-gray-50 px-5 py-2.5 text-left text-gray-500 transition hover:border-gray-300 hover:bg-white hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-primary-200"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Start a post…
                </Button>
              </div>
            </div>
            <div className="border-t border-gray-100 bg-gray-50/70 px-5 py-3">
              <div className="flex items-center gap-5 text-sm text-gray-500">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-2 rounded-full px-2 py-1 text-gray-500 transition hover:bg-white hover:text-gray-700"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <ImageIcon className="h-4 w-4 text-accent-500" />
                  Photo
                </Button>
                {/*
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-2 rounded-full px-2 py-1 text-gray-500 transition hover:bg-white hover:text-gray-700"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Smile className="h-4 w-4 text-slate-500" />
                  Emoji
                </Button>
                */}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Show subtle refresh indicator when React Query is updating */}
        {isRefetching && mergedPosts.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="h-3 w-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
            <span>Refreshing feed…</span>
          </div>
        )}

        {/* Loading: show spinner until first fetch completes; empty state only when loaded with 0 posts */}
        {isInitialLoading && mergedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 gap-3">
            <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm sm:text-base">Loading feed…</p>
          </div>
        ) : mergedPosts.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-gray-500 text-lg sm:text-base">No posts yet</p>
            <p className="text-sm text-gray-400 mt-2">Be the first to share something!</p>
          </div>
        ) : (
          <div className="relative">
            <div
              className="relative w-full"
              style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const post = mergedPosts[virtualRow.index];
                if (!post) return null;

                return (
                  <div
                    key={post.id}
                    data-index={virtualRow.index}
                    className="absolute left-0 right-0 pb-3 sm:pb-6"
                    style={{
                      transform: `translateY(${virtualRow.start}px)`,
                      width: '100%',
                    }}
                    ref={(el) => {
                      if (el) {
                        rowVirtualizer.measureElement(el);
                      }
                    }}
                  >
                    <PostCard
                      post={post}
                      onLike={handleLikePost}
                      onDelete={handleDeletePost}
                      onCommentAdded={handleCommentAdded}
                      isExpanded={expandedPostId === post.id}
                      onToggleExpand={() => {
                        setExpandedPostId((prev) => (prev === post.id ? null : post.id));
                        requestAnimationFrame(() => rowVirtualizer.measure());
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div ref={loadMoreRef} className="h-px w-full" />
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {/* Use mergedPosts for consistency, but check React Query posts for pagination state */}
            {!hasNextPage && mergedPosts.length > 0 && (
              <div className="text-center py-4 text-sm text-gray-400">You're all caught up.</div>
            )}
          </div>
        )}
      </div>

      <div
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full sm:hidden flex items-center justify-center cursor-pointer group bg-brand-primary hover:bg-brand-primary-hover transition-colors"
        style={{
          boxShadow: `
            0 8px 16px rgba(0, 0, 0, 0.25),
            0 4px 8px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            inset 0 -1px 0 rgba(0, 0, 0, 0.2)
          `,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        {/* Inner glow effect */}
        <div 
          className="absolute inset-0 rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), transparent 70%)',
          }}
        />
        {/* Icon */}
        <Plus 
          className="h-6 w-6 text-white relative z-10 drop-shadow-lg transition-transform duration-200 group-hover:scale-110"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))',
          }}
        />
        {/* Hover shine effect */}
        <div 
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.3), transparent 60%)',
          }}
        />
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