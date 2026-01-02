'use client';

import { useProfileModal } from '@/lib/contexts/ProfileModalContext';
import { useAuth } from '@/lib/supabase/auth-context';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ClickableAvatarProps {
  userId: string;
  avatarUrl?: string | null;
  fullName?: string;
  firstName?: string | null;
  lastName?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

export function ClickableAvatar({
  userId,
  avatarUrl,
  fullName,
  firstName,
  lastName,
  size = 'md',
  className,
  onClick,
}: ClickableAvatarProps) {
  const { openUserProfile } = useProfileModal();
  const { user } = useAuth();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    // If custom onClick is provided, call it first
    if (onClick) {
      onClick(e);
      if (e.defaultPrevented) return;
    }

    // If clicking own avatar, navigate to profile page
    if (user?.id === userId) {
      router.push('/dashboard/profile');
      return;
    }

    // Otherwise, open profile modal
    e.preventDefault();
    e.stopPropagation();
    openUserProfile(userId);
  };

  const getInitials = () => {
    if (fullName) {
      return fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return 'U';
  };

  const sizePixels = size === 'sm' ? 32 : size === 'md' ? 40 : 48;

  return (
    <div
      onClick={handleClick}
      className={cn(
        'rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-semibold shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity',
        sizeClasses[size],
        className
      )}
    >
      {avatarUrl ? (
        <div className="relative w-full h-full">
          <Image
            src={avatarUrl}
            alt={fullName || 'User'}
            fill
            className="object-cover rounded-full"
            sizes={`${sizePixels}px`}
          />
        </div>
      ) : (
        <span>{getInitials()}</span>
      )}
    </div>
  );
}

