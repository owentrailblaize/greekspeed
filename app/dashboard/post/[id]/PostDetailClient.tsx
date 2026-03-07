'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { CommentModal } from '@/components/features/social/CommentModal';
import type { Post } from '@/types/posts';

interface PostDetailClientProps {
  post: Post;
  onLike: (postId: string) => void;
  onCommentAdded?: () => void;
  onBack: () => void;
}

/**
 * Post-detail view: sticky header (back + title) and embedded post + comments
 * (Threads-style). Reuses CommentModal in embedded mode for a single shared UX.
 */
export function PostDetailClient({
  post,
  onLike,
  onCommentAdded,
  onBack,
}: PostDetailClientProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white">
      {/* Sticky header: back + title */}
      <header className="flex-shrink-0 border-b border-slate-200/80 bg-white/95 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-9 w-9 p-0 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Back to feed"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-slate-900 text-base sm:text-lg truncate">
            Post
          </h1>
        </div>
      </header>

      {/* Scrollable post + comments (CommentModal embedded, no dialog) */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <CommentModal
          isOpen={true}
          onClose={onBack}
          post={post}
          onLike={onLike}
          onCommentAdded={onCommentAdded}
          embedded
        />
      </div>
    </div>
  );
}
