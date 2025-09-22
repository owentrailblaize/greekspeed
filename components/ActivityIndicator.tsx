import React from 'react';
import { cn } from '@/lib/utils';

interface ActivityIndicatorProps {
  lastActiveAt?: string | null;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ActivityIndicator({ 
  lastActiveAt, 
  showLabel = false, 
  size = 'md',
  className = '' 
}: ActivityIndicatorProps) {
  const getActivityStatus = (lastActiveAt?: string | null) => {
    if (!lastActiveAt) {
      return { status: 'cold' as const, color: 'bg-gray-400', text: 'No Activity', timeAgo: 'No Activity', isOnline: false }
    }

    const lastActiveDate = new Date(lastActiveAt)
    const now = new Date()
    const diffMs = now.getTime() - lastActiveDate.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    if (diffHours < 1) {
      return { status: 'hot' as const, color: 'bg-green-500', text: 'Active Now', timeAgo: 'Active Now', isOnline: true }
    } else if (diffHours < 24) {
      return { status: 'warm' as const, color: 'bg-blue-500', text: 'Recently Active', timeAgo: 'Recently Active', isOnline: false }
    } else {
      return { status: 'cold' as const, color: 'bg-gray-400', text: 'Not Active', timeAgo: 'Not Active', isOnline: false }
    }
  }

  const activityInfo = getActivityStatus(lastActiveAt);
  
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
  };
  
  const dotSize = sizeClasses[size];
  
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className="relative">
        <div 
          className={`${dotSize} rounded-full ${activityInfo.color}`}
          title={activityInfo.text}
        />
        {activityInfo.isOnline && (
          <div 
            className={`absolute -top-0.5 -right-0.5 ${size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5'} bg-green-400 rounded-full animate-pulse`}
          />
        )}
      </div>
      {showLabel && (
        <span className={`text-xs text-gray-600`}>
          {activityInfo.timeAgo}
        </span>
      )}
    </div>
  );
}

interface ActivityBadgeProps {
  lastActiveAt?: string | null;
  className?: string;
}

export function ActivityBadge({ lastActiveAt, className = '' }: ActivityBadgeProps) {
  const getActivityStatus = (lastActiveAt?: string | null): { status: 'hot' | 'warm' | 'cold'; color: string; text: string; timeAgo: string } => {
    if (!lastActiveAt) {
      return { status: 'cold', color: 'bg-gray-400', text: 'No Activity', timeAgo: 'No Activity' }
    }

    const lastActiveDate = new Date(lastActiveAt)
    const now = new Date()
    const diffMs = now.getTime() - lastActiveDate.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    if (diffHours < 1) {
      return { status: 'hot', color: 'bg-green-500', text: 'Active Now', timeAgo: 'Active Now' }
    } else if (diffHours < 24) {
      return { status: 'warm', color: 'bg-blue-500', text: 'Recently Active', timeAgo: 'Recently Active' }
    } else {
      return { status: 'cold', color: 'bg-gray-400', text: 'Not Active', timeAgo: 'Not Active' }
    }
  }

  const activityInfo = getActivityStatus(lastActiveAt);
  
  const badgeColors = {
    hot: 'bg-green-100 text-green-800 border-green-200',
    warm: 'bg-blue-100 text-blue-800 border-blue-200',
    cold: 'bg-gray-100 text-gray-600 border-gray-200'
  } as const;
  
  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-medium ${badgeColors[activityInfo.status]} ${className}`}>
      <div className={`w-2 h-2 rounded-full ${activityInfo.color}`} />
      <span>{activityInfo.timeAgo}</span>
    </div>
  );
}

interface ActivityStatusTextProps {
  lastActiveAt?: string | null;
  className?: string;
}

export function ActivityStatusText({ lastActiveAt, className = '' }: ActivityStatusTextProps) {
  const activityInfo = getActivityStatus(lastActiveAt);
  
  return (
    <span className={`text-sm ${getActivityColor(activityInfo.status)} ${className}`}>
      {activityInfo.isOnline ? 'Online' : activityInfo.timeAgo}
    </span>
  );
}
