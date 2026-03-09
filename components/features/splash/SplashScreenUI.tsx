'use client';

import { LottiePlayer } from '@/components/ui/LottiePlayer';
import { SplashColors } from '@/lib/constants/splashTheme';

const INTRO_ANIMATION_PATH = '/animations/intro-animation.json';

export interface SplashScreenUIProps {
  /** Called when the intro Lottie animation finishes (used for logged-out redirect gate). */
  onAnimationFinish: () => void;
  /** Theme for background color; defaults to light. */
  theme?: 'light' | 'dark';
}

export function SplashScreenUI({ onAnimationFinish, theme = 'light' }: SplashScreenUIProps) {
  const backgroundColor = SplashColors[theme].background;

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ backgroundColor }}
    >
      <div
        className="flex items-center justify-center w-[280px] h-[280px]"
        style={{ transform: 'scale(1.8)' }}
      >
        <LottiePlayer
          src={INTRO_ANIMATION_PATH}
          loop={false}
          speed={0.5}
          onComplete={onAnimationFinish}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
