'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link, Check, Loader2 } from 'lucide-react';
import { copyProfileLink, ProfileLinkOptions } from '@/lib/utils/profileLinkUtils';
import { toast } from 'react-toastify';
import { cn } from '@/lib/utils';

interface CopyProfileLinkButtonProps {
  /** The user's profile slug (username or profile_slug) */
  slug: string;
  /** The user's ID (required for fallback if slug fetch fails) */
  userId: string;
  /** Button variant style */
  variant?: 'default' | 'icon' | 'text';
  /** Optional tracking parameters (ref, UTM parameters) */
  options?: ProfileLinkOptions;
  /** Callback fired when copy succeeds */
  onCopySuccess?: () => void;
  /** Callback fired when copy fails */
  onCopyError?: (error: Error) => void;
  /** Additional className for custom styling */
  className?: string;
  /** Button size */
  size?: 'default' | 'sm' | 'lg';
  /** Button variant (outline, ghost, etc.) */
  buttonVariant?: 'default' | 'outline' | 'ghost';
}

export function CopyProfileLinkButton({
  slug,
  userId,
  variant = 'default',
  options,
  onCopySuccess,
  onCopyError,
  className,
  size = 'default',
  buttonVariant = 'outline',
}: CopyProfileLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const handleCopy = async () => {
    setIsCopying(true);
    try {
      // Use default ref if not provided in options
      const copyOptions: ProfileLinkOptions = {
        ref: 'share',
        ...options,
      };

      const success = await copyProfileLink(userId, slug || null, copyOptions);

      if (success) {
        setCopied(true);
        toast.success('Profile link copied to clipboard!', {
          position: 'top-right',
          autoClose: 3000,
        });

        // Reset copied state after 2 seconds
        setTimeout(() => {
          setCopied(false);
        }, 2000);

        // Call success callback if provided
        if (onCopySuccess) {
          onCopySuccess();
        }
      } else {
        throw new Error('Failed to copy link to clipboard');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error : new Error('Failed to copy link');
      console.error('Failed to copy profile link:', errorMessage);

      toast.error('Failed to copy link. Please try again.', {
        position: 'top-right',
        autoClose: 3000,
      });

      // Call error callback if provided
      if (onCopyError) {
        onCopyError(errorMessage);
      }
    } finally {
      setIsCopying(false);
    }
  };

  // Icon variant - icon only button
  if (variant === 'icon') {
    return (
      <Button
        onClick={handleCopy}
        disabled={isCopying}
        variant={buttonVariant}
        size={size}
        className={cn(
          'p-2 rounded-full',
          copied && 'text-green-600 border-green-600',
          className
        )}
        title={copied ? 'Copied!' : 'Copy profile link'}
        aria-label={copied ? 'Link copied' : 'Copy profile link'}
      >
        {isCopying ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : copied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Link className="h-4 w-4" />
        )}
      </Button>
    );
  }

  // Text variant - text only button (no icon)
  if (variant === 'text') {
    return (
      <Button
        onClick={handleCopy}
        disabled={isCopying}
        variant={buttonVariant}
        size={size}
        className={cn(
          'rounded-full',
          copied && 'text-green-600 border-green-600',
          className
        )}
      >
        {isCopying ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Copying...</span>
          </div>
        ) : copied ? (
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Copied!</span>
          </div>
        ) : (
          'Copy Link'
        )}
      </Button>
    );
  }

  // Default variant - button with icon and text
  return (
    <Button
      onClick={handleCopy}
      disabled={isCopying}
      variant={buttonVariant}
      size={size}
      className={cn(
        'rounded-full flex items-center gap-2',
        copied && 'text-green-600 border-green-600',
        className
      )}
    >
      {isCopying ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Copying...</span>
        </>
      ) : copied ? (
        <>
          <Check className="h-4 w-4" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Link className="h-4 w-4" />
          <span>Copy Link</span>
        </>
      )}
    </Button>
  );
}

