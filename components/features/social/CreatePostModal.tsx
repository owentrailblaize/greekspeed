'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Image, Smile, Clock, Lock } from 'lucide-react';
import { CreatePostRequest } from '@/types/posts';
import ImageWithFallback from "@/components/figma/ImageWithFallback";
import { logger } from "@/lib/utils/logger";

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
      logger.error('Failed to create post:', { context: [error] });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = (content.trim() || imageUrl) && !isSubmitting;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-w-[85vw] max-h-[90vh] sm:max-h-[80vh] overflow-y-auto p-4  sm:p-6 bg-white">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-lg">
            Create a post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 sm:space-y-4">
          {/* User Info */}
          <div className="flex items-start space-x-4 sm:space-x-3">
            <div className="w-12 h-12 sm:w-10 sm:h-10 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-base sm:text-sm font-semibold shrink-0 overflow-hidden">
              {userAvatar ? (
                <ImageWithFallback 
                  src={userAvatar} 
                  alt={userName || 'User'} 
                  width={48} 
                  height={48} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                userName?.charAt(0) || 'U'
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-base sm:text-sm">{userName || 'You'}</p>
              <Badge variant="outline" className="text-sm sm:text-xs mt-1">
                Post to Chapter
              </Badge>
            </div>
          </div>

          {/* Content Input */}
          <div className="space-y-4 sm:space-y-3">
            <Textarea
              placeholder="What do you want to talk about?"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setPostType(e.target.value && imageUrl ? 'text_image' : e.target.value ? 'text' : 'image');
              }}
              className="min-h-[140px] sm:min-h-[120px] resize-none border-0 focus:ring-0 text-base sm:text-lg p-4 sm:p-3"
            />

            {/* Image Preview */}
            {imageUrl && (
              <div className="relative">
                <img 
                  src={imageUrl} 
                  alt="Post image" 
                  className="max-w-full max-h-80 sm:max-h-64 object-cover rounded-lg"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setImageUrl('');
                    setPostType(content ? 'text' : 'text');
                  }}
                  className="absolute top-3 right-3 sm:top-2 sm:right-2 bg-black/50 text-white hover:bg-black/70 h-10 w-10 sm:h-8 sm:w-8 p-0"
                >
                  <X className="h-5 w-5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 pt-4 sm:pt-3 border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-3 sm:gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-gray-500 hover:text-gray-700 h-12 sm:h-8 px-4 sm:px-2"
              >
                <Image className="h-5 w-5 sm:h-4 sm:w-4 mr-2 sm:mr-1" />
                <span className="hidden sm:inline text-base sm:text-sm">Photo</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled
                className="text-gray-400 hover:text-gray-400 cursor-not-allowed h-12 sm:h-8 px-4 sm:px-2"
                title="Emoji functionality coming soon"
              >
                <Smile className="h-5 w-5 sm:h-4 sm:w-4 mr-2 sm:mr-1" />
                <span className="hidden sm:inline text-base sm:text-sm">Emoji</span>
                <Lock className="h-4 w-4 sm:h-3 sm:w-3 ml-1 text-gray-400" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled
                className="text-gray-400 hover:text-gray-400 cursor-not-allowed h-12 sm:h-8 px-4 sm:px-2"
                title="Schedule functionality coming soon"
              >
                <Clock className="h-5 w-5 sm:h-4 sm:w-4 mr-2 sm:mr-1" />
                <span className="hidden sm:inline text-base sm:text-sm">Schedule</span>
                <Lock className="h-4 w-4 sm:h-3 sm:w-3 ml-1 text-gray-400" />
              </Button>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="bg-navy-600 hover:bg-navy-700 text-white h-12 sm:h-8 px-6 sm:px-4 w-full sm:w-auto"
            >
              <span className="text-base sm:text-sm">{isSubmitting ? 'Posting...' : 'Post'}</span>
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
