'use client';

import { useState, useEffect } from 'react';
import { getPwaPlatform, isStandalone } from '@/lib/utils/pwaInstallUtils';
import type { PwaInstallState, BeforeInstallPromptEvent } from '@/types/pwa';

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
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const installed = isStandalone();
    const platform = getPwaPlatform();

    const updateState = (hasPromptEvent: boolean) => {
      setState((prev) => ({
        ...prev,
        isInstalled: installed,
        platform,
        canPromptInstall:
          !installed &&
          (platform === 'ios' || hasPromptEvent),
      }));
    };

    updateState(false);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      updateState(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return {
    ...state,
    deferredPrompt,
  };
}