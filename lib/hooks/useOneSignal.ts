// lib/hooks/useOneSignal.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { OneSignalService, type OneSignalSubscription, type PermissionState } from '@/lib/services/push/oneSignalService';

export function useOneSignal() {
  const [subscription, setSubscription] = useState<OneSignalSubscription>({
    playerId: null,
    token: null,
    isSubscribed: false,
    permission: 'default',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load subscription status on mount
  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      const sub = await OneSignalService.getSubscription();
      setSubscription(sub);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  };

  const requestPermission = useCallback(async (): Promise<PermissionState> => {
    try {
      setLoading(true);
      setError(null);
      const permission = await OneSignalService.requestPermission();
      await loadSubscription(); // Reload after permission change
      return permission;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request permission';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const subscribe = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await OneSignalService.subscribe();
      await loadSubscription();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to subscribe';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await OneSignalService.unsubscribe();
      await loadSubscription();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unsubscribe';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    subscription,
    loading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    refresh: loadSubscription,
    isSupported: OneSignalService.isSupported(),
  };
}


