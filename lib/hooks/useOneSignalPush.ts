'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getDeviceType, getPlatform } from '@/lib/utils/pushUtils';
import { useAuth } from '@/lib/supabase/auth-context';

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: unknown) => void | Promise<void>>;
  }
}

export type PushPermissionState = 'granted' | 'denied' | 'default';

export interface UseOneSignalPushResult {
  permission: PushPermissionState;
  playerId: string | null;
  isSubscribed: boolean;
  isPushSupported: boolean;
  isLoading: boolean;
  requestPermission: () => Promise<void>;
}

function getBrowserPermission(): PushPermissionState {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'default';
  }
  const p = Notification.permission;
  if (p === 'granted' || p === 'denied' || p === 'default') return p;
  return 'default';
}

export function useOneSignalPush(userId: string | undefined): UseOneSignalPushResult {
  const [permission, setPermission] = useState<PushPermissionState>('default');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const initDone = useRef(false);
  const persistedPlayerId = useRef<string | null>(null);
  const { getAuthHeaders } = useAuth();

  // Bootstrap: run once on client, wait for OneSignal SDK and set initial state + listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      if (initDone.current) return;
      initDone.current = true;

      try {
        const supported = OneSignal.Notifications?.isPushSupported?.() ?? false;
        setIsPushSupported(supported);

        const browserPermission = getBrowserPermission();
        setPermission(browserPermission);

        const subId = OneSignal.User?.PushSubscription?.id ?? null;
        const optedIn = OneSignal.User?.PushSubscription?.optedIn ?? false;
        setPlayerId(subId);
        setIsSubscribed(optedIn);

        OneSignal.Notifications?.addEventListener?.('permissionChange', (granted: boolean) => {
          setPermission(granted ? 'granted' : 'denied');
        });

        OneSignal.User?.PushSubscription?.addEventListener?.('change', (event: { current?: { id?: string; optedIn?: boolean } }) => {
          const current = event?.current;
          if (current) {
            setPlayerId(current.id ?? null);
            setIsSubscribed(current.optedIn ?? false);
          }
        });
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  // Sync permission from browser when not loading (e.g. tab focus)
  useEffect(() => {
    if (!isLoading && typeof Notification !== 'undefined') {
      setPermission(getBrowserPermission());
    }
  }, [isLoading]);

  // Register device with our user when userId is available
  useEffect(() => {
    if (!userId) return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      try {
        await OneSignal.login(userId);
      } catch {
        // 409 or other; login is best-effort
      }
    });
  }, [userId]);

  // Persist subscription to backend when we have playerId and userId (no duplicate posts)
  useEffect(() => {
    if (!playerId) {
      persistedPlayerId.current = null;
      return;
    }
    if (!userId || persistedPlayerId.current === playerId) return;

    let headers: Record<string, string> = { 'Content-Type': 'application/json' };
    try {
      headers = { ...headers, ...getAuthHeaders() };
    } catch {
      return;
    }

    fetch('/api/notifications/push-subscription', {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({
        playerId,
        deviceType: getDeviceType(),
        platform: getPlatform(),
      }),
    })
      .then((res) => {
        if (res.ok) persistedPlayerId.current = playerId;
      })
      .catch(() => {});
  }, [playerId, userId, getAuthHeaders]);

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !window.OneSignalDeferred) return;

    window.OneSignalDeferred.push(async function (OneSignal: any) {
      await OneSignal.Notifications?.requestPermission?.();
    });
  }, []);

  return {
    permission,
    playerId,
    isSubscribed,
    isPushSupported,
    isLoading,
    requestPermission,
  };
}