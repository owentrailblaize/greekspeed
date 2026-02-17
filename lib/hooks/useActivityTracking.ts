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

  // Track activity on user interaction (kept for manual use if needed)
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
    let deferTimerId: ReturnType<typeof setTimeout> | undefined
    let idleCallbackId: number | undefined

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

    // ---------------------------------------------------------------
    // DEFERRED: Wait ~3s before first activity ping so it doesn't
    // compete with critical dashboard data fetches (feed, profile).
    // Uses requestIdleCallback where available for best-effort
    // scheduling, with a plain setTimeout fallback.
    // ---------------------------------------------------------------
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleCallbackId = (window as any).requestIdleCallback(
        () => startTracking(),
        { timeout: 3000 },
      )
    } else {
      deferTimerId = setTimeout(() => startTracking(), 3000)
    }

    // Stop tracking when user becomes inactive (after 30 minutes)
    const inactivityTimer = setTimeout(() => {
      stopTracking()
    }, 30 * 60 * 1000) // 30 minutes

    return () => {
      if (idleCallbackId != null && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        (window as any).cancelIdleCallback(idleCallbackId)
      }
      if (deferTimerId) clearTimeout(deferTimerId)
      stopTracking()
      clearTimeout(inactivityTimer)
    }
  }, [user])

  return {
    trackPageView,
    trackInteraction
  }
}