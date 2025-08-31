'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share, MoreHorizontal, Trash2 } from 'lucide-react';
import { Post } from '@/types/posts';
import { formatDistanceToNow } from 'date-fns';
import { CommentModal } from './CommentModal';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onCommentAdded?: () => void;
}

export function PostCard({ post, onLike, onDelete, onCommentAdded }: PostCardProps) {
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

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

  return (
    <>
      <Card className="bg-white">
        <CardContent className="p-4">
          {/* Post Header */}
          <div className="flex items-start space-x-3 mb-3">
            <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-sm font-semibold shrink-0">
              {post.author?.avatar_url || post.author?.first_name?.charAt(0) || 'U'}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-medium text-gray-900 text-sm">
                  {post.author?.full_name || 'Unknown User'}
                </h4>
                <Badge className={getPostTypeColor(post.post_type)}>
                  {post.post_type.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mb-1">
                {post.author?.chapter_role && `${post.author.chapter_role} • `}
                {post.author?.member_status}
              </p>
              <p className="text-xs text-gray-500">
                {formatTimestamp(post.created_at)}
              </p>
            </div>
            
            <div className="flex items-center space-x-1">
              {post.is_author && onDelete && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onDelete(post.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Post Content */}
          <div className="mb-4">
            {post.content && (
              <p className="text-gray-900 text-sm leading-relaxed mb-3">{post.content}</p>
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
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-6">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onLike(post.id)}
                className={`${
                  post.is_liked 
                    ? 'text-red-500 hover:text-red-700 hover:bg-red-50' 
                    : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                }`}
              >
                <Heart className={`h-4 w-4 mr-1 ${post.is_liked ? 'fill-current' : ''}`} />
                {post.likes_count}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsCommentModalOpen(true)}
                className="text-gray-500 hover:text-blue-500 hover:bg-blue-50"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                {post.comments_count}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-500 hover:text-green-500 hover:bg-green-50"
              >
                <Share className="h-4 w-4 mr-1" />
                {post.shares_count}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comment Modal */}
      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        post={post}
        onLike={onLike}
        onCommentAdded={onCommentAdded}
      />
    </>
  );
}
