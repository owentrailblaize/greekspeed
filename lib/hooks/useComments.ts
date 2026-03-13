'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { supabase } from '@/lib/supabase/client';
import { PostComment, CommentsResponse, CreateCommentRequest } from '@/types/posts';

type CommentsCacheEntry = {
  comments: PostComment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  fetchedAt: number;
};

const commentsCache = new Map<string, CommentsCacheEntry>();

// Helper function to build comment tree from flat array
// Only allows 1 level deep: POST -> COMMENT -> REPLY (no deeper nesting)
function buildCommentTree(comments: PostComment[]): PostComment[] {
  const commentMap = new Map<string, PostComment & { replies: PostComment[] }>();
  const rootComments: (PostComment & { replies: PostComment[] })[] = [];

  // First pass: create all comment nodes with empty replies array
  comments.forEach((comment) => {
    commentMap.set(comment.id, {
      ...comment,
      replies: [],
    });
  });

  // Second pass: build tree structure (only 1 level deep)
  comments.forEach((comment) => {
    const node = commentMap.get(comment.id);
    if (!node) return;

    if (comment.parent_comment_id) {
      // This is a reply - find its parent
      const parent = commentMap.get(comment.parent_comment_id);
      if (parent) {
        // Only attach as reply if parent is a top-level comment (has no parent itself)
        // This filters out level 2+ replies that might exist in the database
        const parentComment = comments.find(c => c.id === comment.parent_comment_id);
        if (parentComment && !parentComment.parent_comment_id) {
          // Parent is top-level, so this reply is valid (level 1)
          parent.replies.push(node);
        }
        // If parent is also a reply (has parent_comment_id), ignore this comment
        // This prevents level 2+ replies from being displayed
      }
    } else {
      // This is a top-level comment
      rootComments.push(node);
    }
  });

  // Sort root comments and replies by created_at
  rootComments.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  rootComments.forEach((comment) => {
    comment.replies.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });

  return rootComments;
}

interface UseCommentsOptions {
  enabled?: boolean;
  /** Max comments to fetch (e.g. 2 for feed preview, 20 for full list). Default 20. */
  limit?: number;
  initialComments?: PostComment[];
  initialTotal?: number;
}

type FetchOptions = {
  showLoading?: boolean;
  bypassCache?: boolean;
};

const DEFAULT_LIMIT = 20;

function getCacheKey(postId: string, limit: number): string {
  return limit === DEFAULT_LIMIT ? postId : `${postId}-${limit}`;
}

export function useComments(postId: string, options: UseCommentsOptions = {}) {
  const { user, session, getAuthHeaders } = useAuth();
  const enabled = options.enabled ?? true;
  const limit = Math.min(Math.max(options.limit ?? DEFAULT_LIMIT, 1), 100);
  const cacheKey = getCacheKey(postId, limit);
  const { initialComments, initialTotal } = options;
  const seededComments = initialComments ?? [];
  const seededTotal = typeof initialTotal === 'number' ? initialTotal : seededComments.length;
  const hasInitialSeed = seededComments.length > 0;
  const [comments, setComments] = useState<PostComment[]>(seededComments);
  const [loading, setLoading] = useState(enabled && !hasInitialSeed);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit,
    total: seededTotal,
    totalPages: 0,
  });
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(hasInitialSeed ? Date.now() : null);
  const [loadedFromCache, setLoadedFromCache] = useState(hasInitialSeed);
  const seededAppliedRef = useRef(false);
  const fetchedRef = useRef(false);
  const likeRollbackRef = useRef<{
    commentId: string;
    is_liked: boolean;
    likes_count: number;
  } | null>(null);

  const applyEntry = useCallback(
    (cacheEntry: CommentsCacheEntry, source: 'cache' | 'remote') => {
      setComments(cacheEntry.comments);
      setPagination(cacheEntry.pagination);
      setLastFetchedAt(cacheEntry.fetchedAt);
      setLoadedFromCache(source === 'cache');
      setLoading(false);
    },
    [],
  );

  const fetchComments = useCallback(
    async (page = 1, { showLoading = true, bypassCache = false }: FetchOptions = {}) => {
      if (!enabled || !user || !postId || !session) return;

      if (bypassCache) {
        commentsCache.delete(cacheKey);
      } else {
        const cachedEntry = commentsCache.get(cacheKey);
        if (cachedEntry) {
          applyEntry(cachedEntry, 'cache');
          return;
        }
      }

      try {
        if (showLoading) {
          setLoading(true);
        }
        setError(null);

        const response = await fetch(`/api/posts/${postId}/comments?page=${page}&limit=${limit}`, {
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch comments');
        }

        const data: CommentsResponse = await response.json();
        const entry: CommentsCacheEntry = {
          comments: data.comments,
          pagination: data.pagination,
          fetchedAt: Date.now(),
        };

        commentsCache.set(cacheKey, entry);
        applyEntry(entry, 'remote');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch comments');
        setLoading(false);
      }
    },
    [applyEntry, cacheKey, enabled, getAuthHeaders, limit, postId, session, user],
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
          const timestamp = Date.now();
          const updated = [...prevComments, comment];
          commentsCache.set(cacheKey, {
            comments: updated,
            pagination: {
              ...pagination,
              total: pagination.total + 1,
            },
            fetchedAt: timestamp,
          });
          setLastFetchedAt(timestamp);
          setLoadedFromCache(false);
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
    [cacheKey, getAuthHeaders, pagination, postId, session, user],
  );

  const createReply = useCallback(
    async (parentCommentId: string, replyData: CreateCommentRequest) => {
      if (!user || !postId || !session) return null;

      try {
        const response = await fetch(`/api/posts/${postId}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            ...replyData,
            parent_comment_id: parentCommentId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create reply');
        }

        const { comment } = await response.json();

        setComments((prevComments) => {
          const timestamp = Date.now();
          const updated = [...prevComments, comment];
          commentsCache.set(cacheKey, {
            comments: updated,
            pagination: {
              ...pagination,
              total: pagination.total + 1,
            },
            fetchedAt: timestamp,
          });
          setLastFetchedAt(timestamp);
          setLoadedFromCache(false);
          return updated;
        });

        setPagination((prev) => ({
          ...prev,
          total: prev.total + 1,
        }));

        return comment;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create reply');
        return null;
      }
    },
    [cacheKey, getAuthHeaders, pagination, postId, session, user],
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
          const timestamp = Date.now();
          const updated = prevComments.filter((comment) => comment.id !== commentId);
          commentsCache.set(cacheKey, {
            comments: updated,
            pagination: {
              ...pagination,
              total: Math.max(0, pagination.total - 1),
            },
            fetchedAt: timestamp,
          });
          setLastFetchedAt(timestamp);
          setLoadedFromCache(false);
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
    [cacheKey, getAuthHeaders, pagination, postId, session, user],
  );

  const likeComment = useCallback(
    async (commentId: string) => {
      if (!user || !session) return false;

      setComments((prevComments) => {
        const comment = prevComments.find((c) => c.id === commentId);
        if (!comment) return prevComments;

        const prevLiked = comment.is_liked ?? false;
        const prevCount = comment.likes_count ?? 0;
        likeRollbackRef.current = { commentId, is_liked: prevLiked, likes_count: prevCount };

        const updated = prevComments.map((c) =>
          c.id === commentId
            ? {
                ...c,
                is_liked: !prevLiked,
                likes_count: prevLiked
                  ? Math.max(0, prevCount - 1)
                  : prevCount + 1,
              }
            : c,
        );

        const cached = commentsCache.get(cacheKey);
        if (cached) {
          commentsCache.set(cacheKey, {
            comments: updated,
            pagination: cached.pagination,
            fetchedAt: cached.fetchedAt,
          });
        }

        return updated;
      });

      try {
        const response = await fetch(`/api/posts/${postId}/comments/${commentId}/like`, {
          method: 'POST',
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error('Failed to like comment');
        }

        likeRollbackRef.current = null;
        return true;
      } catch (err) {
        const rollback = likeRollbackRef.current;
        if (rollback?.commentId === commentId) {
          setComments((prevComments) => {
            const reverted = prevComments.map((c) =>
              c.id === commentId
                ? { ...c, is_liked: rollback.is_liked, likes_count: rollback.likes_count }
                : c,
            );
            const cached = commentsCache.get(cacheKey);
            if (cached) {
              commentsCache.set(cacheKey, {
                comments: reverted,
                pagination: cached.pagination,
                fetchedAt: cached.fetchedAt,
              });
            }
            return reverted;
          });
        }
        likeRollbackRef.current = null;
        setError(err instanceof Error ? err.message : 'Failed to like comment');
        throw err;
      }
    },
    [cacheKey, getAuthHeaders, postId, session, user],
  );

  useEffect(() => {
    seededAppliedRef.current = false;
    fetchedRef.current = false;
  }, [postId, cacheKey]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const cached = commentsCache.get(cacheKey);
    if (cached) {
      applyEntry(cached, 'cache');
      fetchedRef.current = true;
      return;
    }

    if (!seededAppliedRef.current && hasInitialSeed && seededComments.length) {
      const timestamp = Date.now();
      const totalPages = seededTotal > 0 ? Math.max(1, Math.ceil(seededTotal / pagination.limit)) : 0;
      setComments(seededComments);
      setPagination((prev) => ({
        ...prev,
        total: seededTotal,
        totalPages,
      }));
      setLastFetchedAt(timestamp);
      setLoadedFromCache(true);
      setLoading(false);
      seededAppliedRef.current = true;
    }

    if (!fetchedRef.current && !commentsCache.has(cacheKey)) {
      const shouldShowLoading = !hasInitialSeed || !seededAppliedRef.current;
      fetchComments(1, { showLoading: shouldShowLoading });
      fetchedRef.current = true;
    }
  }, [
    applyEntry,
    cacheKey,
    enabled,
    fetchComments,
    hasInitialSeed,
    initialComments,
    initialTotal,
    pagination.limit,
    postId,
    seededComments,
    seededTotal,
  ]);

  useEffect(() => {
    if (!enabled || !postId) {
      return;
    }

    const channel = supabase
      .channel(`post-comments:${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'post_comments',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          const newComment = payload.new as PostComment;
          setComments((prev) => {
            if (prev.some((c) => c.id === newComment.id)) {
              return prev;
            }
            const updated = [...prev, newComment];
            const timestamp = Date.now();
            const cached = commentsCache.get(cacheKey);
            const nextPagination = {
              ...pagination,
              total: (pagination.total ?? prev.length) + 1,
            };
            commentsCache.set(cacheKey, {
              comments: updated,
              pagination: cached?.pagination ?? nextPagination,
              fetchedAt: timestamp,
            });
            setLastFetchedAt(timestamp);
            setLoadedFromCache(false);
            setPagination(nextPagination);
            return updated;
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'post_comments',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          const deletedId = payload.old.id as string;
          setComments((prev) => {
            if (!prev.some((c) => c.id === deletedId)) {
              return prev;
            }
            const updated = prev.filter((c) => c.id !== deletedId);
            const timestamp = Date.now();
            const cached = commentsCache.get(cacheKey);
            const nextPagination = {
              ...pagination,
              total: Math.max(0, (pagination.total ?? prev.length) - 1),
            };
            commentsCache.set(cacheKey, {
              comments: updated,
              pagination: cached?.pagination ?? nextPagination,
              fetchedAt: timestamp,
            });
            setLastFetchedAt(timestamp);
            setLoadedFromCache(false);
            setPagination(nextPagination);
            return updated;
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'post_comments',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          const updatedComment = payload.new as PostComment;
          setComments((prev) => {
            if (!prev.some((c) => c.id === updatedComment.id)) {
              return prev;
            }
            const updated = prev.map((c) => (c.id === updatedComment.id ? updatedComment : c));
            const timestamp = Date.now();
            const cached = commentsCache.get(cacheKey);
            commentsCache.set(cacheKey, {
              comments: updated,
              pagination: cached?.pagination ?? pagination,
              fetchedAt: timestamp,
            });
            setLastFetchedAt(timestamp);
            setLoadedFromCache(false);
            return updated;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cacheKey, enabled, pagination, postId]);

  const refresh = useCallback(async () => {
    fetchedRef.current = true;
    await fetchComments(1, { showLoading: true, bypassCache: true });
  }, [fetchComments]);

  const invalidateCache = useCallback(() => {
    commentsCache.delete(cacheKey);
    fetchedRef.current = false;
  }, [cacheKey]);

  const refetch = useCallback(() => fetchComments(1), [fetchComments]);

  return {
    comments,
    loading,
    error,
    pagination,
    fetchComments,
    refresh,
    createComment,
    createReply,
    deleteComment,
    likeComment,
    refetch,
    invalidateCache,
    lastFetchedAt,
    loadedFromCache,
    buildCommentTree: (comments: PostComment[]) => buildCommentTree(comments),
  };
}
