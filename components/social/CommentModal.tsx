'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Heart, MessageCircle, Share, Trash2, Send } from 'lucide-react';
import { Post, PostComment, CreateCommentRequest } from '@/types/posts';
import { useComments } from '@/lib/hooks/useComments';
import { useProfile } from '@/lib/hooks/useProfile';
import { formatDistanceToNow } from 'date-fns';
import ImageWithFallback from "../figma/ImageWithFallback";

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
  const { comments, loading, error, createComment, deleteComment, likeComment } = useComments(post.id);
  const { profile } = useProfile();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'text': return 'bg-blue-100 text-blue-800';
      case 'image': return 'bg-green-100 text-green-800';
      case 'text_image': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-w-[95vw] h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden p-0 m-0 rounded-none sm:rounded-lg">
        {/* Compact Header */}
        <DialogHeader className="flex-shrink-0 border-b border-gray-200 -mx-4 sm:mx-0 px-4 py-1 sm:px-6 sm:py-1">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl font-semibold">
              Comments
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Combined Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Original Post */}
          <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-gray-200 -mx-4 sm:mx-0">
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-sm sm:text-base font-semibold shrink-0 overflow-hidden">
                {post.author?.avatar_url ? (
                  <ImageWithFallback 
                    src={post.author.avatar_url} 
                    alt={post.author.full_name || 'User'} 
                    width={48} 
                    height={48} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  post.author?.first_name?.charAt(0) || 'U'
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1 sm:mb-2">
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base break-words">
                    {post.author?.full_name || 'Unknown User'}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {formatTimestamp(post.created_at)}
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {post.author?.member_status && (
                    <span className="text-xs sm:text-sm text-gray-600 break-words">
                      {post.author.member_status === 'active' ? 'member' : post.author.member_status}
                    </span>
                  )}
                </div>
                
                {/* Post Content with better image handling */}
                {post.content && (
                  <p className="text-gray-900 text-sm sm:text-base leading-relaxed mb-3 sm:mb-4 break-words">{post.content}</p>
                )}
                {post.image_url && (
                  <div className="mb-3 sm:mb-4">
                    <img 
                      src={post.image_url} 
                      alt="Post content" 
                      className="w-full max-h-[50vh] object-contain rounded-lg border border-gray-200"
                    />
                  </div>
                )}

                {/* Post Actions */}
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onLike(post.id)}
                    className={`${
                      post.is_liked 
                        ? 'text-red-500 hover:text-red-700 hover:bg-red-50' 
                        : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                    } h-8 sm:h-9 px-2 sm:px-3`}
                  >
                    <Heart className={`h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 ${post.is_liked ? 'fill-current' : ''}`} />
                    <span className="text-xs sm:text-sm">{post.likes_count}</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-8 sm:h-9 px-2 sm:px-3"
                  >
                    <MessageCircle className={`h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2`} />
                    <span className="text-xs sm:text-sm">{post.comments_count}</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-500 hover:text-green-500 hover:bg-green-50 h-8 sm:h-9 px-2 sm:px-3"
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
            <div className="px-4 py-8 sm:px-6 sm:py-12 text-center">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-navy-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 text-sm sm:text-base font-medium">Loading comments...</p>
              </div>
            </div>
          ) : error ? (
            <div className="px-4 py-6 sm:px-6 sm:py-8 text-center">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mb-2">
                  <X className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-red-500 text-sm sm:text-base">Error loading comments</p>
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            </div>
          ) : comments.length === 0 ? (
            <div className="px-4 py-6 sm:px-6 sm:py-8 text-center">
              <MessageCircle className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <p className="text-gray-500 text-sm sm:text-base mb-1">No comments yet</p>
              <p className="text-xs sm:text-sm text-gray-400">Be the first to comment!</p>
            </div>
          ) : (
            <div className="px-4 py-4 sm:px-6 sm:py-5 space-y-3 sm:space-y-4">
              {comments.map((comment) => (
                <div key={comment.id}>
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-xs sm:text-sm font-semibold shrink-0 overflow-hidden">
                      {comment.author?.avatar_url ? (
                        <ImageWithFallback 
                          src={comment.author.avatar_url} 
                          alt={comment.author.full_name || 'User'} 
                          width={40} 
                          height={40} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        comment.author?.first_name?.charAt(0) || 'U'
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1 sm:mb-2">
                        <h5 className="font-medium text-gray-900 text-sm sm:text-base break-words">
                          {comment.author?.full_name || 'Unknown User'}
                        </h5>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {formatTimestamp(comment.created_at)}
                        </p>
                      </div>
                      
                      <p className="text-gray-900 text-sm sm:text-base leading-relaxed mb-2 sm:mb-3 break-words">
                        {comment.content}
                      </p>
                      
                      {/* Comment Actions */}
                      <div className="flex items-center space-x-3">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleLikeComment(comment.id)}
                          className={`${
                            comment.is_liked 
                              ? 'text-red-500 hover:text-red-700' 
                              : 'text-gray-500 hover:text-gray-700'
                          } text-xs sm:text-sm h-7 sm:h-8 px-2`}
                        >
                          <Heart className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${comment.is_liked ? 'fill-current' : ''}`} />
                          {comment.likes_count || 0}
                        </Button>
                        {comment.author_id === profile?.id && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-500 hover:text-red-700 text-xs sm:text-sm h-7 sm:h-8 px-2"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comment Input - Mobile optimized */}
        <div className="flex-shrink-0 border-t border-gray-200 -mx-4 sm:mx-0 px-4 py-2 sm:px-6 sm:py-4 bg-white -mb-8 sm:mb-0">
          <div className="flex items-end space-x-3 sm:space-x-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-xs sm:text-sm font-semibold shrink-0 overflow-hidden">
              {profile?.avatar_url ? (
                <ImageWithFallback 
                  src={profile.avatar_url} 
                  alt={profile.full_name || 'User'} 
                  width={40} 
                  height={40} 
                  className="w-full h-full object-cover" 
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
                className="min-h-[36px] sm:min-h-[50px] max-h-[80px] sm:max-h-[120px] resize-none border-gray-300 focus:ring-navy-500 focus:border-navy-500 text-sm sm:text-base p-2 sm:p-3"
                rows={1}
              />
            </div>
            
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              size="sm"
              className="bg-navy-600 hover:bg-navy-700 text-white h-8 sm:h-12 px-2 sm:px-4"
            >
              {isSubmitting ? (
                <div className="w-3 h-3 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-3 w-3 sm:h-5 sm:w-5" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
