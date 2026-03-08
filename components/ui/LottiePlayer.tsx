'use client';

import { useEffect, useRef, useState } from 'react';
import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
import { cn } from '@/lib/utils';

export interface LottiePlayerProps {
  /** Path to the Lottie JSON (e.g. /animations/intro-animation.json) or raw animation data object */
  src: string | object;
  loop?: boolean;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

export function LottiePlayer({
  src,
  loop = false,
  speed = 1,
  onComplete,
  className,
}: LottiePlayerProps) {
  const [animationData, setAnimationData] = useState<object | null>(
    typeof src === 'object' ? src : null
  );
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);

  useEffect(() => {
    if (typeof src !== 'string') return;
    let cancelled = false;
    fetch(src)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setAnimationData(data);
      })
      .catch(() => {
        if (!cancelled) setAnimationData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    const ref = lottieRef.current;
    if (ref?.setSpeed && speed !== 1) ref.setSpeed(speed);
  }, [speed, animationData]);

  if (animationData === null && typeof src === 'string') {
    return <div className={cn('flex items-center justify-center', className)} />;
  }

  const data = animationData ?? (typeof src === 'object' ? src : null);
  if (data === null) return null;

  return (
    <div className={cn('w-full h-full', className)}>
      <Lottie
        animationData={data}
        loop={loop}
        lottieRef={lottieRef}
        onComplete={onComplete}
        onDataReady={() => {
          if (lottieRef.current?.setSpeed && speed !== 1) {
            lottieRef.current.setSpeed(speed);
          }
        }}
      />
    </div>
  );
}
