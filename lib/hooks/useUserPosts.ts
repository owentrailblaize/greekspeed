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

      // Check if current user liked each post
      const postsWithLikes = await Promise.all(
        (postsData || []).map(async (post) => {
          const { data: likeData } = await supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', user.id)
            .single();

          // Ensure counts are present (default to 0 if missing)
          return {
            ...post,
            is_liked: !!likeData,
            is_author: post.author_id === user.id,
            likes_count: post.likes_count ?? 0,
            comments_count: post.comments_count ?? 0,
            shares_count: post.shares_count ?? 0,
          };
        })
      );

      setPosts(postsWithLikes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user posts');
    } finally {
      setLoading(false);
    }
  }, [user, userId]);

  const likePost = useCallback(async (postId: string) => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to like post');
      }

      const { liked } = await response.json();

      // Update the post in local state
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                is_liked: liked,
                likes_count: liked
                  ? (post.likes_count || 0) + 1
                  : Math.max(0, (post.likes_count || 0) - 1),
              }
            : post
        )
      );
    } catch (err) {
      console.error('Failed to like post:', err);
      setError(err instanceof Error ? err.message : 'Failed to like post');
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
