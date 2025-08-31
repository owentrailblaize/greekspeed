'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Image, Smile, Clock, Lock } from 'lucide-react';
import { CreatePostRequest } from '@/types/posts';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (postData: CreatePostRequest) => Promise<void>;
  userAvatar?: string;
  userName?: string;
}

export function CreatePostModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  userAvatar, 
  userName 
}: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [postType, setPostType] = useState<'text' | 'image' | 'text_image'>('text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // For now, we'll use a placeholder. In a real implementation,
      // you'd upload to Supabase Storage or another service
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target?.result as string);
        setPostType(content ? 'text_image' : 'image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageUrl) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        content: content.trim(),
        post_type: postType,
        image_url: imageUrl || undefined,
        metadata: {}
      });
      
      // Reset form
      setContent('');
      setImageUrl('');
      setPostType('text');
      onClose();
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = (content.trim() || imageUrl) && !isSubmitting;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Create a post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-sm font-semibold shrink-0">
              {userAvatar || userName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{userName || 'You'}</p>
              <Badge variant="outline" className="text-xs">
                Post to Chapter
              </Badge>
            </div>
          </div>

          {/* Content Input */}
          <div className="space-y-3">
            <Textarea
              placeholder="What do you want to talk about?"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setPostType(e.target.value && imageUrl ? 'text_image' : e.target.value ? 'text' : 'image');
              }}
              className="min-h-[120px] resize-none border-0 focus:ring-0 text-lg"
            />

            {/* Image Preview */}
            {imageUrl && (
              <div className="relative">
                <img 
                  src={imageUrl} 
                  alt="Post image" 
                  className="max-w-full max-h-64 object-cover rounded-lg"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setImageUrl('');
                    setPostType(content ? 'text' : 'text');
                  }}
                  className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-gray-500 hover:text-gray-700"
              >
                <Image className="h-4 w-4 mr-1" />
                Photo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled
                className="text-gray-400 hover:text-gray-400 cursor-not-allowed"
                title="Emoji functionality coming soon"
              >
                <Smile className="h-4 w-4 mr-1" />
                Emoji
                <Lock className="h-3 w-3 ml-1 text-gray-400" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled
                className="text-gray-400 hover:text-gray-400 cursor-not-allowed"
                title="Schedule functionality coming soon"
              >
                <Clock className="h-4 w-4 mr-1" />
                Schedule
                <Lock className="h-3 w-3 ml-1 text-gray-400" />
              </Button>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="bg-navy-600 hover:bg-navy-700 text-white"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </Button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
