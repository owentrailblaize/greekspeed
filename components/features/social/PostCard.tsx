'use client';

import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Post } from '@/types/posts';
import { formatDistanceToNow } from 'date-fns';
import { CommentModal } from './CommentModal';
import { DeletePostModal } from './DeletePostModal';
import { LinkPreviewCard } from './LinkPreviewCard';
import { ClickableAvatar } from '@/components/features/user-profile/ClickableAvatar';
import { ClickableUserName } from '@/components/features/user-profile/ClickableUserName';

const MAX_COLLAPSED_CHARS = 220;

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onCommentAdded?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function PostCard({
  post,
  onLike,
  onDelete,
  onCommentAdded,
  isExpanded: isExpandedProp,
  onToggleExpand,
}: PostCardProps) {
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localExpanded, setLocalExpanded] = useState(false);
  const isExpanded = isExpandedProp ?? localExpanded;
  const handleExpandToggle = onToggleExpand ?? (() => setLocalExpanded((prev) => !prev));

  // Image viewer state
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Extract image URLs from post
  const imageUrls = useMemo(() => {
    // First check for multiple images in metadata (new format)
    if (post.metadata?.image_urls && Array.isArray(post.metadata.image_urls) && post.metadata.image_urls.length > 0) {
      return post.metadata.image_urls;
    }
    
    // Fall back to single image_url for backward compatibility
    if (post.image_url) {
      return [post.image_url];
    }
    
    return [];
  }, [post.image_url, post.metadata]);

  // Handle mount state for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Image click handler
  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsImageModalOpen(true);
  };

  // Navigation handlers
  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => 
      prev > 0 ? prev - 1 : imageUrls.length - 1
    );
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => 
      prev < imageUrls.length - 1 ? prev + 1 : 0
    );
  };

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

    // Get URLs that have previews - we'll hide these from the content
    const previewUrls = new Set(
      (post.metadata?.link_previews || []).map((preview: any) => preview.url)
    );

    // Convert URLs to clickable links, but skip URLs that have previews
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const contentWithLinks = displayContent.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        const cleanUrl = part.replace(/[.,;:!?]+$/, '');
        // If this URL has a preview card, don't render it as a link
        if (previewUrls.has(cleanUrl)) {
          return null; // Hide URLs that have preview cards
        }
        return (
          <a
            key={i}
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 hover:underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    }).filter(Boolean); // Remove null entries

    return (
      <div className="space-y-2">
        <p className={`${textClassName} break-words whitespace-pre-wrap`}>
          {contentWithLinks}
        </p>
        {shouldTruncate && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleExpandToggle(); }}
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
              {comment.author?.id && comment.author?.full_name ? (
                <ClickableUserName
                  userId={comment.author.id}
                  fullName={comment.author.full_name}
                  className="font-medium text-gray-900"
                />
              ) : (
                <p className="font-medium text-gray-900">{comment.author?.full_name || 'Member'}</p>
              )}
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

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button, a, [role="button"], img')) {
      return;
    }
    setIsCommentModalOpen(true);
  };

  // Image Viewer Modal Component
  const ImageViewerModal = () => {
    if (!mounted || !isImageModalOpen || imageUrls.length === 0) return null;

    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/90 backdrop-blur-sm"
          onClick={() => setIsImageModalOpen(false)}
        />
        
        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsImageModalOpen(false)}
          className="absolute top-4 right-4 z-10 h-10 w-10 p-0 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20"
          aria-label="Close image viewer"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Navigation Buttons (only show if multiple images) */}
        {imageUrls.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevImage();
              }}
              className="absolute left-4 z-10 h-12 w-12 p-0 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleNextImage();
              }}
              className="absolute right-4 z-10 h-12 w-12 p-0 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Image Container */}
        <div 
          className="relative max-w-[95vw] max-h-[95vh] w-full h-full flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={imageUrls[selectedImageIndex]}
            alt={`Post image ${selectedImageIndex + 1} of ${imageUrls.length}`}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>

        {/* Image Counter (only show if multiple images) */}
        {imageUrls.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
            {selectedImageIndex + 1} / {imageUrls.length}
          </div>
        )}
      </div>,
      document.body
    );
  };

  return (
    <>
      {/* Mobile Layout - Card-less Feed */}
      <div className="sm:hidden">
        <div 
          className="mx-1 mb-4 px-4 py-5 rounded-2xl border border-gray-100 bg-white/80 shadow-sm last:mb-0 cursor-pointer hover:bg-gray-50/50 transition-colors"
          onClick={handleCardClick}
        >
          {/* Post Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              {post.author?.id ? (
                <ClickableAvatar
                  userId={post.author.id}
                  avatarUrl={post.author.avatar_url}
                  fullName={post.author.full_name}
                  firstName={post.author.first_name}
                  lastName={post.author.last_name}
                  size="md"
                  className="h-11 w-11 ring-2 ring-white shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div className="h-11 w-11 bg-navy-100/80 rounded-full flex items-center justify-center text-navy-700 text-sm font-semibold shrink-0 overflow-hidden ring-2 ring-white shadow-sm">
                  {post.author?.first_name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                {post.author?.id && post.author?.full_name ? (
                  <ClickableUserName
                    userId={post.author.id}
                    fullName={post.author.full_name}
                    className="font-semibold text-gray-900 text-sm break-words block"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <h4 className="font-semibold text-gray-900 text-sm break-words">
                    {post.author?.full_name || 'Unknown User'}
                  </h4>
                )}
                <p className="text-xs text-gray-500">{formatTimestamp(post.created_at)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {post.is_author && onDelete && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); handleDeleteClick(); }}
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
            {/* Display images - support both single (backward compat) and multiple */}
            {(() => {
              if (imageUrls.length === 0) return null;
              
              // Single image - display large and make clickable
              if (imageUrls.length === 1) {
                return (
                  <div 
                    className="relative w-full overflow-hidden rounded-3xl aspect-[4/3] shadow-inner cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ maxHeight: '24rem' }}
                    onClick={(e) => { e.stopPropagation(); handleImageClick(0); }}
                  >
                    <Image
                      src={imageUrls[0]}
                      alt="Post content"
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 700px"
                      priority={false}
                    />
                  </div>
                );
              }
              
              // Multiple images - display in horizontal scrollable row (clickable)
              return (
                <div className="relative">
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                    {imageUrls.map((url, index) => (
                      <div
                        key={index}
                        className="relative shrink-0 w-32 h-32 sm:w-40 sm:h-40 rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-100 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); handleImageClick(index); }}
                      >
                        <Image
                          src={url}
                          alt={`Post image ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 128px, 160px"
                          priority={false}
                        />
                      </div>
                    ))}
                  </div>
                  {/* Removed image count text */}
                </div>
              );
            })()}
            {/* Link Previews */}
            {post.metadata?.link_previews && post.metadata.link_previews.length > 0 && (
              <div className="space-y-3">
                {post.metadata.link_previews.map((preview, index) => (
                  <LinkPreviewCard
                    key={preview.url || index}
                    preview={preview}
                    className="max-w-full"
                    hideImage={imageUrls.length > 0}
                  />
                ))}
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
                onClick={(e) => { e.stopPropagation(); handleLikeClick(); }}
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
                onClick={(e) => { e.stopPropagation(); setIsCommentModalOpen(true); }}
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
      <Card 
        className="hidden sm:block rounded-3xl border border-gray-100 bg-white/80 shadow-sm transition hover:shadow-lg cursor-pointer"
        onClick={handleCardClick}
      >
        <CardContent className="space-y-4 p-6 sm:p-7">
          {/* Post Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {post.author?.id ? (
                <ClickableAvatar
                  userId={post.author.id}
                  avatarUrl={post.author.avatar_url}
                  fullName={post.author.full_name}
                  firstName={post.author.first_name}
                  lastName={post.author.last_name}
                  size="md"
                  className="h-12 w-12 sm:h-11 sm:w-11 ring-2 ring-white shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div className="h-12 w-12 sm:h-11 sm:w-11 bg-navy-100/80 rounded-full flex items-center justify-center text-navy-700 text-sm font-semibold shrink-0 overflow-hidden ring-2 ring-white shadow-sm">
                  {post.author?.first_name?.charAt(0) || 'U'}
                </div>
              )}

              <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {post.author?.id && post.author?.full_name ? (
                  <ClickableUserName
                    userId={post.author.id}
                    fullName={post.author.full_name}
                    className="font-semibold text-gray-900 text-base sm:text-sm break-words"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <h4 className="font-semibold text-gray-900 text-base sm:text-sm break-words">
                    {post.author?.full_name || 'Unknown User'}
                  </h4>
                )}
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
                  onClick={(e) => { e.stopPropagation(); handleDeleteClick(); }}
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
            {/* Display images - support both single (backward compat) and multiple */}
            {(() => {
              if (imageUrls.length === 0) return null;
              
              // Single image - display large and make clickable
              if (imageUrls.length === 1) {
                return (
                  <div 
                    className="relative w-full overflow-hidden rounded-3xl aspect-[4/3] shadow-inner cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ maxHeight: '24rem' }}
                    onClick={(e) => { e.stopPropagation(); handleImageClick(0); }}
                  >
                    <Image
                      src={imageUrls[0]}
                      alt="Post content"
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 700px"
                      priority={false}
                    />
                  </div>
                );
              }
              
              // Multiple images - display in horizontal scrollable row (clickable)
              return (
                <div className="relative">
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                    {imageUrls.map((url, index) => (
                      <div
                        key={index}
                        className="relative shrink-0 w-32 h-32 sm:w-40 sm:h-40 rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-100 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); handleImageClick(index); }}
                      >
                        <Image
                          src={url}
                          alt={`Post image ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 700px"
                          priority={false}
                        />
                      </div>
                    ))}
                  </div>
                  {/* Removed image count text */}
                </div>
              );
            })()}
            {/* Link Previews */}
            {post.metadata?.link_previews && post.metadata.link_previews.length > 0 && (
              <div className="space-y-3">
                {post.metadata.link_previews.map((preview, index) => (
                  <LinkPreviewCard
                    key={preview.url || index}
                    preview={preview}
                    className="max-w-full"
                    hideImage={imageUrls.length > 0}
                  />
                ))}
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
                onClick={(e) => { e.stopPropagation(); handleLikeClick(); }}
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
                onClick={(e) => { e.stopPropagation(); setIsCommentModalOpen(true); }}
                className="gap-2 rounded-full px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <MessageCircle className="h-4 w-4 text-blue-500" />
                <span className="whitespace-nowrap">{commentCountLabel}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Viewer Modal */}
      <ImageViewerModal />

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
