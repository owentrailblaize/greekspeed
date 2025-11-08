'use client';

import { useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Heart, MessageCircle, Share, Trash2, Send, RefreshCcw } from 'lucide-react';
import { Post, CreateCommentRequest } from '@/types/posts';
import { useComments } from '@/lib/hooks/useComments';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { useVirtualizer } from '@tanstack/react-virtual';

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
  const {
    comments,
    loading,
    error,
    createComment,
    deleteComment,
    likeComment,
    refresh,
    lastFetchedAt,
    loadedFromCache,
  } = useComments(post.id, {
    enabled: isOpen,
    initialComments: post.comments_preview,
    initialTotal: post.comments_count,
  });
  const { profile } = useProfile();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commentsScrollRef = useRef<HTMLDivElement | null>(null);
  const commentItems = useMemo(() => comments, [comments]);
  const commentsVirtualizer = useVirtualizer({
    count: commentItems.length,
    getScrollElement: () => commentsScrollRef.current,
    estimateSize: () => 120,
    overscan: 6,
  });
  const lastUpdatedLabel =
    typeof lastFetchedAt === 'number' ? formatRelativeMoment(lastFetchedAt) : null;

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[720px] max-w-[95vw] h-[100dvh] sm:h-[85vh] flex flex-col overflow-hidden border border-slate-200/80 bg-white/95 backdrop-blur-md shadow-[0_28px_90px_-40px_rgba(15,23,42,0.55)] sm:rounded-3xl rounded-2xl p-0">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 border-b border-slate-200/70 px-6 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold tracking-tight text-slate-900">
              Comments
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Combined Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-white/70">
          {/* Original Post */}
          <div className="px-6 py-5 border-b border-slate-200/60 bg-white/80">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 sm:w-12 sm:h-12 bg-navy-100/70 rounded-full flex items-center justify-center text-navy-700 text-base font-semibold shrink-0 overflow-hidden ring-2 ring-white">
                {post.author?.avatar_url ? (
                  <Image
                    src={post.author.avatar_url}
                    alt={post.author.full_name || 'User'}
                    width={48}
                    height={48}
                    className="h-full w-full rounded-full object-cover"
                    sizes="48px"
                  />
                ) : (
                  post.author?.first_name?.charAt(0) || 'U'
                )}
              </div>
              
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h4 className="font-medium text-slate-900 text-base break-words">
                    {post.author?.full_name || 'Unknown User'}
                  </h4>
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
                
                {/* Post Content with better image handling */}
                {post.content && (
                  <p className="text-slate-800 text-sm sm:text-base leading-relaxed break-words">{post.content}</p>
                )}
                {post.image_url && (
                  <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white/70">
                    <Image
                      src={post.image_url}
                      alt="Post content"
                      width={1200}
                      height={1200}
                      className="h-full w-full object-contain"
                      sizes="(max-width: 768px) 100vw, 700px"
                    />
                  </div>
                )}

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
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 rounded-full px-4 bg-white/90 text-slate-500 border border-transparent hover:bg-emerald-50 hover:text-emerald-500 shadow-sm transition"
                  >
                    <Share className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">{post.shares_count}</span>
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
              className="relative max-h-[55vh] overflow-y-auto px-6 py-5 bg-white/60"
            >
              <div
                className="relative w-full"
                style={{ height: `${commentsVirtualizer.getTotalSize()}px` }}
              >
                {commentsVirtualizer.getVirtualItems().map((virtualRow) => {
                  const comment = commentItems[virtualRow.index];
                  if (!comment) return null;
                  const isLast = virtualRow.index === commentItems.length - 1;

                  return (
                    <div
                      key={comment.id}
                      data-index={virtualRow.index}
                      className="absolute left-0 right-0 pt-0"
                      style={{
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      ref={(el) => {
                        if (el) {
                          commentsVirtualizer.measureElement(el);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-10 sm:h-10 bg-navy-100/70 rounded-full flex items-center justify-center text-navy-700 text-sm font-semibold shrink-0 overflow-hidden ring-2 ring-white">
                          {comment.author?.avatar_url ? (
                            <Image
                              src={comment.author.avatar_url}
                              alt={comment.author.full_name || 'User'}
                              width={40}
                              height={40}
                              className="h-full w-full rounded-full object-cover"
                              sizes="40px"
                            />
                          ) : (
                            comment.author?.first_name?.charAt(0) || 'U'
                          )}
                        </div>

                        <div className={`flex-1 min-w-0 rounded-2xl border border-slate-200/60 bg-white/80 px-4 py-3 shadow-sm ${isLast ? '' : 'mb-4'}`}>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h5 className="font-medium text-slate-900 text-sm sm:text-base break-words">
                              {comment.author?.full_name || 'Unknown User'}
                            </h5>
                            <p className="text-xs sm:text-sm text-slate-500">
                              {formatTimestamp(comment.created_at)}
                            </p>
                          </div>

                          <p className="text-slate-800 text-sm sm:text-base leading-relaxed mb-3 break-words">
                            {comment.content}
                          </p>

                          {/* Comment Actions */}
                          <div className="flex flex-wrap items-center gap-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLikeComment(comment.id)}
                              className={`${
                                comment.is_liked
                                  ? 'bg-rose-50/80 text-rose-500 border border-transparent hover:bg-rose-100'
                                  : 'bg-white/90 text-slate-500 border border-transparent hover:bg-rose-50 hover:text-rose-500'
                              } text-xs sm:text-sm h-8 rounded-full px-4 shadow-sm transition`}
                            >
                              <Heart
                                className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${
                                  comment.is_liked ? 'fill-current' : ''
                                }`}
                              />
                              {comment.likes_count || 0}
                            </Button>
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
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div className="flex-shrink-0 border-t border-slate-200/70 bg-slate-50/70 px-6 py-4 shadow-inner">
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
    </Dialog>
  );
}
