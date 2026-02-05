'use client';

import { useProfileModal } from '@/lib/contexts/ProfileModalContext';
import { useAuth } from '@/lib/supabase/auth-context';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ClickableUserNameProps {
  userId: string;
  fullName: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function ClickableUserName({
  userId,
  fullName,
  className,
  onClick,
}: ClickableUserNameProps) {
  const { openUserProfile } = useProfileModal();
  const { user } = useAuth();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    // If custom onClick is provided, call it first
    if (onClick) {
      onClick(e);
      if (e.defaultPrevented) return;
    }

    // If clicking own name, navigate to profile page
    if (user?.id === userId) {
      router.push('/dashboard/profile');
      return;
    }

    // Otherwise, open profile modal
    e.preventDefault();
    e.stopPropagation();
    openUserProfile(userId);
  };

  return (
    <span
      onClick={handleClick}
      className={cn(
        'cursor-pointer hover:underline font-medium',
        className
      )}
    >
      {fullName}
    </span>
  );
}

