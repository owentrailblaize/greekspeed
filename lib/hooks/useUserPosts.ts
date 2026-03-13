'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Post } from '@/types/posts';

export function useUserPosts(userId: string) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserPosts = useCallback(async () => {
    if (!user || !userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Authentication required');
        return;
      }

      // Fetch posts directly from Supabase for the specific user
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!author_id(
            id,
            full_name,
            first_name,
            last_name,
            avatar_url,
            chapter_role,
            member_status
          )
        `)
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) {
        throw new Error(postsError.message);
      }

      // Collect post IDs we just fetched
      const postIds = (postsData ?? []).map((post) => post.id);

      // Fetch all likes for these posts in a single query
      let likedPostIds = new Set<string>();

      if (postIds.length > 0) {
        const { data: likesData, error: likesError } = await supabase
          .from('post_likes')
          .select('post_id')
          .in('post_id', postIds)
          .eq('user_id', user.id);
        if (!likesError && likesData) {
          likedPostIds = new Set(likesData.map((row) => row.post_id as string));
        }
      }

      // Merge likes and counts into posts
      const postsWithLikes = (postsData || []).map((post) => ({
        ...post,
        is_liked: likedPostIds.has(post.id),
        is_author: post.author_id === user.id,
        likes_count: post.likes_count ?? 0,
        comments_count: post.comments_count ?? 0,
        shares_count: post.shares_count ?? 0,
      }))

      setPosts(postsWithLikes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user posts');
    } finally {
      setLoading(false);
    }
  }, [user, userId]);

  const likePost = useCallback(async (postId: string) => {
    if (!user) return;

    setPosts((prevPosts) => {
      const target = prevPosts.find((p) => p.id === postId);
      if (!target) return prevPosts;
      const prevLiked = target.is_liked ?? false;
      const prevCount = target.likes_count ?? 0;
      return prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              is_liked: !prevLiked,
              likes_count: prevLiked
                ? Math.max(0, prevCount - 1)
                : prevCount + 1,
            }
          : post,
      );
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Authentication required');

      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) throw new Error('Failed to like post');
    } catch (err) {
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                is_liked: !post.is_liked,
                likes_count: post.is_liked
                  ? Math.max(0, (post.likes_count ?? 0) - 1)
                  : (post.likes_count ?? 0) + 1,
              }
            : post,
        ),
      );
      setError(err instanceof Error ? err.message : 'Failed to like post');
      throw err;
    }
  }, [user]);

  const deletePost = useCallback(async (postId: string) => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      // Remove the post from the local state
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
      return false;
    }
  }, [user]);

  useEffect(() => {
    fetchUserPosts();
  }, [fetchUserPosts]);

  return {
    posts,
    loading,
    error,
    fetchUserPosts,
    likePost,
    deletePost,
    refetch: fetchUserPosts
  };
}
