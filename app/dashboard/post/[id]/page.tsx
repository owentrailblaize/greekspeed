'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import type { Post } from '@/types/posts';
import { PostDetailClient } from '@/app/dashboard/post/[id]/PostDetailClient';
import { Button } from '@/components/ui/button';
import { DeletePostModal } from '@/components/features/social/DeletePostModal';
import { EditPostModal } from '@/components/features/social/EditPostModal';
import { ReportPostModal } from '@/components/features/social/ReportPostModal';
import { NetworkingSpotlightCard } from '@/components/features/dashboard/dashboards/ui/NetworkingSpotlightCard';
import { MobileBottomNavigation } from '@/components/features/dashboard/dashboards/ui/MobileBottomNavigation';
import { toast } from 'react-toastify';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getAuthHeaders } = useAuth();
  const postId = typeof params.id === 'string' ? params.id : null;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingPost, setDeletingPost] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

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

  const handleDeletePost = useCallback(async () => {
    if (!postId || !deletingPost) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Failed to delete post');
      }
      setDeletingPost(null);
      router.back();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  }, [postId, deletingPost, getAuthHeaders, router]);

  const handleSaveEdit = useCallback(
    async (content: string) => {
      if (!postId) return;
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Failed to update post');
      }
      setShowEditModal(false);
      fetchPost();
    },
    [postId, getAuthHeaders, fetchPost]
  );

  const handleSubmitReport = useCallback(
    async (reportedPostId: string, reason: string) => {
      const res = await fetch(`/api/posts/${reportedPostId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Failed to submit report');
      }
      setShowReportModal(false);
      toast.success('Report submitted');
    },
    [getAuthHeaders]
  );

  const handleBookmark = useCallback(
    async (bookmarkPostId: string) => {
      try {
        const res = await fetch(`/api/posts/${bookmarkPostId}/bookmark`, {
          method: 'POST',
          headers: getAuthHeaders(),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error ?? 'Failed to update bookmark');
        }
        const { bookmarked } = await res.json();
        await fetchPost();
        toast.success(bookmarked ? 'Post saved' : 'Removed from saved');
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : 'Failed to update bookmark');
      }
    },
    [getAuthHeaders, fetchPost]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleBack();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleBack]);

  if (!postId) {
    return (
      <div className="flex flex-col flex-1 min-h-0 bg-gray-50">
        <div className="max-w-2xl mx-auto w-full flex flex-col items-center justify-center min-h-[50vh] px-4">
          <p className="text-slate-500 mb-4">Invalid post</p>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Back to feed
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

  const postContent = (
    <PostDetailClient
      post={post}
      onLike={handleLike}
      onCommentAdded={fetchPost}
      onBack={handleBack}
      onDelete={() => setDeletingPost(post)}
      onEdit={() => setShowEditModal(true)}
      onReport={() => setShowReportModal(true)}
      onBookmark={handleBookmark}
    />
  );

  return (
    <>
      {/* Mobile: fixed full-viewport container (like messages). Desktop: normal flow. */}
      <div className="fixed inset-0 lg:relative lg:inset-auto flex flex-col overflow-hidden h-screen lg:h-[calc(100vh-4rem)] bg-white lg:bg-gray-50">
        <div className="flex-1 min-h-0 flex flex-col pt-[3.5rem] lg:pt-0 overflow-hidden">
          <div className="max-w-full mx-auto px-0 lg:px-6 py-0 lg:py-4 w-full flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Desktop: card layout with sidebar */}
            <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6 flex-1 min-h-0 overflow-hidden items-stretch">
              <aside className="col-span-3 col-start-1 row-start-1 min-h-0 h-full flex flex-col overflow-hidden">
                <NetworkingSpotlightCard />
              </aside>
              <main className="col-span-9 col-start-4 row-start-1 flex flex-col min-h-0 min-w-0">
                <div className="flex-1 min-h-0 flex flex-col items-center">
                  <div className="w-full max-w-4xl flex flex-col flex-1 min-h-0 bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
                    {postContent}
                  </div>
                </div>
              </main>
            </div>
            {/* Mobile/tablet: cardless full-screen */}
            <div className="lg:hidden flex-1 min-h-0 flex flex-col w-full">
              <div className="w-full flex flex-col flex-1 min-h-0 bg-white">
                {postContent}
              </div>
            </div>
          </div>
        </div>
        <MobileBottomNavigation />
      </div>

    <DeletePostModal
      isOpen={!!deletingPost}
      onClose={() => setDeletingPost(null)}
      onConfirm={handleDeletePost}
      post={deletingPost}
      isDeleting={isDeleting}
    />
    <EditPostModal
      isOpen={showEditModal}
      onClose={() => setShowEditModal(false)}
      post={post}
      onSave={handleSaveEdit}
    />
    <ReportPostModal
      isOpen={showReportModal}
      onClose={() => setShowReportModal(false)}
      post={post}
      onSubmit={handleSubmitReport}
    />
  </>
  );
}
