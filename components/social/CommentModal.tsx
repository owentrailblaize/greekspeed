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
      <DialogContent className="sm:max-w-[600px] max-w-[95vw] h-[90vh] sm:h-[80vh] max-h-[700px] flex flex-col overflow-hidden p-0 sm:p-6">
        {/* Fixed Header */}
        <DialogHeader className="flex-shrink-0 border-b border-gray-200 p-4 sm:p-6">
          <DialogTitle className="text-xl sm:text-lg">
            Comments
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Original Post - Fixed at top */}
          <div className="flex-shrink-0 border-b border-gray-200 p-4 sm:p-6">
            <div className="flex items-start space-x-4 sm:space-x-3">
              <div className="w-12 h-12 sm:w-10 sm:h-10 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-base sm:text-sm font-semibold shrink-0">
                {post.author?.avatar_url || post.author?.first_name?.charAt(0) || 'U'}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-1">
                  <h4 className="font-medium text-gray-900 text-base sm:text-sm break-words">
                    {post.author?.full_name || 'Unknown User'}
                  </h4>
                  <Badge className={`${getPostTypeColor(post.post_type)} text-xs`}>
                    {post.post_type.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {post.author?.chapter_role && (
                    <span className="text-sm sm:text-xs text-gray-600 break-words">
                      {post.author.chapter_role}
                    </span>
                  )}
                  {post.author?.member_status && (
                    <span className="text-sm sm:text-xs text-gray-600 break-words">
                      {post.author.member_status}
                    </span>
                  )}
                </div>
                <p className="text-sm sm:text-xs text-gray-500 mb-3 sm:mb-2">
                  {formatTimestamp(post.created_at)}
                </p>
                
                {/* Post Content */}
                {post.content && (
                  <p className="text-gray-900 text-base sm:text-sm leading-relaxed mb-4 sm:mb-3 break-words">{post.content}</p>
                )}
                {post.image_url && (
                  <img 
                    src={post.image_url} 
                    alt="Post content" 
                    className="w-full max-h-80 sm:max-h-64 object-cover rounded-lg mb-4 sm:mb-3"
                  />
                )}

                {/* Post Actions */}
                <div className="flex items-center space-x-4 sm:space-x-6">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onLike(post.id)}
                    className={`${
                      post.is_liked 
                        ? 'text-red-500 hover:text-red-700 hover:bg-red-50' 
                        : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                    } h-10 sm:h-8 px-3 sm:px-2`}
                  >
                    <Heart className={`h-5 w-5 sm:h-4 sm:w-4 mr-2 sm:mr-1 ${post.is_liked ? 'fill-current' : ''}`} />
                    <span className="text-sm sm:text-xs">{post.likes_count}</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-10 sm:h-8 px-3 sm:px-2"
                  >
                    <MessageCircle className="h-5 w-5 sm:h-4 sm:w-4 mr-2 sm:mr-1" />
                    <span className="text-sm sm:text-xs">{post.comments_count}</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-500 hover:text-green-500 hover:bg-green-50 h-10 sm:h-8 px-3 sm:px-2"
                  >
                    <Share className="h-5 w-5 sm:h-4 sm:w-4 mr-2 sm:mr-1" />
                    <span className="text-sm sm:text-xs">{post.shares_count}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section - Scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <div className="p-4 sm:p-6 text-center">
                <p className="text-gray-500 text-base sm:text-sm">Loading comments...</p>
              </div>
            ) : error ? (
              <div className="p-4 sm:p-6 text-center">
                <p className="text-red-500 text-base sm:text-sm">Error loading comments: {error}</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="p-8 sm:p-6 text-center">
                <MessageCircle className="h-16 w-16 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-base sm:text-sm">No comments yet</p>
                <p className="text-sm sm:text-xs text-gray-400">Be the first to comment!</p>
              </div>
            ) : (
              <div className="p-4 sm:p-6 space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id}>
                    <div className="flex items-start space-x-4 sm:space-x-3">
                      <div className="w-10 h-10 sm:w-8 sm:h-8 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-sm sm:text-xs font-semibold shrink-0">
                        {comment.author?.avatar_url || comment.author?.first_name?.charAt(0) || 'U'}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-1">
                          <h5 className="font-medium text-gray-900 text-base sm:text-sm break-words">
                            {comment.author?.full_name || 'Unknown User'}
                          </h5>
                          <p className="text-sm sm:text-xs text-gray-500">
                            {formatTimestamp(comment.created_at)}
                          </p>
                        </div>
                        
                        <p className="text-gray-900 text-base sm:text-sm leading-relaxed mb-3 sm:mb-2 break-words">
                          {comment.content}
                        </p>
                        
                        {/* Comment Actions */}
                        <div className="flex items-center space-x-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleLikeComment(comment.id)}
                            className={`${
                              comment.is_liked 
                                ? 'text-red-500 hover:text-red-700' 
                                : 'text-gray-500 hover:text-gray-700'
                            } text-sm sm:text-xs h-10 sm:h-8 px-3 sm:px-2`}
                          >
                            <Heart className={`h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1 ${comment.is_liked ? 'fill-current' : ''}`} />
                            {comment.likes_count || 0}
                          </Button>
                          {comment.author_id === profile?.id && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-red-500 hover:text-red-700 text-sm sm:text-xs h-10 sm:h-8 px-3 sm:px-2"
                            >
                              <Trash2 className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1" />
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

          {/* Comment Input - Fixed at bottom */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4 sm:p-6 bg-white">
            <div className="flex items-end space-x-4 sm:space-x-3">
              <div className="w-10 h-10 sm:w-8 sm:h-8 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-sm sm:text-xs font-semibold shrink-0">
                {profile?.avatar_url || profile?.first_name?.charAt(0) || 'U'}
              </div>
              
              <div className="flex-1">
                <Textarea
                  ref={textareaRef}
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="min-h-[50px] sm:min-h-[40px] max-h-[120px] resize-none border-gray-300 focus:ring-navy-500 focus:border-navy-500 text-base sm:text-sm p-3"
                  rows={1}
                />
              </div>
              
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                size="sm"
                className="bg-navy-600 hover:bg-navy-700 text-white h-12 sm:h-8 px-4 sm:px-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-5 w-5 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
