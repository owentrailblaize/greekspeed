import { supabase } from '@/lib/supabase/client'

export enum ActivityTypes {
  LOGIN = 'login',
  PROFILE_VIEW = 'profile_view',
  PROFILE_UPDATE = 'profile_update',
  ALUMNI_VIEW = 'alumni_view',
  MESSAGE_SENT = 'message_sent',
  CONNECTION_REQUEST = 'connection_request'
}

export type ActivityStatus = 'hot' | 'warm' | 'cold'

export interface ActivityInfo {
  status: ActivityStatus
  color: string
  text: string
  timeAgo: string
  isOnline: boolean
}

/**
 * Get activity status based on lastActiveAt timestamp
 */
export function getActivityStatus(lastActiveAt?: string | null): ActivityInfo {
  if (!lastActiveAt) {
    return { 
      status: 'cold', 
      color: 'bg-gray-400', 
      text: 'No Activity', 
      timeAgo: 'No Activity',
      isOnline: false
    }
  }

  const lastActiveDate = new Date(lastActiveAt)
  const now = new Date()
  const diffMs = now.getTime() - lastActiveDate.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  if (diffHours < 1) {
    return { 
      status: 'hot', 
      color: 'bg-green-500', 
      text: 'Active Now', 
      timeAgo: 'Active Now',
      isOnline: true
    }
  } else if (diffHours < 24) {
    return { 
      status: 'warm', 
      color: 'bg-blue-500', 
      text: 'Recently Active', 
      timeAgo: 'Recently Active',
      isOnline: false
    }
  } else {
    return { 
      status: 'cold', 
      color: 'bg-gray-400', 
      text: 'Not Active', 
      timeAgo: 'Not Active',
      isOnline: false
    }
  }
}

/**
 * Get background color for activity status
 */
export function getActivityBgColor(status: ActivityStatus): string {
  const colors = {
    hot: 'bg-green-500',
    warm: 'bg-blue-500',
    cold: 'bg-gray-400'
  }
  return colors[status]
}

/**
 * Get text color for activity status
 */
export function getActivityColor(status: ActivityStatus): string {
  const colors = {
    hot: 'text-green-600',
    warm: 'text-blue-600',
    cold: 'text-gray-500'
  }
  return colors[status]
}

/**
 * Get label for activity status
 */
export function getActivityLabel(status: ActivityStatus): string {
  const labels = {
    hot: 'Active Now',
    warm: 'Recently Active',
    cold: 'Not Active'
  }
  return labels[status]
}

/**
 * Simple activity tracking that updates the profiles table via server-side API
 */
export async function trackActivity(userId: string, activityType: ActivityTypes, metadata?: any) {
  try {
    const now = new Date().toISOString()
    
    // Call our server-side activity API
    const response = await fetch('/api/activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        activityType,
        metadata: {
          ...metadata,
          timestamp: now,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
          url: typeof window !== 'undefined' ? window.location.href : 'server'
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Failed to track activity:', errorData)
      return false
    }

    const result = await response.json()
    console.log('✅ Activity tracked:', { userId, activityType, timestamp: now })
    return true
  } catch (error) {
    console.error('❌ Activity tracking error:', error)
    return false
  }
}

/**
 * Update last login time specifically
 */
export async function updateLastLogin(userId: string) {
  try {
    return await trackActivity(userId, ActivityTypes.LOGIN, { 
      loginMethod: 'direct_update' 
    })
  } catch (error) {
    console.error('❌ Last login update error:', error)
    return false
  }
}

/**
 * Update last active time
 */
export async function updateLastActive(userId: string) {
  try {
    return await trackActivity(userId, ActivityTypes.PROFILE_VIEW, { 
      activitySource: 'direct_update' 
    })
  } catch (error) {
    console.error('❌ Last active update error:', error)
    return false
  }
}
