'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { supabase } from '@/lib/supabase/client';
import { PostComment, CommentsResponse, CreateCommentRequest } from '@/types/posts';

export function useComments(postId: string) {
  const { user } = useAuth();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const fetchComments = useCallback(async (page = 1) => {
    if (!user || !postId) return;

    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(
        `/api/posts/${postId}/comments?page=${page}&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data: CommentsResponse = await response.json();
      setComments(data.comments);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  }, [user, postId]);

  const createComment = useCallback(async (commentData: CreateCommentRequest) => {
    if (!user || !postId) return null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(commentData)
      });

      if (!response.ok) {
        throw new Error('Failed to create comment');
      }

      const { comment } = await response.json();
      
      // Add the new comment to the end of the list
      setComments(prevComments => [...prevComments, comment]);
      
      // Update comment count in pagination
      setPagination(prev => ({
        ...prev,
        total: prev.total + 1
      }));
      
      return comment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create comment');
      return null;
    }
  }, [user, postId]);

  const deleteComment = useCallback(async (commentId: string) => {
    if (!user) return false;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      // Remove the comment from the local state
      setComments(prevComments => 
        prevComments.filter(comment => comment.id !== commentId)
      );
      
      // Update comment count in pagination
      setPagination(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1)
      }));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
      return false;
    }
  }, [user, postId]);

  const likeComment = useCallback(async (commentId: string) => {
    if (!user) return false;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/posts/${postId}/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to like comment');
      }

      const { liked } = await response.json();

      // Update the comment's like status and count
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === commentId 
            ? { 
                ...comment, 
                is_liked: liked,
                likes_count: liked ? comment.likes_count + 1 : Math.max(0, comment.likes_count - 1)
              }
            : comment
        )
      );
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to like comment');
      return false;
    }
  }, [user, postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    comments,
    loading,
    error,
    pagination,
    fetchComments,
    createComment,
    deleteComment,
    likeComment,
    refetch: () => fetchComments(1)
  };
}
