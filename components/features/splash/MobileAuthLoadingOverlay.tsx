'use client';

import { useEffect } from 'react';
import { LottiePlayer } from '@/components/ui/LottiePlayer';
import { SplashColors } from '@/lib/constants/splashTheme';

const NETWORKING_ANIMATION_PATH = '/animations/networking.json';

/**
 * Full-screen mobile-only loading overlay with networking animation.
 * Takes up entire viewport height with no scroll.
 */
export function MobileAuthLoadingOverlay() {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: SplashColors.light.background,
        height: '100dvh',
        minHeight: '100vh',
      }}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-[70%] max-w-[200px] h-[180px] flex items-center justify-center">
        <LottiePlayer
          src={NETWORKING_ANIMATION_PATH}
          loop
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
