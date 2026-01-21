'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ViewportState {
  visualHeight: number;
  keyboardHeight: number;
  isKeyboardVisible: boolean;
  isMobile: boolean;
}

interface ViewportContextType {
  viewport: ViewportState;
  lockScroll: (locked: boolean) => void;
}

const ViewportContext = createContext<ViewportContextType | undefined>(undefined);

export function ViewportProvider({ children }: { children: ReactNode }) {
  const [viewport, setViewport] = useState<ViewportState>({
    visualHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    keyboardHeight: 0,
    isKeyboardVisible: false,
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 640 : false,
  });

  // Update viewport state and CSS variables
  const updateViewport = () => {
    if (typeof window === 'undefined') return;

    const isMobile = window.innerWidth < 640;
    const layoutHeight = window.innerHeight;
    
    if (window.visualViewport) {
      const vv = window.visualViewport;
      const visualHeight = vv.height;
      const offsetTop = vv.offsetTop || 0;
      const keyboardHeight = Math.max(0, layoutHeight - visualHeight - offsetTop);
      const isKeyboardVisible = keyboardHeight > 50; // Threshold for "visible"

      // Update CSS variables
      document.documentElement.style.setProperty('--vvh', `${visualHeight}px`);
      document.documentElement.style.setProperty('--kb', `${keyboardHeight}px`);

      setViewport({
        visualHeight,
        keyboardHeight,
        isKeyboardVisible,
        isMobile,
      });
    } else {
      // Fallback for browsers without Visual Viewport API
      document.documentElement.style.setProperty('--vvh', `${layoutHeight}px`);
      document.documentElement.style.setProperty('--kb', '0px');
      
      setViewport(prev => ({
        ...prev,
        visualHeight: layoutHeight,
        keyboardHeight: 0,
        isKeyboardVisible: false,
        isMobile,
      }));
    }
  };

  // Initialize and listen to viewport changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initial update
    updateViewport();

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', updateViewport);
      vv.addEventListener('scroll', updateViewport);
    }

    window.addEventListener('resize', updateViewport);

    return () => {
      if (vv) {
        vv.removeEventListener('resize', updateViewport);
        vv.removeEventListener('scroll', updateViewport);
      }
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

  // Body scroll lock utility
  const lockScroll = (locked: boolean) => {
    if (typeof window === 'undefined') return;

    const body = document.body;
    const html = document.documentElement;

    if (locked) {
      const y = window.scrollY;
      body.style.position = 'fixed';
      body.style.top = `-${y}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';
      html.style.overflow = 'hidden';
      body.dataset.scrollY = String(y);
    } else {
      const y = Number(body.dataset.scrollY || '0');
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.width = '';
      html.style.overflow = '';
      window.scrollTo(0, y);
      delete body.dataset.scrollY;
    }
  };

  return (
    <ViewportContext.Provider value={{ viewport, lockScroll }}>
      {children}
    </ViewportContext.Provider>
  );
}

export function useViewport() {
  const context = useContext(ViewportContext);
  if (context === undefined) {
    throw new Error('useViewport must be used within a ViewportProvider');
  }
  return context;
}

