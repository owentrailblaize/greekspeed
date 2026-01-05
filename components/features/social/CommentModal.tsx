'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Heart, MessageCircle, Share, Trash2, Send, RefreshCcw, ChevronLeft, ChevronRight, Reply, ChevronDown, ChevronUp } from 'lucide-react';
import { Post, PostComment, CreateCommentRequest } from '@/types/posts';
import { useComments } from '@/lib/hooks/useComments';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { useProfileModal } from '@/lib/contexts/ProfileModalContext';
import { formatDistanceToNow } from 'date-fns';
import { ClickableAvatar } from '@/components/features/user-profile/ClickableAvatar';
import { ClickableUserName } from '@/components/features/user-profile/ClickableUserName';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  onLike: (postId: string) => void;
  onCommentAdded?: () => void;
}

export function CommentModal({ isOpen, onClose, post, onLike, onCommentAdded }: CommentModalProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [isSubmittingReply, setIsSubmittingReply] = useState<Record<string, boolean>>({});
  // Track which comments have their replies collapsed (hidden) or expanded (showing all)
  const [collapsedReplies, setCollapsedReplies] = useState<Set<string>>(new Set());
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  
  // Add mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const {
    comments,
    loading,
    error,
    createComment,
    createReply,
    deleteComment,
    likeComment,
    refresh,
    lastFetchedAt,
    loadedFromCache,
    buildCommentTree,
  } = useComments(post.id, {
    enabled: isOpen,
    initialComments: post.comments_preview,
    initialTotal: post.comments_count,
  });
  const { profile } = useProfile();
  const { isProfileModalOpen } = useProfileModal();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commentsScrollRef = useRef<HTMLDivElement | null>(null);
  
  // Build comment tree from flat array
  const commentTree = useMemo(() => {
    return buildCommentTree(comments);
  }, [comments, buildCommentTree]);
  const lastUpdatedLabel =
    typeof lastFetchedAt === 'number' ? formatRelativeMoment(lastFetchedAt) : null;

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Get images from metadata or single image_url
  const imageUrls = useMemo<string[]>(() => {
    return post.metadata?.image_urls || (post.image_url ? [post.image_url] : []);
  }, [post.metadata?.image_urls, post.image_url]);

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle keyboard navigation in image modal
  useEffect(() => {
    if (!isImageModalOpen || imageUrls.length <= 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : imageUrls.length - 1));
      } else if (e.key === 'ArrowRight') {
        setSelectedImageIndex((prev) => (prev < imageUrls.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Escape') {
        setIsImageModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImageModalOpen, imageUrls.length]);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsImageModalOpen(true);
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev < imageUrls.length - 1 ? prev + 1 : 0));
  };

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : imageUrls.length - 1));
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createComment({ 
        content: newComment.trim()
      });
      setNewComment('');
      // Focus back on textarea for quick commenting
      textareaRef.current?.focus();
      // Notify parent component that a comment was added
      onCommentAdded?.();
    } catch (error) {
      console.error('Failed to create comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentCommentId: string) => {
    const content = replyContent[parentCommentId];
    if (!content?.trim() || isSubmittingReply[parentCommentId]) return;

    setIsSubmittingReply(prev => ({ ...prev, [parentCommentId]: true }));
    try {
      await createReply(parentCommentId, { 
        content: content.trim()
      });
      setReplyContent(prev => {
        const updated = { ...prev };
        delete updated[parentCommentId];
        return updated;
      });
      setReplyingToCommentId(null);
      onCommentAdded?.();
    } catch (error) {
      console.error('Failed to create reply:', error);
    } finally {
      setIsSubmittingReply(prev => ({ ...prev, [parentCommentId]: false }));
    }
  };

  const handleCancelReply = (commentId: string) => {
    setReplyingToCommentId(null);
    setReplyContent(prev => {
      const updated = { ...prev };
      delete updated[commentId];
      return updated;
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      await deleteComment(commentId);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    await likeComment(commentId);
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refresh();
    } catch (err) {
      console.error('Failed to refresh comments:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  function formatRelativeMoment(timestamp: number | null) {
    if (!timestamp) return null;
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return null;
    }
  }

  // Helper function to count total replies recursively
  const countReplies = (comment: PostComment): number => {
    if (!comment.replies || comment.replies.length === 0) return 0;
    return comment.replies.length + comment.replies.reduce((sum, reply) => sum + countReplies(reply), 0);
  };

  // Toggle reply visibility
  const toggleReplies = (commentId: string) => {
    setCollapsedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        // Uncollapse - show replies
        newSet.delete(commentId);
      } else {
        // Collapse - hide replies
        newSet.add(commentId);
        setExpandedReplies(expanded => {
          const newExpanded = new Set(expanded);
          newExpanded.delete(commentId);
          return newExpanded;
        });
      }
      return newSet;
    });
  };

  // Expand to show all replies
  const expandReplies = (commentId: string) => {
    setExpandedReplies(prev => new Set(prev).add(commentId));
    setCollapsedReplies(prev => {
      const newSet = new Set(prev);
      newSet.delete(commentId);
      return newSet;
    });
  };

  // Recursive component to render comment with replies
  // MAX_DEPTH = 1 means: POST -> COMMENT (depth 0) -> REPLY (depth 1) -> STOP
  const MAX_DEPTH = 1;
  
  const renderComment = (comment: PostComment, depth: number = 0): React.ReactNode => {
    // Stop rendering if we've exceeded max depth (prevent level 2+ replies from showing)
    if (depth > MAX_DEPTH) {
      return null;
    }
    
    const isReply = depth > 0;
    const isReplying = replyingToCommentId === comment.id;
    const currentReplyContent = replyContent[comment.id] || '';
    const isSubmittingCurrentReply = isSubmittingReply[comment.id] || false;
    const hasReplies = comment.replies && comment.replies.length > 0;
    const replyCount = comment.replies?.length || 0;
    const totalReplyCount = countReplies(comment);
    const isCollapsed = collapsedReplies.has(comment.id);
    const isExpanded = expandedReplies.has(comment.id);
    // Show first 2-3 replies by default, then require expansion
    const defaultVisibleReplies = 2;
    const shouldShowMoreButton = replyCount > defaultVisibleReplies;
    const visibleReplies = isCollapsed 
      ? [] 
      : isExpanded || !shouldShowMoreButton
      ? comment.replies || []
      : (comment.replies || []).slice(0, defaultVisibleReplies);
    const hiddenRepliesCount = (comment.replies || []).length - visibleReplies.length;

    return (
      <div key={comment.id} className={cn(
        "py-3 relative",
        isReply && "ml-8 sm:ml-10 pl-4 sm:pl-5"
      )}>
        {/* Reply indicator line - subtle left border */}
        {isReply && (
          <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200" />
        )}
        
        <div className="flex items-start gap-3 sm:gap-4 relative">
          {comment.author?.id ? (
            <ClickableAvatar
              userId={comment.author.id}
              avatarUrl={comment.author.avatar_url}
              fullName={comment.author.full_name}
              firstName={comment.author.first_name}
              lastName={comment.author.last_name}
              size="sm"
              className="w-9 h-9 sm:w-10 sm:h-10 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 text-sm font-medium shrink-0 overflow-hidden">
              {comment.author?.first_name?.charAt(0) || 'U'}
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* No card wrapper - clean layout */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {comment.author?.id && comment.author?.full_name ? (
                <ClickableUserName
                  userId={comment.author.id}
                  fullName={comment.author.full_name}
                  className="font-semibold text-slate-900 text-sm sm:text-base break-words"
                />
              ) : (
                <span className="font-semibold text-slate-900 text-sm sm:text-base break-words">
                  {comment.author?.full_name || 'Unknown User'}
                </span>
              )}
              <span className="text-xs sm:text-sm text-slate-500">
                {formatTimestamp(comment.created_at)}
              </span>
            </div>

            <p className="text-slate-900 text-sm sm:text-base leading-relaxed mb-2 break-words">
              {comment.content}
            </p>

            {/* Comment Actions - buttons keep existing styles */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLikeComment(comment.id)}
                className={cn(
                  comment.is_liked
                    ? 'bg-rose-50/80 text-rose-500 border border-transparent hover:bg-rose-100'
                    : 'bg-white/90 text-slate-500 border border-transparent hover:bg-rose-50 hover:text-rose-500',
                  "text-xs sm:text-sm h-8 rounded-full px-4 shadow-sm transition"
                )}
              >
                <Heart
                  className={cn(
                    "h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2",
                    comment.is_liked ? 'fill-current' : ''
                  )}
                />
                {comment.likes_count || 0}
              </Button>
              
              {/* Reply button - only show for top-level comments (depth 0) */}
              {depth === 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReplyingToCommentId(comment.id);
                    setReplyContent(prev => ({ ...prev, [comment.id]: '' }));
                  }}
                  className="text-xs sm:text-sm h-8 rounded-full px-4 bg-blue-50/80 text-blue-500 border border-transparent hover:bg-blue-100 shadow-sm transition"
                >
                  <Reply className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Reply
                </Button>
              )}

              {/* Reply count badge - show on top-level comments with replies */}
              {depth === 0 && hasReplies && (
                <button
                  onClick={() => toggleReplies(comment.id)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 px-2 py-1 rounded-md hover:bg-blue-50/50 transition-colors"
                  aria-label={isCollapsed ? `Show ${totalReplyCount} replies` : `Hide replies`}
                >
                  {isCollapsed ? (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      Show {totalReplyCount} {totalReplyCount === 1 ? 'reply' : 'replies'}
                    </>
                  ) : (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      Hide {totalReplyCount} {totalReplyCount === 1 ? 'reply' : 'replies'}
                    </>
                  )}
                </button>
              )}

              {comment.author_id === profile?.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-xs sm:text-sm h-8 rounded-full px-4 bg-white/90 text-red-500 border border-transparent hover:bg-red-50 shadow-sm transition"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Delete
                </Button>
              )}
            </div>

            {/* Inline Reply Input */}
            {isReplying && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="mb-2">
                  <p className="text-xs text-blue-600 font-medium">
                    Replying to {comment.author?.full_name || 'this comment'}
                  </p>
                </div>
                <div className="flex items-end gap-3">
                  <div className="w-8 h-8 bg-navy-100/70 rounded-full flex items-center justify-center text-navy-700 text-xs font-semibold shrink-0 overflow-hidden ring-2 ring-white">
                    {profile?.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.full_name || 'User'}
                        width={32}
                        height={32}
                        className="h-full w-full rounded-full object-cover"
                        sizes="32px"
                      />
                    ) : (
                      profile?.first_name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Write a reply..."
                      value={currentReplyContent}
                      onChange={(e) => setReplyContent(prev => ({ ...prev, [comment.id]: e.target.value }))}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmitReply(comment.id);
                        }
                      }}
                      className="min-h-[40px] max-h-[100px] resize-none rounded-xl border border-transparent bg-white/80 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-navy-300 focus:bg-white focus:ring-2 focus:ring-navy-200 transition"
                      rows={1}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelReply(comment.id)}
                      className="rounded-full h-8 px-3 text-xs text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleSubmitReply(comment.id)}
                      disabled={!currentReplyContent.trim() || isSubmittingCurrentReply}
                      className="h-8 w-8 rounded-full bg-navy-600/90 text-white shadow-sm transition-all duration-200 hover:bg-navy-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center p-0"
                    >
                      {isSubmittingCurrentReply ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 text-white" strokeWidth={2} />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Render Replies - clean spacing */}
            {hasReplies && !isCollapsed && (
              <div className="mt-2 space-y-0">
                {visibleReplies.map((reply) => renderComment(reply, depth + 1))}
                
                {/* Show more replies button */}
                {hiddenRepliesCount > 0 && (
                  <button
                    onClick={() => expandReplies(comment.id)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 px-3 py-2 rounded-md hover:bg-blue-50/50 transition-colors ml-8 sm:ml-12"
                    aria-label={`Show ${hiddenRepliesCount} more replies`}
                  >
                    <ChevronDown className="h-3 w-3" />
                    Show {hiddenRepliesCount} more {hiddenRepliesCount === 1 ? 'reply' : 'replies'}
                  </button>
                )}
              </div>
            )}
            
            {/* Collapsed state indicator */}
            {hasReplies && isCollapsed && (
              <div className="mt-2 ml-0">
                <button
                  onClick={() => toggleReplies(comment.id)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 px-3 py-2 rounded-md hover:bg-blue-50/50 transition-colors"
                >
                  <ChevronDown className="h-3 w-3" />
                  Show {totalReplyCount} {totalReplyCount === 1 ? 'reply' : 'replies'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Image Viewer Modal Component (same as PostCard)
  const ImageViewerModal = () => {
    if (!mounted || !isImageModalOpen || imageUrls.length === 0) return null;

    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-black/90 backdrop-blur-sm"
          onClick={() => setIsImageModalOpen(false)}
        />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsImageModalOpen(false)}
          className="absolute top-4 right-4 z-10 h-10 w-10 p-0 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20"
          aria-label="Close image viewer"
        >
          <X className="h-5 w-5" />
        </Button>

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
    <Dialog open={isOpen} onOpenChange={onClose} modal={!isProfileModalOpen}>
      <DialogContent 
        className={cn(
          // Mobile: Bottom sheet style - iOS 16+ fixed
          isMobile 
            ? "fixed left-0 right-0 bottom-0 top-auto z-50 w-full max-h-[85dvh] mt-[15dvh] rounded-t-2xl rounded-b-none flex flex-col overflow-hidden border border-slate-200/80 bg-white/95 backdrop-blur-md shadow-[0_28px_90px_-40px_rgba(15,23,42,0.55)] p-0 translate-x-0 translate-y-0 pb-[env(safe-area-inset-bottom)]"
            // Desktop: Centered modal (existing style)
            : "sm:max-w-[720px] max-w-[95vw] h-[100dvh] sm:h-[85vh] flex flex-col overflow-hidden border border-slate-200/80 bg-white/95 backdrop-blur-md shadow-[0_28px_90px_-40px_rgba(15,23,42,0.55)] sm:rounded-3xl rounded-2xl p-0 fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]",
          "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        )}
        onPointerDownOutside={(e) => {
          // Prevent Dialog from handling outside clicks when ProfileModal is open
          if (isProfileModalOpen) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          // Prevent Dialog from handling outside interactions when ProfileModal is open
          if (isProfileModalOpen) {
            e.preventDefault();
          }
        }}
      >
        {/* Header */}
        <DialogHeader className={cn(
          "flex-shrink-0 border-b border-slate-200/70",
          isMobile ? "px-4 py-3" : "px-6 py-4"
        )}>
          <div className="flex items-center justify-between">
            <DialogTitle className={cn(
              "font-semibold tracking-tight text-slate-900",
              isMobile ? "text-lg" : "text-xl"
            )}>
              Comments
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Combined Scrollable Content Area */}
        <div className={cn(
          "flex-1 overflow-y-auto min-h-0 bg-white/70",
          isMobile ? "px-4" : "px-6"
        )}>
          {/* Original Post */}
          <div className={cn(
            "py-5 border-b border-slate-200/60 bg-white/80",
            isMobile ? "px-0" : "px-0"
          )}>
            <div className="flex items-start gap-4">
              {post.author?.id ? (
                <ClickableAvatar
                  userId={post.author.id}
                  avatarUrl={post.author.avatar_url}
                  fullName={post.author.full_name}
                  firstName={post.author.first_name}
                  lastName={post.author.last_name}
                  size="md"
                  className="w-12 h-12 sm:w-12 sm:h-12 ring-2 ring-white"
                />
              ) : (
                <div className="w-12 h-12 sm:w-12 sm:h-12 bg-navy-100/70 rounded-full flex items-center justify-center text-navy-700 text-base font-semibold shrink-0 overflow-hidden ring-2 ring-white">
                  {post.author?.first_name?.charAt(0) || 'U'}
                </div>
              )}
              
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  {post.author?.id && post.author?.full_name ? (
                    <ClickableUserName
                      userId={post.author.id}
                      fullName={post.author.full_name}
                      className="font-medium text-slate-900 text-base break-words"
                    />
                  ) : (
                    <h4 className="font-medium text-slate-900 text-base break-words">
                      {post.author?.full_name || 'Unknown User'}
                    </h4>
                  )}
                  <p className="text-sm text-slate-500">
                    {formatTimestamp(post.created_at)}
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  {post.author?.member_status && (
                    <span className="text-xs sm:text-sm text-slate-500 break-words">
                      {post.author.member_status === 'active' ? 'member' : post.author.member_status}
                    </span>
                  )}
                </div>
                
                {/* Post Content with multiple image support */}
                {post.content && (
                  <p className="text-slate-800 text-sm sm:text-base leading-relaxed break-words">{post.content}</p>
                )}
                
                {/* Replace the single image_url display (lines 175-186) with: */}
                {(() => {
                  if (imageUrls.length === 0) return null;
                  
                  // Single image - display large and make clickable
                  if (imageUrls.length === 1) {
                    return (
                      <div 
                        className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white/70 cursor-pointer hover:opacity-90 transition-opacity mt-3"
                        style={{ maxHeight: '400px' }}
                        onClick={() => handleImageClick(0)}
                      >
                        <img
                          src={imageUrls[0]}
                          alt="Post content"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    );
                  }
                  
                  // Multiple images - display in horizontal scrollable row (clickable)
                  return (
                    <div className="relative mt-3">
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                        {imageUrls.map((url, index) => (
                          <div
                            key={index}
                            className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-100 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => handleImageClick(index)}
                          >
                            <img
                              src={url}
                              alt={`Post image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                      {/* Removed image count text */}
                    </div>
                  );
                })()}

                {/* Post Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onLike(post.id)}
                    className={`${
                      post.is_liked 
                        ? 'bg-rose-50/80 text-rose-500 border border-transparent hover:bg-rose-100'
                        : 'bg-white/90 text-slate-500 border border-transparent hover:bg-rose-50 hover:text-rose-500'
                    } h-9 rounded-full px-4 shadow-sm transition`}
                  >
                    <Heart className={`h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 ${post.is_liked ? 'fill-current' : ''}`} />
                    <span className="text-xs sm:text-sm">{post.likes_count}</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 rounded-full px-4 bg-blue-50/80 text-blue-500 border border-transparent hover:bg-blue-100 shadow-sm transition"
                  >
                    <MessageCircle className={`h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2`} />
                    <span className="text-xs sm:text-sm">{post.comments_count}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          {loading ? (
            <div className="px-6 py-12 text-center bg-white/60">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 border-2 border-navy-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 text-sm sm:text-base font-medium">Loading comments...</p>
              </div>
            </div>
          ) : error ? (
            <div className="px-6 py-8 text-center bg-white/60">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mb-2">
                  <X className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-red-500 text-sm sm:text-base font-medium">Error loading comments</p>
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            </div>
          ) : comments.length === 0 ? (
            <div className="px-6 py-10 text-center bg-white/60">
              <MessageCircle className="h-14 w-14 sm:h-16 sm:w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-sm sm:text-base mb-1 font-medium">No comments yet</p>
              <p className="text-xs sm:text-sm text-slate-400">Be the first to comment!</p>
            </div>
          ) : (
            <div
              ref={commentsScrollRef}
              className={cn(
                "overflow-y-auto px-4 sm:px-6 py-4 bg-white/60",
                isMobile ? "max-h-[calc(85dvh-200px)]" : "max-h-[55vh]"
              )}
            >
              <div className="space-y-0">
                {commentTree.length === 0 ? (
                  <div className="px-6 py-10 text-center bg-white/60">
                    <MessageCircle className="h-14 w-14 sm:h-16 sm:w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-sm sm:text-base mb-1 font-medium">No comments yet</p>
                    <p className="text-xs sm:text-sm text-slate-400">Be the first to comment!</p>
                  </div>
                ) : (
                  commentTree.map((comment) => renderComment(comment, 0))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div className={cn(
          "flex-shrink-0 border-t border-slate-200/70 bg-slate-50/70 shadow-inner",
          isMobile ? "px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))]" : "px-6 py-4"
        )}>
          <div className="flex items-end gap-4">
            <div className="w-10 h-10 sm:w-10 sm:h-10 bg-navy-100/70 rounded-full flex items-center justify-center text-navy-700 text-sm font-semibold shrink-0 overflow-hidden ring-2 ring-white">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name || 'User'}
                  width={40}
                  height={40}
                  className="h-full w-full rounded-full object-cover"
                  sizes="40px"
                />
              ) : (
                profile?.first_name?.charAt(0) || 'U'
              )}
            </div>
            
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={handleKeyPress}
                className="min-h-[48px] sm:min-h-[52px] max-h-[140px] resize-none rounded-2xl border border-transparent bg-white/80 px-4 py-3 text-sm sm:text-base text-slate-800 placeholder:text-slate-400 focus:border-navy-300 focus:bg-white focus:ring-2 focus:ring-navy-200 transition"
                rows={1}
              />
            </div>
            
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              className="h-12 w-12 sm:h-12 sm:w-12 rounded-full bg-navy-600/90 text-white shadow-[0_18px_45px_-24px_rgba(30,64,175,0.9)] transition-all duration-200 hover:bg-navy-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
      
      {/* Image Viewer Modal */}
      <ImageViewerModal />
    </Dialog>
  );
}
