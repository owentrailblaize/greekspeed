'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LottiePlayer } from '@/components/ui/LottiePlayer';
import { SplashColors } from '@/lib/constants/splashTheme';

const NETWORKING_ANIMATION_PATH = '/animations/networking.json';

/**
 * Full-screen mobile-only loading overlay with networking animation.
 * Takes up entire viewport height with no scroll.
 * Uses createPortal to render into document.body so position:fixed works
 * relative to the viewport (not affected by backdrop-filter on nav).
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

  const overlay = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden lg:hidden"
      style={{
        backgroundColor: SplashColors.light.background,
        height: '100dvh',
        minHeight: '100vh',
      }}
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: '85%',
          maxWidth: 400,
          height: 'min(55dvh, 400px)',
          minHeight: 400,
          transform: 'scale(1.4)',
        }}
      >
        <LottiePlayer
          src={NETWORKING_ANIMATION_PATH}
          loop
          className="w-full h-full"
        />
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(overlay, document.body);
}
