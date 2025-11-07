'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { Post, PostsResponse, CreatePostRequest } from '@/types/posts';

interface InitialFeedData {
  posts: Post[];
  pagination: PostsResponse['pagination'];
  chapterId: string;
}

interface UsePostsOptions {
  initialData?: InitialFeedData;
}

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

export function usePosts(chapterId: string, options: UsePostsOptions = {}) {
  const { user, session, getAuthHeaders } = useAuth();

  const normalizedInitialData = useMemo(() => {
    if (!options.initialData) return undefined;
    if (!options.initialData.chapterId) return options.initialData;
    if (!chapterId) return options.initialData;
    return options.initialData.chapterId === chapterId ? options.initialData : undefined;
  }, [chapterId, options.initialData]);

  const [posts, setPosts] = useState<Post[]>(() => normalizedInitialData?.posts ?? []);
  const [loading, setLoading] = useState(() => (normalizedInitialData ? false : true));
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState(() => normalizedInitialData?.pagination ?? DEFAULT_PAGINATION);

  const skipInitialFetchRef = useRef(Boolean(normalizedInitialData));
  const lastInitialDataRef = useRef<InitialFeedData | undefined>(normalizedInitialData);

  useEffect(() => {
    if (
      normalizedInitialData &&
      (!lastInitialDataRef.current ||
        lastInitialDataRef.current.chapterId !== normalizedInitialData.chapterId ||
        lastInitialDataRef.current.pagination.total !== normalizedInitialData.pagination.total ||
        lastInitialDataRef.current.pagination.page !== normalizedInitialData.pagination.page)
    ) {
      setPosts(normalizedInitialData.posts);
      setPagination(normalizedInitialData.pagination);
      setLoading(false);
      skipInitialFetchRef.current = true;
      lastInitialDataRef.current = normalizedInitialData;
    }
  }, [normalizedInitialData]);

  useEffect(() => {
    if (!normalizedInitialData && lastInitialDataRef.current) {
      lastInitialDataRef.current = undefined;
    }
  }, [normalizedInitialData]);

  const fetchPosts = useCallback(
    async (page = 1, { showLoading = true }: { showLoading?: boolean } = {}) => {
      if (!user || !chapterId || !session) return;

      try {
        if (showLoading) {
          setLoading(true);
        }
        setError(null);

        const headers = getAuthHeaders();
        const response = await fetch(`/api/posts?chapterId=${chapterId}&page=${page}&limit=20`, {
          headers,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }

        const data: PostsResponse = await response.json();
        setPosts(data.posts);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch posts');
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [chapterId, getAuthHeaders, session, user],
  );

  const createPost = useCallback(async (postData: CreatePostRequest) => {
    if (!user || !chapterId || !session) return null;

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      };

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers,
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      const { post } = await response.json();
      
      // Add the new post to the beginning of the list
      setPosts(prevPosts => [post, ...prevPosts]);
      
      return post;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
      return null;
    }
  }, [chapterId, getAuthHeaders, session, user]);

  const likePost = useCallback(async (postId: string) => {
    if (!user || !session) return;

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to like post');
      }

      const { liked } = await response.json();

      // Update the post in the local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                is_liked: liked,
                likes_count: liked ? post.likes_count + 1 : Math.max(0, post.likes_count - 1)
              }
            : post
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to like post');
    }
  }, [getAuthHeaders, session, user]);

  const deletePost = useCallback(async (postId: string) => {
    if (!user || !session) return;

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
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
  }, [getAuthHeaders, session, user]);

  useEffect(() => {
    if (!chapterId) {
      setPosts([]);
      setPagination(DEFAULT_PAGINATION);
      return;
    }

    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      fetchPosts(1, { showLoading: false });
      return;
    }

    fetchPosts();
  }, [chapterId, fetchPosts]);

  return {
    posts,
    loading,
    error,
    pagination,
    fetchPosts,
    createPost,
    likePost,
    deletePost,
    refetch: () => fetchPosts(1)
  };
}
