'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePosts } from '@/lib/hooks/usePosts';
import { useProfile } from '@/lib/hooks/useProfile';
import { CreatePostModal } from '@/components/social/CreatePostModal';
import { PostCard } from '@/components/social/PostCard';
import { Post, CreatePostRequest } from '@/types/posts';
import { AnnouncementPostService } from '@/lib/services/announcementPostService';

interface SocialFeedProps {
  chapterId: string;
}

export function SocialFeed({ chapterId }: SocialFeedProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { posts, loading, error, createPost, likePost, deletePost, refetch } = usePosts(chapterId);
  const { profile } = useProfile();
  const [pinnedPosts, setPinnedPosts] = useState<any[]>([]);

  // Fetch pinned posts (announcements)
  useEffect(() => {
    const fetchPinnedPosts = async () => {
      try {
        const response = await fetch(`/api/posts/pinned?chapter_id=${chapterId}`);
        if (response.ok) {
          const data = await response.json();
          setPinnedPosts(data.posts || []);
        }
      } catch (error) {
        console.error('Error fetching pinned posts:', error);
      }
    };

    fetchPinnedPosts();
  }, [chapterId]);

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
      console.error('Failed to delete post:', error);
      // You could show a toast notification here
    }
  };

  const handleUnpinPost = async (postId: string, announcementId?: string) => {
    try {
      if (announcementId) {
        await AnnouncementPostService.unpinAnnouncementPost(announcementId);
      }
      // Refresh pinned posts
      const response = await fetch(`/api/posts/pinned?chapter_id=${chapterId}`);
      if (response.ok) {
        const data = await response.json();
        setPinnedPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error unpinning post:', error);
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
    <div className="space-y-4">
      {/* Pinned Posts (Announcements) */}
      {pinnedPosts.length > 0 && (
        <div className="space-y-3">
          {pinnedPosts.map((post) => (
            <Card key={post.id} className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                      📢 PINNED ANNOUNCEMENT
                    </span>
                    <span className="text-xs text-gray-500">
                      {post.announcement_type?.charAt(0).toUpperCase() + post.announcement_type?.slice(1)}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUnpinPost(post.id, post.announcement_id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </Button>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-sm font-semibold shrink-0">
                    {post.author?.first_name?.charAt(0) || 'A'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900">{post.author?.full_name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {post.content}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Post Card */}
      <Card className="bg-white">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <div className="w-12 h-12 sm:w-10 sm:h-10 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-sm font-semibold shrink-0">
              {profile?.avatar_url || profile?.first_name?.charAt(0) || 'U'}
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

      {/* Regular Posts */}
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