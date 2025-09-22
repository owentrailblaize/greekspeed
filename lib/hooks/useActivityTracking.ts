import { useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/supabase/auth-context'
import { trackActivity, ActivityTypes } from '@/lib/utils/activityUtils'

export function useActivityTracking() {
  const { user } = useAuth()

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

  // Track activity periodically while user is active
  useEffect(() => {
    if (!user) return

    let intervalId: NodeJS.Timeout

    const startTracking = () => {
      // Track initial activity
      trackActivity(user.id, ActivityTypes.PROFILE_VIEW, {
        source: 'page_load',
        timestamp: new Date().toISOString()
      })

      // Track activity every 5 minutes while user is active
      intervalId = setInterval(() => {
        trackActivity(user.id, ActivityTypes.PROFILE_VIEW, {
          source: 'heartbeat',
          timestamp: new Date().toISOString()
        })
      }, 5 * 60 * 1000) // 5 minutes
    }

    const stopTracking = () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }

    // Start tracking when user is active
    startTracking()

    // Stop tracking when user becomes inactive (after 30 minutes)
    const inactivityTimer = setTimeout(() => {
      stopTracking()
    }, 30 * 60 * 1000) // 30 minutes

    // Track activity on user interaction
    const handleUserActivity = () => {
      clearTimeout(inactivityTimer)
      stopTracking()
      startTracking()
      
      // Reset inactivity timer
      setTimeout(() => {
        stopTracking()
      }, 30 * 60 * 1000)
    }

    // Add event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true)
    })

    return () => {
      stopTracking()
      clearTimeout(inactivityTimer)
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true)
      })
    }
  }, [user])

  return {
    trackPageView,
    trackInteraction
  }
}
