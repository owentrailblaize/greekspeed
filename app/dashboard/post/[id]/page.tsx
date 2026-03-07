'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import type { Post } from '@/types/posts';
import { PostDetailClient } from './PostDetailClient';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getAuthHeaders } = useAuth();
  const postId = typeof params.id === 'string' ? params.id : null;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    setError(null);
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/posts/${postId}`, { headers });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 404) setError('Post not found');
        else setError(data?.error ?? 'Failed to load post');
        setPost(null);
        return;
      }
      const data = await res.json();
      setPost(data);
    } catch {
      setError('Failed to load post');
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [postId, getAuthHeaders]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleLike = useCallback(async (likedPostId: string) => {
    const headers = getAuthHeaders();
    const res = await fetch(`/api/posts/${likedPostId}/like`, {
      method: 'POST',
      headers,
    });
    if (res.ok) fetchPost();
  }, [getAuthHeaders, fetchPost]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  if (!postId) {
    return (
      <div className="flex flex-col flex-1 min-h-0 bg-gray-50">
        <div className="max-w-2xl mx-auto w-full flex flex-col items-center justify-center min-h-[50vh] px-4">
          <p className="text-slate-500 mb-4">Invalid post</p>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Back to feed</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-0 bg-gray-50">
        <div className="max-w-2xl mx-auto w-full flex flex-col items-center justify-center min-h-[50vh] px-4">
          <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 mt-4">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col flex-1 min-h-0 bg-gray-50">
        <div className="max-w-2xl mx-auto w-full flex flex-col items-center justify-center min-h-[50vh] px-4">
          <p className="text-slate-500 mb-4">{error ?? 'Post not found'}</p>
          <Button variant="outline" onClick={handleBack}>
            Back to feed
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-gray-50">
      <div className="max-w-2xl mx-auto w-full flex flex-col flex-1 min-h-0 bg-white border border-slate-200/80 shadow-sm rounded-none sm:rounded-2xl overflow-hidden">
        <PostDetailClient
          post={post}
          onLike={handleLike}
          onCommentAdded={fetchPost}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}
