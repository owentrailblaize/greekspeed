'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { PostComment, CommentsResponse, CreateCommentRequest } from '@/types/posts';

type CommentsCacheEntry = {
  comments: PostComment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const commentsCache = new Map<string, CommentsCacheEntry>();

interface UseCommentsOptions {
  enabled?: boolean;
  initialComments?: PostComment[];
  initialTotal?: number;
}

export function useComments(postId: string, options: UseCommentsOptions = {}) {
  const { user, session, getAuthHeaders } = useAuth();
  const enabled = options.enabled ?? true;
  const { initialComments, initialTotal } = options;
  const seededComments = initialComments ?? [];
  const seededTotal = typeof initialTotal === 'number' ? initialTotal : seededComments.length;
  const hasInitialSeed = seededComments.length > 0;
  const [comments, setComments] = useState<PostComment[]>(seededComments);
  const [loading, setLoading] = useState(enabled && !hasInitialSeed);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: seededTotal,
    totalPages: 0,
  });
  const seededAppliedRef = useRef(false);
  const fetchedRef = useRef(false);

  const setStateFromCache = useCallback(
    (cacheEntry: CommentsCacheEntry) => {
      setComments(cacheEntry.comments);
      setPagination(cacheEntry.pagination);
      setLoading(false);
    },
    [],
  );

  const fetchComments = useCallback(
    async (page = 1, { showLoading = true }: { showLoading?: boolean } = {}) => {
      if (!enabled || !user || !postId || !session) return;

      try {
        if (showLoading) {
          setLoading(true);
        }
        setError(null);

        const response = await fetch(`/api/posts/${postId}/comments?page=${page}&limit=20`, {
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch comments');
        }

        const data: CommentsResponse = await response.json();
        const entry: CommentsCacheEntry = {
          comments: data.comments,
          pagination: data.pagination,
        };

        commentsCache.set(postId, entry);
        setStateFromCache(entry);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch comments');
        setLoading(false);
      }
    },
    [enabled, getAuthHeaders, postId, session, setStateFromCache, user],
  );

  const createComment = useCallback(
    async (commentData: CreateCommentRequest) => {
      if (!user || !postId || !session) return null;

      try {
        const response = await fetch(`/api/posts/${postId}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(commentData),
        });

        if (!response.ok) {
          throw new Error('Failed to create comment');
        }

        const { comment } = await response.json();

        setComments((prevComments) => {
          const updated = [...prevComments, comment];
          commentsCache.set(postId, {
            comments: updated,
            pagination: {
              ...pagination,
              total: pagination.total + 1,
            },
          });
          return updated;
        });

        setPagination((prev) => ({
          ...prev,
          total: prev.total + 1,
        }));

        return comment;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create comment');
        return null;
      }
    },
    [getAuthHeaders, pagination, postId, session, user],
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      if (!user || !session) return false;

      try {
        const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error('Failed to delete comment');
        }

        setComments((prevComments) => {
          const updated = prevComments.filter((comment) => comment.id !== commentId);
          commentsCache.set(postId, {
            comments: updated,
            pagination: {
              ...pagination,
              total: Math.max(0, pagination.total - 1),
            },
          });
          return updated;
        });

        setPagination((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
        }));

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete comment');
        return false;
      }
    },
    [getAuthHeaders, pagination, postId, session, user],
  );

  const likeComment = useCallback(
    async (commentId: string) => {
      if (!user || !session) return false;

      try {
        const response = await fetch(`/api/posts/${postId}/comments/${commentId}/like`, {
          method: 'POST',
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error('Failed to like comment');
        }

        const { liked } = await response.json();

        setComments((prevComments) => {
          const updated = prevComments.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  is_liked: liked,
                  likes_count: liked ? comment.likes_count + 1 : Math.max(0, comment.likes_count - 1),
                }
              : comment,
          );

          const cached = commentsCache.get(postId);
          if (cached) {
            commentsCache.set(postId, {
              comments: updated,
              pagination: cached.pagination,
            });
          }

          return updated;
        });

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to like comment');
        return false;
      }
    },
    [getAuthHeaders, postId, session, user],
  );

  useEffect(() => {
    seededAppliedRef.current = false;
    fetchedRef.current = false;
  }, [postId]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const cached = commentsCache.get(postId);
    if (cached) {
      setStateFromCache(cached);
      return;
    }

    if (!seededAppliedRef.current && hasInitialSeed && seededComments.length) {
      const totalPages = seededTotal > 0 ? Math.max(1, Math.ceil(seededTotal / pagination.limit)) : 0;
      setComments(seededComments);
      setPagination((prev) => ({
        ...prev,
        total: seededTotal,
        totalPages,
      }));
      setLoading(false);
      seededAppliedRef.current = true;
    }

    if (!fetchedRef.current) {
      const shouldShowLoading = !hasInitialSeed || !seededAppliedRef.current;
      fetchComments(1, { showLoading: shouldShowLoading });
      fetchedRef.current = true;
    }
  }, [
    enabled,
    fetchComments,
    hasInitialSeed,
    initialComments,
    initialTotal,
    pagination.limit,
    postId,
    seededTotal,
    setStateFromCache,
  ]);

  const refetch = useCallback(() => fetchComments(1), [fetchComments]);

  return {
    comments,
    loading,
    error,
    pagination,
    fetchComments,
    createComment,
    deleteComment,
    likeComment,
    refetch,
  };
}
