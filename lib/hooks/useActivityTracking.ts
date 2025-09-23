import { useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/supabase/auth-context'
import { trackActivity, ActivityTypes } from '@/lib/utils/activityUtils'

export function useActivityTracking() {
  const { user } = useAuth()
  const lastActivityTime = useRef<number>(0)
  const isTracking = useRef<boolean>(false)

  // Track activity on page view
  const trackPageView = useCallback(async (page: string) => {
    if (!user) return
    
    await trackActivity(user.id, ActivityTypes.PROFILE_VIEW, {
      page,
      timestamp: new Date().toISOString()
    })
  }, [user])

  // Track activity on user interaction
  const trackInteraction = useCallback(async (action: string, metadata?: any) => {
    if (!user) return
    
    await trackActivity(user.id, ActivityTypes.PROFILE_VIEW, {
      action,
      ...metadata,
      timestamp: new Date().toISOString()
    })
  }, [user])

  // Throttled activity tracking - only track once per minute maximum
  const throttledTrackActivity = useCallback(async () => {
    const now = Date.now()
    if (now - lastActivityTime.current < 60000) { // 60 seconds throttle
      return
    }
    
    if (!user || isTracking.current) return
    
    isTracking.current = true
    lastActivityTime.current = now
    
    try {
      await trackActivity(user.id, ActivityTypes.PROFILE_VIEW, {
        source: 'user_activity',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Activity tracking error:', error)
    } finally {
      isTracking.current = false
    }
  }, [user])

  // Track activity periodically while user is active
  useEffect(() => {
    if (!user) return

    let intervalId: NodeJS.Timeout
    let inactivityTimer: NodeJS.Timeout

    const startTracking = () => {
      // Track initial activity
      trackActivity(user.id, ActivityTypes.PROFILE_VIEW, {
        source: 'page_load',
        timestamp: new Date().toISOString()
      })

      // Track activity every 10 minutes while user is active (reduced from 5 minutes)
      intervalId = setInterval(() => {
        trackActivity(user.id, ActivityTypes.PROFILE_VIEW, {
          source: 'heartbeat',
          timestamp: new Date().toISOString()
        })
      }, 10 * 60 * 1000) // 10 minutes instead of 5
    }

    const stopTracking = () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }

    // Start tracking when user is active
    startTracking()

    // Stop tracking when user becomes inactive (after 30 minutes)
    const resetInactivityTimer = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer)
      }
      inactivityTimer = setTimeout(() => {
        stopTracking()
      }, 30 * 60 * 1000) // 30 minutes
    }

    // Track activity on user interaction (throttled)
    const handleUserActivity = () => {
      throttledTrackActivity() // Use throttled version instead of restarting everything
      resetInactivityTimer()
    }

    // Add event listeners for user activity (removed 'mousemove' to reduce spam)
    const events = ['mousedown', 'keypress', 'scroll', 'touchstart'] // Removed 'mousemove'
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true })
    })

    resetInactivityTimer()

    return () => {
      stopTracking()
      if (inactivityTimer) {
        clearTimeout(inactivityTimer)
      }
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity)
      })
    }
  }, [user, throttledTrackActivity])

  return {
    trackPageView,
    trackInteraction
  }
}