'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Image, Clock, Lock } from 'lucide-react';
import { CreatePostRequest } from '@/types/posts';
import ImageWithFallback from "@/components/figma/ImageWithFallback";
import { EmojiPicker } from '@/components/features/messaging/EmojiPicker';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const determinePostType = (nextContent: string, nextImageUrl: string) => {
    const trimmedContent = nextContent.trim();
    if (trimmedContent && nextImageUrl) return 'text_image';
    if (nextImageUrl) return 'image';
    if (trimmedContent) return 'text';
    return 'text';
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImageUrl(result);
        setPostType(determinePostType(content, result));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? content.length;
    const end = textarea.selectionEnd ?? content.length;
    const nextContent = content.slice(0, start) + emoji + content.slice(end);

    setContent(nextContent);
    setPostType(determinePostType(nextContent, imageUrl));

    requestAnimationFrame(() => {
      textarea.focus();
      const cursorPosition = start + emoji.length;
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });
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
      <DialogContent
        className="sm:max-w-[600px] max-w-[85vw] max-h-[90vh] sm:max-h-[80vh] overflow-hidden border border-slate-200/80 bg-white/95 backdrop-blur-sm shadow-[0_28px_90px_-40px_rgba(15,23,42,0.55)] sm:rounded-3xl rounded-2xl p-0"
      >
        <div className="p-6 sm:p-8 space-y-8 sm:space-y-6">
          <DialogHeader className="flex flex-row items-start justify-between pb-2">
            <div>
              <DialogTitle className="text-xl font-semibold tracking-tight text-slate-900">
                Create a post
              </DialogTitle>
              <p className="text-sm text-slate-400 mt-1">
                Share an update with your chapter
              </p>
            </div>
          </DialogHeader>

          <div className="flex items-start gap-4 sm:gap-3">
            <div className="w-12 h-12 sm:w-11 sm:h-11 bg-navy-100/70 rounded-full flex items-center justify-center text-navy-700 text-base sm:text-sm font-semibold shrink-0 overflow-hidden ring-2 ring-white">
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
              <p className="font-medium text-slate-900 text-base sm:text-sm">{userName || 'You'}</p>
              <Badge className="mt-2 inline-flex items-center rounded-full border border-slate-200/80 bg-slate-100/70 px-3 py-1 text-xs font-medium text-slate-600">
                Post to Chapter
              </Badge>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-3">
            <Textarea
              ref={textareaRef}
              placeholder="What do you want to talk about?"
              value={content}
              onChange={(e) => {
                const nextValue = e.target.value;
                setContent(nextValue);
                setPostType(determinePostType(nextValue, imageUrl));
              }}
              className="min-h-[160px] sm:min-h-[140px] resize-none rounded-2xl border border-transparent bg-slate-50/80 p-5 text-base sm:text-lg text-slate-800 placeholder:text-slate-400 focus:border-navy-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-200 transition"
            />

            {imageUrl && (
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <img 
                  src={imageUrl} 
                  alt="Post image" 
                  className="w-full max-h-[22rem] sm:max-h-64 object-cover"
                />
                <Button
                  variant="ghost"
                  onClick={() => {
                    setImageUrl('');
                    setPostType(determinePostType(content, ''));
                  }}
                  className="absolute top-3 right-3 sm:top-2 sm:right-2 h-9 w-9 sm:h-8 sm:w-8 rounded-full bg-slate-900/70 text-white hover:bg-slate-900/80"
                >
                  <X className="h-5 w-5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 sm:p-3 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-11 sm:h-9 rounded-full border border-slate-200 bg-white/90 px-5 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-800"
                >
                  <Image className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                  <span className="text-sm font-medium">Photo</span>
                </Button>
                <EmojiPicker
                  onEmojiSelect={handleEmojiSelect}
                  disabled={isSubmitting}
                  buttonClassName="h-11 sm:h-9 rounded-full border border-slate-200 bg-white/90 px-5 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-800"
                  iconClassName="h-5 w-5 sm:h-4 sm:w-4 mr-2"
                  label="Emoji"
                  labelClassName="text-sm font-medium text-slate-500"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full sm:w-auto h-12 sm:h-10 rounded-full bg-navy-600/90 px-8 text-sm font-semibold tracking-wide text-white shadow-[0_18px_45px_-24px_rgba(30,64,175,0.9)] transition-all duration-200 hover:bg-navy-600 hover:-translate-y-0.5 hover:shadow-[0_22px_55px_-28px_rgba(30,64,175,0.85)] disabled:translate-y-0 disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Posting…' : 'Post'}
              </Button>
            </div>
          </div>

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
