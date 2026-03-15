'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer } from 'vaul';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Image } from 'lucide-react';
import { CreatePostRequest } from '@/types/posts';
import ImageWithFallback from "@/components/figma/ImageWithFallback";
import { PostImageService } from '@/lib/services/postImageService';
import { useAuth } from '@/lib/supabase/auth-context';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (postData: CreatePostRequest) => Promise<void>;
  userAvatar?: string;
  userName?: string;
}

// Maximum number of images allowed per post
const MAX_IMAGES = 10;

export function CreatePostModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  userAvatar, 
  userName 
}: CreatePostModalProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [postType, setPostType] = useState<'text' | 'image' | 'text_image'>('text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Revoke all preview object URLs to free memory
      setPreviewUrls((current) => {
        current.forEach((url) => URL.revokeObjectURL(url));
        return [];
      });
      setContent('');
      setImageFiles([]);
      setPostType('text');
      setUploadError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  const sanitizeContent = (value: string) =>
    value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const determinePostType = (nextContent: string, nextImageCount: number) => {
    const trimmedContent = nextContent.trim();
    if (trimmedContent && nextImageCount > 0) return 'text_image';
    if (nextImageCount > 0) return 'image';
    if (trimmedContent) return 'text';
    return 'text';
  };

  const sanitizedContent = sanitizeContent(content);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setUploadError(null);

    // Check if adding these files would exceed the limit
    const fileArray = Array.from(files);
    const remainingSlots = MAX_IMAGES - imageFiles.length;
    
    if (fileArray.length > remainingSlots) {
      setUploadError(`You can only add up to ${MAX_IMAGES} images. You have ${imageFiles.length} image(s) and tried to add ${fileArray.length}. Please select ${remainingSlots} or fewer.`);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    const maxFileSize = 10 * 1024 * 1024; // 10MB per file

    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        setUploadError(`${file.name} is not a valid image file.`);
        continue;
      }
      if (file.size > maxFileSize) {
        setUploadError(`${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Store File objects and create lightweight object URLs for previews
    const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
    setImageFiles((prev) => [...prev, ...validFiles]);
    setPreviewUrls((prev) => {
      const updated = [...prev, ...newPreviews];
      setPostType(determinePostType(sanitizedContent, updated.length));
      return updated;
    });

    // Reset file input to allow re-uploading the same files
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(previewUrls[indexToRemove]);
    
    const newFiles = imageFiles.filter((_, i) => i !== indexToRemove);
    const newPreviews = previewUrls.filter((_, i) => i !== indexToRemove);
    setImageFiles(newFiles);
    setPreviewUrls(newPreviews);
    setPostType(determinePostType(sanitizedContent, newPreviews.length));
    setUploadError(null);
    
    // Reset file input to ensure clean state
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? content.length;
    const end = textarea.selectionEnd ?? content.length;
    const nextContent = sanitizeContent(
      content.slice(0, start) + emoji + content.slice(end)
    );

    setContent(nextContent);
    setPostType(determinePostType(nextContent, previewUrls.length));

    requestAnimationFrame(() => {
      textarea.focus();
      const cursorPosition = start + emoji.length;
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });
  };

  const handleSubmit = async () => {
    const sanitized = sanitizeContent(content);
    if (!sanitized.trim() && imageFiles.length === 0) return;
    if (!user) {
      setUploadError('You must be logged in to create a post.');
      return;
    }

    setIsSubmitting(true);
    setUploadError(null);
    
    try {
      // 1. Upload images to Supabase Storage first
      let uploadedUrls: string[] = [];
      if (imageFiles.length > 0) {
        try {
          uploadedUrls = await PostImageService.uploadImages(imageFiles, user.id);
        } catch (uploadErr: any) {
          setUploadError(uploadErr.message || 'Failed to upload images. Please try again.');
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Create post with public URLs (lightweight JSON)
      await onSubmit({
        content: sanitized,
        post_type: determinePostType(sanitized, uploadedUrls.length),
        image_url: uploadedUrls[0] || undefined, // First image for backward compatibility
        metadata: {
          image_urls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
          image_count: uploadedUrls.length
        }
      });
      
      // State will be reset by useEffect when modal closes
      onClose();
    } catch (error) {
      console.error('Failed to create post:', error);
      setUploadError('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = (sanitizedContent.trim() || imageFiles.length > 0) && !isSubmitting;

  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Shared content: header (title + user), scrollable body (input + images), footer (Photo + Post)
  const headerContent = (
    <>
      <div className="shrink-0 p-6 sm:p-8 pb-4 sm:pb-4 border-b border-slate-200/50">
        <div className="flex flex-row items-start justify-between pb-2">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Create a post
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Share an update with your chapter
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 sm:gap-3 mt-4">
          <div className="w-12 h-12 sm:w-11 sm:h-11 bg-primary-100/70 rounded-full flex items-center justify-center text-brand-primary-hover text-base sm:text-sm font-semibold shrink-0 overflow-hidden ring-2 ring-white">
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
      </div>
    </>
  );

  const bodyContent = (
    <div className="flex-1 overflow-y-auto min-h-0 px-6 sm:px-8 py-4 sm:py-6">
      <div className="space-y-4 sm:space-y-3">
        <Textarea
          ref={textareaRef}
          placeholder="What do you want to talk about?"
          value={content}
          onChange={(e) => {
            const nextValue = sanitizeContent(e.target.value);
            setContent(nextValue);
            setPostType(determinePostType(nextValue, previewUrls.length));
          }}
          className="min-h-[120px] sm:min-h-[100px] resize-none rounded-2xl border border-transparent bg-slate-50/80 p-5 text-base sm:text-lg text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 transition"
        />

        {uploadError && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 shrink-0">
            {uploadError}
          </div>
        )}

        {previewUrls.length > 0 && (
          <div className="relative shrink-0">
            <div
              className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"
              style={{
                maxHeight: '140px',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {previewUrls.map((url, index) => (
                <div
                  key={index}
                  className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-100"
                >
                  <img
                    src={url}
                    alt={`Post image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="ghost"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-black/70 hover:bg-black/90 p-0 flex items-center justify-center transition-all z-10"
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5 text-white stroke-[2.5]" />
                  </Button>
                </div>
              ))}
            </div>
            {previewUrls.length < MAX_IMAGES && (
              <p className="text-xs text-slate-500 mt-2">
                {previewUrls.length} of {MAX_IMAGES} images ({MAX_IMAGES - previewUrls.length} remaining)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const footerContent = (
    <>
      <div className="shrink-0 border-t border-slate-200/70 bg-slate-50/70 p-4 sm:p-3 shadow-inner">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageFiles.length >= MAX_IMAGES || isSubmitting}
              className="h-11 sm:h-9 rounded-full border border-slate-200 bg-white/90 px-5 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Image className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
              <span className="text-sm font-medium">Photo</span>
            </Button>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full sm:w-auto h-12 sm:h-10 rounded-full bg-brand-primary px-8 text-sm font-semibold tracking-wide text-white shadow-[0_18px_45px_-24px_rgba(30,64,175,0.9)] transition-all duration-200 hover:bg-brand-primary-hover hover:-translate-y-0.5 hover:shadow-[0_22px_55px_-28px_rgba(30,64,175,0.85)] disabled:translate-y-0 disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Posting…' : 'Post'}
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        className="hidden"
      />
    </>
  );

  // Mobile: vault bottom drawer (header + body + footer with Post in footer)
  if (mounted && isMobile) {
    return (
      <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()} direction="bottom" modal dismissible>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[9999] bg-black/40 transition-opacity" />
          <Drawer.Content
            className="bg-white flex flex-col z-[10000] fixed bottom-0 left-0 right-0 max-h-[85dvh] rounded-t-[20px] shadow-2xl border border-gray-200 outline-none"
          >
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300 mt-3 mb-2" aria-hidden />
            {headerContent}
            {bodyContent}
            <div className="pb-[env(safe-area-inset-bottom)]">{footerContent}</div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // Desktop: centered dialog (unchanged)
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[600px] max-w-[85vw] max-h-[90vh] sm:max-h-[80vh] overflow-hidden border border-slate-200/80 bg-white/95 backdrop-blur-sm shadow-[0_28px_90px_-40px_rgba(15,23,42,0.55)] sm:rounded-3xl rounded-2xl p-0 flex flex-col"
      >
        <div className="shrink-0 p-6 sm:p-8 pb-4 sm:pb-4 border-b border-slate-200/50">
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

          <div className="flex items-start gap-4 sm:gap-3 mt-4">
            <div className="w-12 h-12 sm:w-11 sm:h-11 bg-primary-100/70 rounded-full flex items-center justify-center text-brand-primary-hover text-base sm:text-sm font-semibold shrink-0 overflow-hidden ring-2 ring-white">
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
        </div>

        {bodyContent}

        {footerContent}
      </DialogContent>
    </Dialog>
  );
}
