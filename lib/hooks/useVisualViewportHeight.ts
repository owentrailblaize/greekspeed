'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Returns the visual viewport height (visible area when keyboard is open).
 * Falls back to window.innerHeight when visualViewport is unavailable (SSR, old browsers).
 * Use for drawers/modals so content stays within the visible viewport when the keyboard is open.
 */
export function useVisualViewportHeight(): number {
  const [height, setHeight] = useState(() => {
    if (typeof window === 'undefined') return 768;
    return window.visualViewport?.height ?? window.innerHeight;
  });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setHeight(vv.height);
        rafRef.current = null;
      });
    };

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return height;
}
