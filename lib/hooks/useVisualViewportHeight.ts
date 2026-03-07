'use client';

import { useState, useEffect, useRef } from 'react';

export interface VisualViewportState {
  height: number;
  offsetTop: number;
}

/**
 * Returns the visual viewport height and offsetTop (visible area when keyboard is open).
 * Falls back to window.innerHeight / 0 when visualViewport is unavailable (SSR, old browsers).
 * Use for drawers/modals so content stays within the visible viewport and bottom pins above the keyboard.
 */
export function useVisualViewportHeight(): VisualViewportState {
  const [state, setState] = useState<VisualViewportState>(() => {
    if (typeof window === 'undefined') return { height: 768, offsetTop: 0 };
    const vv = window.visualViewport;
    return {
      height: vv?.height ?? window.innerHeight,
      offsetTop: vv?.offsetTop ?? 0
    };
  });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setState({ height: vv.height, offsetTop: vv.offsetTop });
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

  return state;
}
