'use client';

import { useState, useRef, useEffect } from 'react';
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

// Maximum number of images allowed per post
const MAX_IMAGES = 10;

export function CreatePostModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  userAvatar, 
  userName 
}: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [postType, setPostType] = useState<'text' | 'image' | 'text_image'>('text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setContent('');
      setImageUrls([]);
      setPostType('text');
      setUploadError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  const sanitizeContent = (value: string) =>
    value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const determinePostType = (nextContent: string, nextImageUrls: string[]) => {
    const trimmedContent = nextContent.trim();
    if (trimmedContent && nextImageUrls.length > 0) return 'text_image';
    if (nextImageUrls.length > 0) return 'image';
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
    const remainingSlots = MAX_IMAGES - imageUrls.length;
    
    if (fileArray.length > remainingSlots) {
      setUploadError(`You can only add up to ${MAX_IMAGES} images. You have ${imageUrls.length} image(s) and tried to add ${fileArray.length}. Please select ${remainingSlots} or fewer.`);
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

    // Process valid files
    const newImageUrls: string[] = [];
    let loadedCount = 0;

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onerror = () => {
        setUploadError(`Failed to load ${file.name}. Please try again.`);
        loadedCount++;
        if (loadedCount === validFiles.length) {
          // Reset file input after all files are processed
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          newImageUrls.push(result);
        }
        loadedCount++;
        
        // Update state when all files are loaded
        if (loadedCount === validFiles.length) {
          const updatedUrls = [...imageUrls, ...newImageUrls];
          setImageUrls(updatedUrls);
          setPostType(determinePostType(sanitizedContent, updatedUrls));
          
          // Reset file input to allow re-uploading the same files
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const newImageUrls = imageUrls.filter((_, index) => index !== indexToRemove);
    setImageUrls(newImageUrls);
    setPostType(determinePostType(sanitizedContent, newImageUrls));
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
    setPostType(determinePostType(nextContent, imageUrls));

    requestAnimationFrame(() => {
      textarea.focus();
      const cursorPosition = start + emoji.length;
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });
  };

  const handleSubmit = async () => {
    const sanitized = sanitizeContent(content);
    if (!sanitized.trim() && imageUrls.length === 0) return;

    setIsSubmitting(true);
    setUploadError(null);
    
    try {
      // Store all images in metadata, first image in image_url for backward compatibility
      await onSubmit({
        content: sanitized,
        post_type: postType,
        image_url: imageUrls[0] || undefined, // First image for backward compatibility
        metadata: {
          image_urls: imageUrls.length > 0 ? imageUrls : undefined,
          image_count: imageUrls.length
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

  const canSubmit = (sanitizedContent.trim() || imageUrls.length > 0) && !isSubmitting;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[600px] max-w-[85vw] max-h-[90vh] sm:max-h-[80vh] overflow-hidden border border-slate-200/80 bg-white/95 backdrop-blur-sm shadow-[0_28px_90px_-40px_rgba(15,23,42,0.55)] sm:rounded-3xl rounded-2xl p-0 flex flex-col"
      >
        {/* Fixed Header */}
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
            <div className="w-12 h-12 sm:w-11 sm:w-11 bg-navy-100/70 rounded-full flex items-center justify-center text-navy-700 text-base sm:text-sm font-semibold shrink-0 overflow-hidden ring-2 ring-white">
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

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 sm:px-8 py-4 sm:py-6">
          <div className="space-y-4 sm:space-y-3">
            <Textarea
              ref={textareaRef}
              placeholder="What do you want to talk about?"
              value={content}
              onChange={(e) => {
                const nextValue = sanitizeContent(e.target.value);
                setContent(nextValue);
                setPostType(determinePostType(nextValue, imageUrls));
              }}
              className="min-h-[120px] sm:min-h-[100px] resize-none rounded-2xl border border-transparent bg-slate-50/80 p-5 text-base sm:text-lg text-slate-800 placeholder:text-slate-400 focus:border-navy-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-200 transition"
            />

            {/* Error message */}
            {uploadError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 shrink-0">
                {uploadError}
              </div>
            )}

            {/* Multiple images in horizontal scrollable row - Fixed height container */}
            {imageUrls.length > 0 && (
              <div className="relative shrink-0">
                {/* Constrained height container for horizontal scrolling */}
                <div 
                  className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"
                  style={{ 
                    maxHeight: '140px',
                    WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
                  }}
                >
                  {imageUrls.map((url, index) => (
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
                {imageUrls.length < MAX_IMAGES && (
                  <p className="text-xs text-slate-500 mt-2">
                    {imageUrls.length} of {MAX_IMAGES} images ({MAX_IMAGES - imageUrls.length} remaining)
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer with Form Controls */}
        <div className="shrink-0 border-t border-slate-200/70 bg-slate-50/70 p-4 sm:p-3 shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={imageUrls.length >= MAX_IMAGES || isSubmitting}
                className="h-11 sm:h-9 rounded-full border border-slate-200 bg-white/90 px-5 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
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
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
}
