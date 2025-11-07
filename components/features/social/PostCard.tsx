'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share, Trash2, Lock } from 'lucide-react';
import { Post } from '@/types/posts';
import { formatDistanceToNow } from 'date-fns';
import { CommentModal } from './CommentModal';
import { DeletePostModal } from './DeletePostModal';

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

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'text': return 'bg-blue-100 text-blue-800';
      case 'image': return 'bg-green-100 text-green-800';
      case 'text_image': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'recently';
    }
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

  return (
    <>
      {/* Mobile Layout - Card-less Feed */}
      <div className="sm:hidden">
        <div className="px-4 py-4 border-b border-gray-100 last:border-b-0">
          {/* Post Header */}
          <div className="flex items-start space-x-3 mb-3">
            <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-sm font-semibold shrink-0">
              {post.author?.avatar_url ? (
                <img 
                  src={post.author.avatar_url} 
                  alt={post.author.full_name || 'User'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                post.author?.first_name?.charAt(0) || 'U'
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-gray-900 text-sm break-words">
                  {post.author?.full_name || 'Unknown User'}
                </h4>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {post.post_type.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                {post.author?.chapter_role && (
                  <span className="text-xs text-gray-600 break-words">
                    {post.author.chapter_role}
                  </span>
                )}
                {post.author?.member_status && (
                  <span className="text-xs text-gray-600 break-words">
                    {post.author.member_status}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {formatTimestamp(post.created_at)}
              </p>
            </div>
            
            <div className="flex items-center space-x-1">
              {post.is_author && onDelete && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleDeleteClick}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                  title="Delete post"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Post Content */}
          <div className="mb-3">
            {post.content && (
              <p className="text-gray-900 text-sm leading-relaxed mb-3 break-words">{post.content}</p>
            )}
            {post.image_url && (
              <div className="-mx-4">
                <img 
                  src={post.image_url} 
                  alt="Post content" 
                  className="w-full max-h-80 object-cover"
                />
              </div>
            )}
          </div>

          {/* Post Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onLike(post.id)}
                className={`${
                  post.is_liked 
                    ? 'text-red-500 hover:text-red-700 hover:bg-red-50' 
                    : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                } h-8 px-2`}
              >
                <Heart className={`h-4 w-4 mr-1 ${post.is_liked ? 'fill-current' : ''}`} />
                <span className="text-xs">{post.likes_count}</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsCommentModalOpen(true)}
                className="text-gray-500 hover:text-blue-500 hover:bg-blue-50 h-8 px-2"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                <span className="text-xs">{post.comments_count}</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                disabled
                className="text-gray-400 hover:text-gray-400 cursor-not-allowed h-8 px-2"
                title="Share functionality coming soon"
              >
                <Share className="h-4 w-4 mr-1" />
                <span className="text-xs">{post.shares_count}</span>
                <Lock className="h-3 w-3 ml-1 text-gray-400" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Preserved Card Design */}
      <Card className="bg-white hidden sm:block">
        <CardContent className="p-4 sm:p-6">
          {/* Post Header */}
          <div className="flex items-start space-x-3 sm:space-x-4 mb-4 sm:mb-3">
            <div className="w-12 h-12 sm:w-10 sm:h-10 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-sm font-semibold shrink-0">
              {post.author?.avatar_url ? (
                <img 
                  src={post.author.avatar_url} 
                  alt={post.author.full_name || 'User'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                post.author?.first_name?.charAt(0) || 'U'
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h4 className="font-medium text-gray-900 text-base sm:text-sm break-words">
                  {post.author?.full_name || 'Unknown User'}
                </h4>
                <Badge className={`${getPostTypeColor(post.post_type)} text-xs`}>
                  {post.post_type.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {post.author?.chapter_role && (
                  <span className="text-xs text-gray-600 break-words">
                    {post.author.chapter_role}
                  </span>
                )}
                {post.author?.member_status && (
                  <span className="text-xs text-gray-600 break-words">
                    {post.author.member_status}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {formatTimestamp(post.created_at)}
              </p>
            </div>
            
            <div className="flex items-center space-x-1">
              {post.is_author && onDelete && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleDeleteClick}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 sm:p-1"
                  title="Delete post"
                >
                  <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Post Content */}
          <div className="mb-4 sm:mb-4">
            {post.content && (
              <p className="text-gray-900 text-base sm:text-sm leading-relaxed mb-3 break-words">{post.content}</p>
            )}
            {post.image_url && (
              <img 
                src={post.image_url} 
                alt="Post content" 
                className="w-full max-h-96 object-cover rounded-lg"
              />
            )}
          </div>

          {/* Post Actions */}
          <div className="flex items-center justify-between pt-4 sm:pt-3 border-t border-gray-100">
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
                onClick={() => setIsCommentModalOpen(true)}
                className="text-gray-500 hover:text-blue-500 hover:bg-blue-50 h-10 sm:h-8 px-3 sm:px-2"
              >
                <MessageCircle className="h-5 w-5 sm:h-4 sm:w-4 mr-2 sm:mr-1" />
                <span className="text-sm sm:text-xs">{post.comments_count}</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                disabled
                className="text-gray-400 hover:text-gray-400 cursor-not-allowed h-10 sm:h-8 px-3 sm:px-2"
                title="Share functionality coming soon"
              >
                <Share className="h-5 w-5 sm:h-4 sm:w-4 mr-2 sm:mr-1" />
                <span className="text-sm sm:text-xs">{post.shares_count}</span>
                <Lock className="h-4 w-4 sm:h-3 sm:w-3 ml-1 text-gray-400" />
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
