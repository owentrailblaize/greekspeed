'use client';

import { useState, useEffect, useRef } from 'react';
import { getPwaPlatform, isStandalone } from '@/lib/utils/pwaInstallUtils';
import type { PwaInstallState, PwaPlatform, BeforeInstallPromptEvent } from '@/types/pwa';

const DEFAULT_STATE: PwaInstallState = {
  isInstalled: false,
  platform: 'desktop',
  canPromptInstall: false,
};

/**
 * Exposes PWA install state for A2HS and push opt-in flow.
 * - isInstalled: from standalone/display-mode (and iOS navigator.standalone).
 * - platform: ios | android | desktop.
 * - canPromptInstall: true when we can show install UI (iOS and not installed, or Android/Desktop with beforeinstallprompt).
 * - deferredPrompt: the beforeinstallprompt event for Android/Chrome (call .prompt() when user taps Install).
 */
export function usePwaInstallState(): PwaInstallState & {
  deferredPrompt: BeforeInstallPromptEvent | null;
} {
  const [state, setState] = useState<PwaInstallState>(DEFAULT_STATE);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const installed = isStandalone();
    const platform = getPwaPlatform();

    const updateCanPrompt = (hasPromptEvent: boolean, currentPlatform: PwaPlatform) => {
        setState((prev) => ({
        ...prev,
        isInstalled: installed,
        platform: currentPlatform,
        canPromptInstall:
          !installed &&
          (currentPlatform === 'ios' || hasPromptEvent),
      }));
    };

    setState((prev) => ({
      ...prev,
      isInstalled: installed,
      platform,
      canPromptInstall: !installed && platform === 'ios',
    }));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      updateCanPrompt(true, platform);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return {
    ...state,
    deferredPrompt: deferredPromptRef.current,
  };
}