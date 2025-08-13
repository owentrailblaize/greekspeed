'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';


interface UserAvatarProps {
  user: { email?: string | null; user_metadata?: { avatar_url?: string | null; full_name?: string } } | null;
  completionPercent: number;
  hasUnread: boolean;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ 
  user, 
  completionPercent, 
  hasUnread, 
  isLoading = false,
  size = 'md',
  className 
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  // Get avatar URL from user metadata or fallback to initials
  const avatarUrl = user?.user_metadata?.avatar_url || null;
  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'U';
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  const progressRingSize = {
    sm: 40,
    md: 48,
    lg: 56
  };



  // Calculate progress ring dimensions
  const radius = (progressRingSize[size] - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // For the progress arc, we want to show only the completed portion
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (completionPercent / 100) * circumference;

  // Generate initials from full name
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className={cn('relative inline-block', className)}>
      {/* Progress Ring - positioned absolutely around the avatar */}
      {completionPercent < 100 && (
        <svg
          className="absolute inset-0 w-full h-full -rotate-90"
          width={progressRingSize[size]}
          height={progressRingSize[size]}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${progressRingSize[size]}px`,
            height: `${progressRingSize[size]}px`
          }}
        >
          {/* Background circle - always full circle */}
          <circle
            cx={progressRingSize[size] / 2}
            cy={progressRingSize[size] / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            className="text-gray-100"
          />
          {/* Progress arc - only shows completed portion */}
          <circle
            cx={progressRingSize[size] / 2}
            cy={progressRingSize[size] / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            className="text-navy-500 transition-all duration-300 ease-in-out"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* Avatar Container - clean, no ring */}
      <div className={cn(
        'relative rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium overflow-hidden border border-gray-200',
        sizeClasses[size]
      )}>
        {/* Avatar Image */}
        {avatarUrl && !imageError ? (
          <img
            src={avatarUrl}
            alt="User avatar"
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="font-semibold text-gray-700">
            {getInitials(fullName)}
          </span>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>

      {/* Unread Notification Dot */}
      {hasUnread && (
        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-white shadow-sm" />
      )}
    </div>
  );
} 