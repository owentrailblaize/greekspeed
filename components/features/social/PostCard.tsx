'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { Post } from '@/types/posts';
import { formatDistanceToNow } from 'date-fns';
import { CommentModal } from './CommentModal';
import { DeletePostModal } from './DeletePostModal';

const MAX_COLLAPSED_CHARS = 220;

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onCommentAdded?: () => void;
}

export function PostCard({ post, onLike, onDelete, onCommentAdded }: PostCardProps) {
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const { displayContent, shouldTruncate } = useMemo(() => {
    const content = post.content ?? '';

    if (content.length <= MAX_COLLAPSED_CHARS) {
      return {
        displayContent: content,
        shouldTruncate: false,
      };
    }

    const truncated = content.slice(0, MAX_COLLAPSED_CHARS).trimEnd();

    return {
      displayContent: isExpanded ? content : `${truncated}…`,
      shouldTruncate: true,
    };
  }, [isExpanded, post.content]);

  const renderPostContent = (textClassName: string, buttonClassName: string) => {
    if (!post.content) return null;

    return (
      <div className="space-y-2">
        <p className={`${textClassName} break-words whitespace-pre-wrap`}>{displayContent}</p>
        {shouldTruncate && (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className={buttonClassName}
          >
            {isExpanded ? 'View less' : 'View more'}
          </button>
        )}
      </div>
    );
  };

  const commentsPreview = post.comments_preview ?? [];
  const hasComments = (post.comments_count ?? 0) > 0;
  const commentCountLabel = hasComments
    ? 'View Comments'
    : 'Add Comment';

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  const formatCommentSnippet = (content: string) => {
    if (!content) return '';
    const trimmed = content.trim();
    if (trimmed.length <= 140) return trimmed;
    return `${trimmed.slice(0, 137)}…`;
  };

  const renderCommentsPreview = () => {
    if (commentsPreview.length === 0) {
      return null;
    }

    return (
      <div className="mt-4 space-y-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 shadow-inner">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
          {commentsPreview.length > 1 ? 'Most recent comments' : 'Most recent comment'}
        </p>
        <div className="space-y-3">
          {commentsPreview.map((comment) => (
            <div key={comment.id} className="text-sm text-gray-600">
              <p className="font-medium text-gray-900">{comment.author?.full_name || 'Member'}</p>
              <p className="text-xs text-gray-400">{formatTimestamp(comment.created_at)}</p>
              <p className="mt-1 leading-relaxed">{formatCommentSnippet(comment.content)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(post.id);
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Failed to delete post:', error);
      // You could show a toast notification here
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  const handleLikeClick = () => {
    onLike(post.id);
  };

  return (
    <>
      {/* Mobile Layout - Card-less Feed */}
      <div className="sm:hidden">
        <div className="mx-1 mb-4 px-4 py-5 rounded-2xl border border-gray-100 bg-white/80 shadow-sm last:mb-0">
          {/* Post Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 bg-navy-100/80 rounded-full flex items-center justify-center text-navy-700 text-sm font-semibold shrink-0 overflow-hidden ring-2 ring-white shadow-sm">
                {post.author?.avatar_url ? (
                  <div className="relative h-full w-full">
                    <Image
                      src={post.author.avatar_url}
                      alt={post.author.full_name || 'User'}
                      fill
                      className="rounded-full object-cover"
                      sizes="40px"
                      priority={false}
                    />
                  </div>
                ) : (
                  post.author?.first_name?.charAt(0) || 'U'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm break-words">
                  {post.author?.full_name || 'Unknown User'}
                </h4>
                <p className="text-xs text-gray-500">{formatTimestamp(post.created_at)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {post.is_author && onDelete && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleDeleteClick}
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-2"
                  title="Delete post"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Post Content */}
          <div className="mb-4 space-y-4">
            {renderPostContent(
              'text-gray-700 text-sm leading-relaxed',
              'text-xs font-medium text-navy-600 hover:text-navy-700 transition-colors'
            )}
            {post.image_url && (
              <div className="relative w-full overflow-hidden rounded-2xl aspect-[4/3] shadow-inner" style={{ maxHeight: '20rem' }}>
                <Image
                  src={post.image_url}
                  alt="Post content"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 600px"
                  priority={false}
                />
              </div>
            )}
            {renderCommentsPreview()}
          </div>

          {/* Post Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onLike(post.id)}
                className={`gap-2 rounded-full px-3 text-sm transition ${
                  post.is_liked 
                    ? 'bg-rose-50 text-rose-500 hover:bg-rose-100' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Heart className={`h-4 w-4 ${post.is_liked ? 'fill-current' : ''}`} />
                <span>{post.likes_count}</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsCommentModalOpen(true)}
                className="gap-2 rounded-full px-3 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <MessageCircle className="h-4 w-4 text-blue-500" />
                <span>{commentCountLabel}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Preserved Card Design */}
      <Card className="hidden sm:block rounded-3xl border border-gray-100 bg-white/80 shadow-sm transition hover:shadow-lg">
        <CardContent className="space-y-4 p-6 sm:p-7">
          {/* Post Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 sm:h-11 sm:w-11 bg-navy-100/80 rounded-full flex items-center justify-center text-navy-700 text-sm font-semibold shrink-0 overflow-hidden ring-2 ring-white shadow-sm">
                {post.author?.avatar_url ? (
                  <div className="relative h-full w-full">
                    <Image
                      src={post.author.avatar_url}
                      alt={post.author.full_name || 'User'}
                      fill
                      className="rounded-full object-cover"
                      sizes="(max-width: 640px) 48px, 40px"
                      priority={false}
                    />
                  </div>
                ) : (
                  post.author?.first_name?.charAt(0) || 'U'
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-semibold text-gray-900 text-base sm:text-sm break-words">
                  {post.author?.full_name || 'Unknown User'}
                </h4>
              </div>

              <p className="text-xs uppercase tracking-wide text-gray-400">
                {formatTimestamp(post.created_at)}
              </p>
            </div>
            </div>
            
            <div>
              {post.is_author && onDelete && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleDeleteClick}
                  className="rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50"
                  title="Delete post"
                >
                  <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Post Content */}
          <div className="space-y-4">
            {renderPostContent(
              'text-gray-700 text-base sm:text-[0.95rem] leading-relaxed',
              'text-xs font-medium text-navy-600 hover:text-navy-700 transition-colors'
            )}
            {post.image_url && (
              <div className="relative w-full overflow-hidden rounded-3xl aspect-[4/3] shadow-inner" style={{ maxHeight: '24rem' }}>
                <Image
                  src={post.image_url}
                  alt="Post content"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 700px"
                  priority={false}
                />
              </div>
            )}
            {renderCommentsPreview()}
          </div>

          {/* Post Actions */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLikeClick}
                className={`gap-2 rounded-full px-3 py-2 text-sm transition ${
                  post.is_liked 
                    ? 'bg-rose-50 text-rose-500 hover:bg-rose-100' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Heart className={`h-4 w-4 ${post.is_liked ? 'fill-current' : ''}`} />
                <span>{post.likes_count}</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsCommentModalOpen(true)}
                className="gap-2 rounded-full px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <MessageCircle className="h-4 w-4 text-blue-500" />
                <span className="whitespace-nowrap">{commentCountLabel}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comment Modal */}
      {isCommentModalOpen && (
        <CommentModal
          isOpen={isCommentModalOpen}
          onClose={() => setIsCommentModalOpen(false)}
          post={post}
          onLike={onLike}
          onCommentAdded={onCommentAdded}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeletePostModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        post={post}
        isDeleting={isDeleting}
      />
    </>
  );
}
