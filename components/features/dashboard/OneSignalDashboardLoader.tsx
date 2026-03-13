'use client';

import { useEffect, useRef } from 'react';

const ONESIGNAL_SDK_URL = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: unknown) => void | Promise<void>>;
  }
}

interface OneSignalDashboardLoaderProps {
  /** When set, the OneSignal script is loaded and initialized (dashboard + logged-in only). */
  userId: string | undefined;
}

/**
 * Loads and initializes OneSignal only when the user is on the dashboard and identified.
 * Does not run on marketing, signup, or sign-in pages. Script is injected once when userId is defined.
 */
export function OneSignalDashboardLoader({ userId }: OneSignalDashboardLoaderProps) {
  const scriptInjected = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !userId) return;
    if (scriptInjected.current) return;
    const devId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID_DEV ?? '';
    const prodId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ?? '';
    const origin = window.location.origin;
    const isLocal = origin === 'http://localhost:3000' || origin === 'http://127.0.0.1:3000';
    const appId = isLocal ? devId : prodId;
    if (!appId) return;
    scriptInjected.current = true;
    // Force-hide OneSignal's default slidedown so only our custom prompt is used
    const styleId = 'onesignal-slidedown-hide';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        #onesignal-slidedown-container,
        #onesignal-slidedown-wrapper,
        .onesignal-slidedown-container,
        [id*="onesignal-slidedown"],
        [id*="onesignalSlidedown"],
        [class*="onesignal-slidedown"],
        [class*="OneSignalSlidedown"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `;
      document.head.appendChild(style);
    }
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      await OneSignal.init({
        appId,
        promptOptions: {
          slidedown: {
            prompts: [{ type: 'push', autoPrompt: false }],
          },
        },
      });
    });
    if (document.querySelector(`script[src="${ONESIGNAL_SDK_URL}"]`)) return;
    const script = document.createElement('script');
    script.src = ONESIGNAL_SDK_URL;
    script.defer = true;
    document.head.appendChild(script);
  }, [userId]);

  return null;
}
