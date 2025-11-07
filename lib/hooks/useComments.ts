'use client';

import { useState, useEffect, useCallback } from 'react';
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
}

export function useComments(postId: string, options: UseCommentsOptions = {}) {
  const { user, session, getAuthHeaders } = useAuth();
  const enabled = options.enabled ?? true;
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const setStateFromCache = useCallback(
    (cacheEntry: CommentsCacheEntry) => {
      setComments(cacheEntry.comments);
      setPagination(cacheEntry.pagination);
      setLoading(false);
    },
    [],
  );

  const fetchComments = useCallback(
    async (page = 1) => {
      if (!enabled || !user || !postId || !session) return;

      try {
        setLoading(true);
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
    if (!enabled) {
      setLoading(false);
      return;
    }

    const cached = commentsCache.get(postId);
    if (cached) {
      setStateFromCache(cached);
      return;
    }

    fetchComments();
  }, [enabled, fetchComments, postId, setStateFromCache]);

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
